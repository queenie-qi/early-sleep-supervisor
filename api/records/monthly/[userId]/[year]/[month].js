import { sql } from '../../../../db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, year, month } = req.query;
  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  const endDate = `${year}-${month.padStart(2, '0')}-31`;

  try {
    const result = await sql`
      SELECT * FROM daily_records
      WHERE user_id = ${userId} AND date BETWEEN ${startDate} AND ${endDate}
      ORDER BY date
    `;
    const records = result.rows;

    const total = records.length;
    const achieved = records.filter(r => r.goal_achieved).length;
    const streak = await calculateStreak(userId);

    res.json({
      records,
      stats: {
        total,
        achieved,
        rate: total > 0 ? Math.round(achieved / total * 100) : 0,
        streak
      }
    });
  } catch (error) {
    console.error('Get monthly records error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}

async function calculateStreak(userId) {
  const result = await sql`
    SELECT date, goal_achieved
    FROM daily_records
    WHERE user_id = ${userId} AND goal_achieved = 1
    ORDER BY date DESC
    LIMIT 60
  `;
  const records = result.rows;

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

  return streak;
}
