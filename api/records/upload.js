import { sql } from '../db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, date, sleepTime } = req.body;

  if (!userId || !date || !sleepTime) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    // Get user's personal target time
    let result = await sql`SELECT target_time FROM users WHERE id = ${userId}`;
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // Get all group targets for this user
    result = await sql`
      SELECT g.target_time FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ${userId}
    `;
    const groupTargets = result.rows;

    // Determine effective target
    let effectiveTarget = user.target_time;
    if (groupTargets.length > 0) {
      effectiveTarget = groupTargets
        .map(g => g.target_time)
        .reduce((strictest, current) => {
          return isStricter(current, strictest) ? current : strictest;
        });
    }

    const goalAchieved = isTimeBeforeOrEqual(sleepTime, effectiveTarget) ? 1 : 0;

    // Upsert record
    result = await sql`
      INSERT INTO daily_records (user_id, date, last_usage_time, goal_achieved)
      VALUES (${userId}, ${date}, ${sleepTime}, ${goalAchieved})
      ON CONFLICT (user_id, date) DO UPDATE SET
        last_usage_time = EXCLUDED.last_usage_time,
        goal_achieved = EXCLUDED.goal_achieved
      RETURNING *
    `;

    const record = result.rows[0];
    res.json({ record, goalAchieved: !!goalAchieved });
  } catch (error) {
    console.error('Upload record error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
}

function isTimeBeforeOrEqual(time, target) {
  const [tH, tM] = time.split(':').map(Number);
  const [gH, gM] = target.split(':').map(Number);

  const timeMinutes = tH * 60 + tM;
  const targetMinutes = gH * 60 + gM;

  if (targetMinutes === 0) {
    return timeMinutes <= 24 * 60;
  }

  if (gH < 6) {
    if (tH >= 18) return true;
    return timeMinutes <= targetMinutes;
  }

  return timeMinutes <= targetMinutes;
}

function isStricter(a, b) {
  const [aH, aM] = a.split(':').map(Number);
  const [bH, bM] = b.split(':').map(Number);
  const normalize = (h, m) => {
    const mins = h * 60 + m;
    return mins >= 18 * 60 ? mins - 18 * 60 : mins + 6 * 60;
  };
  return normalize(aH, aM) < normalize(bH, bM);
}
