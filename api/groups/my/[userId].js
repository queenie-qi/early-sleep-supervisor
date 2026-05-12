import { sql } from '../../db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;

  try {
    const result = await sql`
      SELECT g.* FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ${userId}
    `;
    res.json({ groups: result.rows });
  } catch (error) {
    console.error('Get my groups error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}
