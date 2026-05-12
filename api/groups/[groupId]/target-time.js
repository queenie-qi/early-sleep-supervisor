import { sql } from '../../db.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { groupId } = req.query;
  const { targetTime } = req.body;

  if (!targetTime) {
    return res.status(400).json({ error: '缺少目标时间' });
  }

  try {
    const result = await sql`
      UPDATE groups SET target_time = ${targetTime}
      WHERE id = ${groupId}
      RETURNING *
    `;
    const group = result.rows[0];
    res.json({ group });
  } catch (error) {
    console.error('Update group target time error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}
