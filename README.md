# Vitraga - GitHub Timeline Newsletter

A full-stack application that allows users to subscribe to GitHub timeline updates via email. Users can customize their subscription frequency (daily/weekly) and preferred send times.

## 🚀 Features

- **Email Subscriptions**: Subscribe to GitHub timeline updates via email
- **Flexible Scheduling**: Choose between daily or weekly delivery
- **Custom Timing**: Set your preferred send time in 24-hour format
- **Timezone Support**: Automatic timezone detection and handling
- **Send Now**: Test the service by sending an immediate email
- **Cron Jobs**: Automated email dispatch using scheduled tasks



## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd vitraga
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=your_email@gmail.com

# Optional: Cron Configuration
ENABLE_INTERNAL_CRON=true
CRON_SECRET=your_secret_key
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:3000
```

### 4. Database Setup
Create a `subscribers` table in your Supabase database:
```sql
CREATE TABLE subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
  send_time VARCHAR(10) NOT NULL DEFAULT '09:00',
  day_of_week INTEGER,
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  next_send_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```





1. **Start the backend server:**
```bash
cd backend
npm run dev
```

2. **Start the frontend development server:**
```bash
cd frontend
npm run dev
```

3. **Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

```

## 📡 API Endpoints

### `POST /api/signup`
Subscribe to the newsletter
```json
{
  "email": "user@example.com",
  "frequency": "daily|weekly",
  "send_time": "09:00",
  "day_of_week": 1,
  "timezone": "America/New_York"
}
```








## 📊 Database Schema

### Subscribers Table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| email | VARCHAR(255) | Unique email address |
| frequency | VARCHAR(20) | 'daily' or 'weekly' |
| send_time | VARCHAR(10) | Time in HH:MM format |
| day_of_week | INTEGER | Day of week (0-6, for weekly) |
| timezone | VARCHAR(50) | User's timezone |
| next_send_at | TIMESTAMP | Next scheduled send time |
| created_at | TIMESTAMP | Subscription creation time |



