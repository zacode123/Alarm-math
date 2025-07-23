import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';

// Create PostgreSQL session store only if pool is available
const PgSession = connectPgSimple(session);

// Default session secret for development
const DEFAULT_SESSION_SECRET = 'local_dev_secret_key';

// Session configuration - use PostgreSQL store if available, otherwise use default memory store
const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || DEFAULT_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Only add PostgreSQL store if pool is available
if (pool) {
  sessionConfig.store = new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: true
  });
}

export default sessionConfig;