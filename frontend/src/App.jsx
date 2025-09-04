import { useState } from "react";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";

function App() {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [time, setTime] = useState("09:00");
  const [day, setDay] = useState("1"); // Monday default
  const [msg, setMsg] = useState("");
  const [sendNowMsg, setSendNowMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure time is always in HH:MM 24-hour format
      let formattedTime = time;
      if (formattedTime.length === 4) formattedTime = "0" + formattedTime; // pad if needed
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          frequency,
          send_time: formattedTime,
          day_of_week: frequency === "weekly" ? Number(day) : null,
          timezone,
        }),
      });
      const data = await res.json();
      setMsg(data.message);
      setEmail("");
    } catch (err) {
      setMsg("Something went wrong. Please try again.");
      console.error(err);
    }
  };

  const handleSendNow = async () => {
    setSendNowMsg("");
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setSendNowMsg("Please enter a valid email to send now.");
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/send-now`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendNowMsg(`Sent to ${email}.`);
      } else {
        setSendNowMsg(data.message || "Failed to send.");
      }
    } catch (err) {
      setSendNowMsg("Error sending now.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f7fa",
        fontFamily: "'Inter', sans-serif",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "2.5rem",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "1.75rem",
            marginBottom: "1rem",
            color: "#111827",
          }}
        >
          GitHub Timeline Newsletter
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
          Subscribe to get GitHub updates at your preferred schedule.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              fontSize: "1rem",
            }}
          />

          <div style={{ textAlign: "left" }}>
            <label style={{ fontWeight: 500 }}>Frequency:</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
              }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div style={{ textAlign: "left", marginBottom: "1rem" }}>
            <label
              style={{
                fontWeight: 500,
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              Send Time:
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  padding: "0.25rem 0.75rem",
                  background: "#f9fafb",
                  display: "inline-block",
                }}
              >
                <TimePicker
                  onChange={setTime}
                  value={time}
                  format="HH:mm"
                  disableClock={true}
                  clearIcon={null}
                  hourPlaceholder="HH"
                  minutePlaceholder="MM"
                  amPmAriaLabel={null}
                  clockIcon={null}
                />
              </div>
              <span style={{ fontSize: "0.95rem", color: "#6b7280" }}>
                Time is in 24-hour format (e.g., 15:20 for 3:20 PM)
              </span>
            </div>
          </div>

          {frequency === "weekly" && (
            <div style={{ textAlign: "left" }}>
              <label style={{ fontWeight: 500 }}>Day of Week:</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                }}
              >
                <option value="0">Sunday</option>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            style={{
              padding: "0.75rem 1.25rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#2563eb",
              color: "#fff",
              fontWeight: "600",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Subscribe
          </button>
        </form>

        <div style={{ marginTop: "2rem", textAlign: "left" }}>
          <button
            onClick={handleSendNow}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#16a34a",
              color: "#fff",
              fontWeight: "600",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Send Now
          </button>
          {sendNowMsg && (
            <p
              style={{
                marginTop: "0.5rem",
                color: sendNowMsg.includes("Sent") ? "#16a34a" : "#dc2626",
                fontWeight: 500,
              }}
            >
              {sendNowMsg}
            </p>
          )}
        </div>

        {msg && (
          <p
            style={{
              marginTop: "1rem",
              color: msg.toLowerCase().includes("success")
                ? "#16a34a"
                : "#dc2626",
              fontWeight: "500",
            }}
          >
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
