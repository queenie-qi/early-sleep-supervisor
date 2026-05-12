import { sql } from '../db.js';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 8);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, userId, targetTime } = req.body;
  if (!name || !userId) {
    return res.status(400).json({ error: '缺少参数' });
  }

  try {
    const inviteCode = nanoid();
    const groupTargetTime = targetTime || '00:30';

    let result = await sql`
      INSERT INTO groups (name, invite_code, target_time)
      VALUES (${name}, ${inviteCode}, ${groupTargetTime})
      RETURNING *
    `;
    const group = result.rows[0];

    // Add creator as member
    await sql`
      INSERT INTO group_members (group_id, user_id)
      VALUES (${group.id}, ${userId})
    `;

    res.json({ group });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}
