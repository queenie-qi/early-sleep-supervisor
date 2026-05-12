CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL,
  avatar_url TEXT,
  target_time TEXT DEFAULT '00:00',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  target_time TEXT DEFAULT '00:30',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id INTEGER REFERENCES groups(id),
  user_id INTEGER REFERENCES users(id),
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS daily_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  date TEXT NOT NULL,
  screenshot_path TEXT,
  last_usage_time TEXT,
  is_manual_input INTEGER DEFAULT 0,
  goal_achieved INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);
