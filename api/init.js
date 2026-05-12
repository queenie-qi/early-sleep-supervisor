import { initDb } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await initDb();
    res.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    console.error('Init error:', error);
    res.status(500).json({ error: error.message });
  }
}
