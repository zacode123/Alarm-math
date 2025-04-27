# Advanced Alarm Clock Application

An advanced web-based alarm clock application that transforms morning routines into an engaging, interactive experience with intelligent personalization and user-centric design.

## Tech Stack

- React frontend with TypeScript
- PostgreSQL database integration
- Drizzle ORM for database interactions
- Framer Motion for advanced animations
- Tailwind CSS for responsive styling
- Service Worker for offline support
- Dynamic time picker with smooth interactions
- Cross-platform web compatibility

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies

```bash
npm install
```

3. Configure environment variables

Create a `.env` file in the root directory based on the template provided in `.env.example`. For local development, you can use the following settings:

```
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/alarmapp
PGUSER=postgres
PGHOST=localhost
PGPASSWORD=password
PGDATABASE=alarmapp
PGPORT=5432

# Application Configuration
NODE_ENV=development
PORT=5000

# Security Settings
SESSION_SECRET=your_local_dev_secret
```

4. Start the development server

```bash
npm run dev
```

### Database Setup

The application uses Drizzle ORM to interact with the PostgreSQL database. Run the following command to set up the database schema:

```bash
npm run db:push
```

## Features

- Create and manage alarms with customizable settings
- Support for recurring alarms on specific days of the week
- Different difficulty levels for alarm dismissal (math problems)
- Custom ringtones support
- Vibration options
- Offline functionality through Service Workers
- Responsive design for all devices

## Environment Variables

The following environment variables are used by the application:

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection URL | Yes |
| PGUSER | PostgreSQL username | Yes |
| PGHOST | PostgreSQL host | Yes |
| PGPASSWORD | PostgreSQL password | Yes |
| PGDATABASE | PostgreSQL database name | Yes |
| PGPORT | PostgreSQL port | Yes |
| NODE_ENV | Environment (development/production) | Yes |
| PORT | Application port | No (default: 5000) |
| SESSION_SECRET | Secret for session encryption | Yes |

## Deployment

To deploy this application, set up the required environment variables on your hosting provider. For Replit, you can use the Deployment feature in the platform.