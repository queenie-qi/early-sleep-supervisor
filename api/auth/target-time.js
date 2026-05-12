import { sql } from '../db.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, targetTime } = req.body;
  if (!userId || !targetTime) {
    return res.status(400).json({ error: '缺少参数' });
  }

  try {
    const result = await sql`
      UPDATE users SET target_time = ${targetTime} WHERE id = ${userId}
      RETURNING *
    `;
    const user = result.rows[0];
    res.json({ user });
  } catch (error) {
    console.error('Update target time error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}
