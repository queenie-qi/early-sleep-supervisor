import { sql } from '../../../db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  const today = new Date().toISOString().split('T')[0];

  try {
    const result = await sql`
      SELECT * FROM daily_records
      WHERE user_id = ${userId} AND date = ${today}
    `;
    res.json({ record: result.rows[0] || null });
  } catch (error) {
    console.error('Get today record error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}
