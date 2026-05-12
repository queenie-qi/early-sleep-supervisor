import { sql } from '../db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nickname } = req.body;
  if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
    return res.status(400).json({ error: '请输入昵称' });
  }

  const trimmed = nickname.trim();

  try {
    // Check if user exists
    let result = await sql`SELECT * FROM users WHERE nickname = ${trimmed}`;
    let user = result.rows[0];

    if (!user) {
      // Create new user
      result = await sql`INSERT INTO users (nickname) VALUES (${trimmed}) RETURNING *`;
      user = result.rows[0];
    }

    res.json({ user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}
