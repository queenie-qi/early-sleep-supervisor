import { sql } from '../db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { inviteCode, userId } = req.body;
  if (!inviteCode || !userId) {
    return res.status(400).json({ error: '缺少参数' });
  }

  try {
    const result = await sql`
      SELECT * FROM groups WHERE invite_code = ${inviteCode}
    `;
    const group = result.rows[0];

    if (!group) {
      return res.status(404).json({ error: '群组不存在' });
    }

    // Check if already member
    const existingResult = await sql`
      SELECT * FROM group_members WHERE group_id = ${group.id} AND user_id = ${userId}
    `;

    if (existingResult.rows.length > 0) {
      return res.json({ group, message: '已经是群组成员' });
    }

    await sql`
      INSERT INTO group_members (group_id, user_id) VALUES (${group.id}, ${userId})
    `;

    res.json({ group });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}
