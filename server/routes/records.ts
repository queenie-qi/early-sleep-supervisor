import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// Submit daily record (manual sleep time input)
router.post('/upload', (req, res) => {
  const { userId, date, sleepTime } = req.body;

  if (!userId || !date || !sleepTime) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  // Get user's personal target time as fallback
  const user = db.prepare('SELECT target_time FROM users WHERE id = ?').get(userId) as any;
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  // Get all group targets for this user
  const groupTargets = db.prepare(`
    SELECT g.target_time FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = ?
  `).all(userId) as any[];

  // Determine effective target: strictest (earliest) group target, or user fallback
  let effectiveTarget = user.target_time;
  if (groupTargets.length > 0) {
    // Use the strictest target — the one that requires sleeping earliest
    effectiveTarget = groupTargets
      .map(g => g.target_time)
      .reduce((strictest, current) => {
        return isStricter(current, strictest) ? current : strictest;
      });
  }

  const goalAchieved = isTimeBeforeOrEqual(sleepTime, effectiveTarget) ? 1 : 0;

  // Upsert record
  db.prepare(`
    INSERT INTO daily_records (user_id, date, last_usage_time, goal_achieved)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      last_usage_time = excluded.last_usage_time,
      goal_achieved = excluded.goal_achieved
  `).run(userId, date, sleepTime, goalAchieved);

  const record = db.prepare('SELECT * FROM daily_records WHERE user_id = ? AND date = ?').get(userId, date);
  res.json({ record, goalAchieved: !!goalAchieved });
});

// Get records for a user in a month
router.get('/monthly/:userId/:year/:month', (req, res) => {
  const { userId, year, month } = req.params;
  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  const endDate = `${year}-${month.padStart(2, '0')}-31`;

  const records = db.prepare(
    'SELECT * FROM daily_records WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date'
  ).all(userId, startDate, endDate);

  const total = records.length;
  const achieved = (records as any[]).filter(r => r.goal_achieved).length;
  const streak = calculateStreak(userId as any);

  res.json({ records, stats: { total, achieved, rate: total > 0 ? Math.round(achieved / total * 100) : 0, streak } });
});

// Get today's record
router.get('/today/:userId', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const record = db.prepare('SELECT * FROM daily_records WHERE user_id = ? AND date = ?').get(req.params.userId, today);
  res.json({ record: record || null });
});

function isTimeBeforeOrEqual(time: string, target: string): boolean {
  const [tH, tM] = time.split(':').map(Number);
  const [gH, gM] = target.split(':').map(Number);

  const timeMinutes = tH * 60 + tM;
  const targetMinutes = gH * 60 + gM;

  // Targets in the early morning (00:00–05:59) are "cross-midnight" targets.
  // e.g. target 00:30 means the user should sleep by 00:30.
  // A sleep time of 22:00–23:59 is definitely before that target (went to bed early).
  // A sleep time of 00:15 is also before the target.
  // A sleep time of 01:00 is after the target (too late).
  if (targetMinutes === 0) {
    // 00:00 means midnight — everything before midnight counts
    return timeMinutes <= 24 * 60;
  }

  if (gH < 6) {
    // Cross-midnight target: sleep times in the evening (18:00+) are always "before" the target
    if (tH >= 18) return true;
    // Early morning sleep times are compared directly
    return timeMinutes <= targetMinutes;
  }

  return timeMinutes <= targetMinutes;
}

// Returns true if targetA is stricter (earlier bedtime requirement) than targetB.
// For cross-midnight targets (e.g. 23:00 is stricter than 00:30 because you must sleep earlier).
function isStricter(a: string, b: string): boolean {
  const [aH, aM] = a.split(':').map(Number);
  const [bH, bM] = b.split(':').map(Number);
  // Normalize to a "bedtime number line" where evening hours come before morning
  // 18:00=0, 19:00=60, ..., 23:00=300, 00:00=360, ..., 05:00=660
  const normalize = (h: number, m: number) => {
    const mins = h * 60 + m;
    return mins >= 18 * 60 ? mins - 18 * 60 : mins + 6 * 60;
  };
  return normalize(aH, aM) < normalize(bH, bM);
}

function calculateStreak(userId: number): number {
  const records = db.prepare(
    'SELECT date, goal_achieved FROM daily_records WHERE user_id = ? ORDER BY date DESC LIMIT 60'
  ).all(userId) as any[];

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

export default router;
