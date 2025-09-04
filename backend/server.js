// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
    createClient
} from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import axios from 'axios';
import {
    DateTime
} from 'luxon';

const app = express();

// ---------------- Middleware ----------------
app.use(cors());
app.use(express.json());

// ---------------- Supabase Client ----------------
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ---------------- Nodemailer Transport ----------------
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// ---------------- Helper: Send Email ----------------
async function sendEmail(to, subject, html) {
    try {
        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to,
            subject,
            html
        });
        console.log(`Email sent to ${to}`);
    } catch (err) {
        console.error(`Failed to send email to ${to}:`, err);
    }
}

// ---------------- Helper: Fetch GitHub Timeline ----------------
import fetch from 'node-fetch';

async function fetchTimeline(limit = 5) {
    try {
        const response = await fetch('https://api.github.com/events', {
            headers: {
                'User-Agent': 'gh-timeline-newsletter',
                'Accept': 'application/vnd.github.v3+json'
            },
            timeout: 10000
        });

        if (!response.ok) {
            throw new Error(`GitHub API responded with status ${response.status}`);
        }

        const events = await response.json();
        if (!Array.isArray(events) || events.length === 0) {
            console.warn('No events found or invalid response from GitHub API');
            return [];
        }

        return events.slice(0, Math.min(limit, events.length)).map(event => ({
            title: event.type || 'GitHub Event',
            url: event.repo && event.repo.name ? `https://github.com/${event.repo.name}` : '#',
            updated: event.created_at || new Date().toISOString()
        }));
    } catch (err) {
        console.error('Error fetching GitHub timeline:', err.message);
        return [];
    }
}

// ---------------- Helper: Render Email ----------------
function renderEmail(entries) {
    return `
    <h2>GitHub Updates</h2>
    <ul>
      ${entries
        .map(
          (e) =>
            `<li><a href="${e.url}" target="_blank">${e.title}</a> - ${new Date(
              e.updated
            ).toUTCString()}</li>`
        )
        .join('')}
    </ul>
  `;
}

// ---------------- Helper: Get Subscribers ----------------
async function getSubscribers() {
    const {
        data,
        error
    } = await supabase.from('subscribers').select('email');
    if (error) throw error;
    return data;
}

// ---------------- Routes ----------------

// Signup route
app.post('/api/signup', async (req, res) => {
    try {
        const {
            email,
            frequency = "daily",
            send_time = "09:00",
            day_of_week = null,
            timezone = "UTC"
        } = req.body;

        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({
                message: 'Valid email required'
            });
        }
        if (!timezone) {
            return res.status(400).json({
                message: 'Timezone required'
            });
        }

        // Calculate next_send_at in UTC
        let nextSend;
        const [hour, minute] = send_time.split(":").map(Number);
        const now = DateTime.now().setZone(timezone);
        if (frequency === "daily") {
            nextSend = now.set({
                hour,
                minute,
                second: 0,
                millisecond: 0
            });
            if (nextSend <= now) nextSend = nextSend.plus({
                days: 1
            });
        } else if (frequency === "weekly" && day_of_week !== null) {
            let daysToAdd = (Number(day_of_week) - now.weekday % 7 + 7) % 7;
            nextSend = now.set({
                hour,
                minute,
                second: 0,
                millisecond: 0
            }).plus({
                days: daysToAdd
            });
            if (nextSend <= now) nextSend = nextSend.plus({
                weeks: 1
            });
        } else {
            return res.status(400).json({
                message: 'Invalid frequency or day_of_week'
            });
        }
        const next_send_at = nextSend.toUTC().toISO();

        const {
            error
        } = await supabase.from('subscribers').insert({
            email,
            frequency,
            send_time,
            day_of_week,
            timezone,
            next_send_at
        });

        if (error && !/duplicate/i.test(error.message)) {
            return res.status(500).json({
                message: 'Error saving email'
            });
        }

        res.json({
            message: 'Subscribed successfully!'
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({
            message: 'Server error'
        });
    }
});

// Send newsletter immediately
app.post('/api/send-now', async (req, res) => {
    try {
        const {
            email
        } = req.body;
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({
                message: 'Valid email required'
            });
        }
        const entries = await fetchTimeline(5);
        if (!entries.length) return res.status(500).json({
            message: 'No entries to send'
        });
        const html = renderEmail(entries);
        await sendEmail(email, 'GitHub Updates', html);
        res.json({
            sent: 1
        });
    } catch (err) {
        console.error('Send-now error:', err);
        res.status(500).json({
            message: 'Failed to send email'
        });
    }
});

// ---------------- Cron Job ----------------
cron.schedule('* * * * *', async () => {
    try {
        const nowUtc = DateTime.utc();
        const {
            data: subscribers,
            error
        } = await supabase
            .from('subscribers')
            .select('*')
            .lte('next_send_at', nowUtc.toISO());
        if (error) throw error;
        if (!subscribers || !subscribers.length) return;
        const entries = await fetchTimeline(5);
        if (!entries.length) return;
        const html = renderEmail(entries);
        for (const sub of subscribers) {
            await sendEmail(sub.email, 'GitHub Updates', html);
            // Calculate next_send_at
            let nextSend;
            const [hour, minute] = sub.send_time.split(":").map(Number);
            const userNow = DateTime.now().setZone(sub.timezone);
            if (sub.frequency === "daily") {
                nextSend = userNow.set({
                    hour,
                    minute,
                    second: 0,
                    millisecond: 0
                });
                if (nextSend <= userNow) nextSend = nextSend.plus({
                    days: 1
                });
            } else if (sub.frequency === "weekly" && sub.day_of_week !== null) {
                let daysToAdd = (Number(sub.day_of_week) - userNow.weekday % 7 + 7) % 7;
                nextSend = userNow.set({
                    hour,
                    minute,
                    second: 0,
                    millisecond: 0
                }).plus({
                    days: daysToAdd
                });
                if (nextSend <= userNow) nextSend = nextSend.plus({
                    weeks: 1
                });
            }
            await supabase.from('subscribers').update({
                next_send_at: nextSend.toUTC().toISO()
            }).eq('email', sub.email);
        }
        console.log(`✅ Sent to ${subscribers.length} subscribers at ${nowUtc.toISO()}`);
    } catch (err) {
        console.error('Cron dispatcher error:', err);
    }
});



// ---------------- Start Server ----------------
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend running at http://localhost:${port}`));