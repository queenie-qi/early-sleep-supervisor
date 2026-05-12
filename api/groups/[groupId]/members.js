import { sql } from '../../db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { groupId } = req.query;
  const month = req.query.month || new Date().toISOString().slice(0, 7);

  try {
    // Get group info
    const groupResult = await sql`
      SELECT * FROM groups WHERE id = ${groupId}
    `;
    const group = groupResult.rows[0];

    // Get members
    const membersResult = await sql`
      SELECT u.id, u.nickname, u.avatar_url, u.target_time
      FROM users u
      JOIN group_members gm ON u.id = gm.user_id
      WHERE gm.group_id = ${groupId}
    `;
    const members = membersResult.rows;

    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    const membersWithStats = await Promise.all(
      members.map(async (member) => {
        const recordsResult = await sql`
          SELECT * FROM daily_records
          WHERE user_id = ${member.id} AND date BETWEEN ${startDate} AND ${endDate}
          ORDER BY date
        `;
        const records = recordsResult.rows;

        const total = records.length;
        const achieved = records.filter(r => r.goal_achieved).length;

        // Calculate streak
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 60; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];
          const record = records.find(r => r.date === dateStr);
          if (record && record.goal_achieved) {
            streak++;
          } else {
            break;
          }
        }

        return {
          ...member,
          stats: {
            total,
            achieved,
            rate: total > 0 ? Math.round(achieved / total * 100) : 0,
            streak
          },
          records
        };
      })
    );

    res.json({
      members: membersWithStats,
      groupTargetTime: group?.target_time || '00:30'
    });
  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}
