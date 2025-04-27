import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';

// Create PostgreSQL session store
const PgSession = connectPgSimple(session);

// Default session secret for development
const DEFAULT_SESSION_SECRET = 'local_dev_secret_key';

// Session configuration
const sessionConfig = {
  store: new PgSession({
    pool,
    tableName: 'session', // Use default table name
    createTableIfMissing: true // Auto-create the session table if it doesn't exist
  }),
  secret: process.env.SESSION_SECRET || DEFAULT_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

export default sessionConfig;