import { sql } from '../../db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { groupId } = req.query;

  try {
    const result = await sql`
      SELECT * FROM groups WHERE id = ${groupId}
    `;
    const group = result.rows[0];

    if (!group) {
      return res.status(404).json({ error: '群组不存在' });
    }

    res.json({ group });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}
