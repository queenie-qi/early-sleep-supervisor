import { createPool } from '@vercel/postgres';

// Use DATABASE_URL from Neon (fallback to POSTGRES_URL for compatibility)
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export const sql = async (strings, ...values) => {
  const pool = createPool({ connectionString });
  const query = strings.reduce((acc, str, i) => acc + str + (values[i] !== undefined ? `$${i + 1}` : ''), '');
  const result = await pool.query(query, values);
  return result;
};

// Initialize database tables
export async function initDb() {
  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nickname TEXT NOT NULL,
        avatar_url TEXT,
        target_time TEXT DEFAULT '00:00',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Groups table
    await sql`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        invite_code TEXT UNIQUE NOT NULL,
        target_time TEXT DEFAULT '00:30',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Group members table
    await sql`
      CREATE TABLE IF NOT EXISTS group_members (
        group_id INTEGER REFERENCES groups(id),
        user_id INTEGER REFERENCES users(id),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (group_id, user_id)
      )
    `;

    // Daily records table
    await sql`
      CREATE TABLE IF NOT EXISTS daily_records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        date TEXT NOT NULL,
        screenshot_path TEXT,
        last_usage_time TEXT,
        is_manual_input INTEGER DEFAULT 0,
        goal_achieved INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, date)
      )
    `;

    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}
