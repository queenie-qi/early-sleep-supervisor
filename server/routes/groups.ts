import { Router } from 'express';
import { nanoid } from 'nanoid';
import db from '../db/index.js';

const router = Router();

// Create a group
router.post('/create', (req, res) => {
  const { name, userId, targetTime } = req.body;
  if (!name || !userId) {
    return res.status(400).json({ error: '缺少参数' });
  }

  const inviteCode = nanoid(8);
  const groupTargetTime = targetTime || '00:30';

  const result = db.prepare('INSERT INTO groups (name, invite_code, target_time) VALUES (?, ?, ?)').run(name, inviteCode, groupTargetTime);
  const groupId = result.lastInsertRowid;

  // Add creator as member
  db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)').run(groupId, userId);

  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
  res.json({ group });
});

// Update group target time
router.put('/:groupId/target-time', (req, res) => {
  const { groupId } = req.params;
  const { targetTime } = req.body;
  if (!targetTime) {
    return res.status(400).json({ error: '缺少目标时间' });
  }

  db.prepare('UPDATE groups SET target_time = ? WHERE id = ?').run(targetTime, groupId);
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
  res.json({ group });
});

// Join a group by invite code
router.post('/join', (req, res) => {
  const { inviteCode, userId } = req.body;
  if (!inviteCode || !userId) {
    return res.status(400).json({ error: '缺少参数' });
  }

  const group = db.prepare('SELECT * FROM groups WHERE invite_code = ?').get(inviteCode) as any;
  if (!group) {
    return res.status(404).json({ error: '群组不存在' });
  }

  // Check if already member
  const existing = db.prepare('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?').get(group.id, userId);
  if (existing) {
    return res.json({ group, message: '已经是群组成员' });
  }

  db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)').run(group.id, userId);
  res.json({ group });
});

// Get user's groups
router.get('/my/:userId', (req, res) => {
  const groups = db.prepare(`
    SELECT g.* FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = ?
  `).all(req.params.userId);
  res.json({ groups });
});

// Get group members with their stats
router.get('/:groupId/members', (req, res) => {
  const { groupId } = req.params;
  const month = req.query.month as string || new Date().toISOString().slice(0, 7);

  // Get group info including target_time
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId) as any;

  const members = db.prepare(`
    SELECT u.id, u.nickname, u.avatar_url, u.target_time
    FROM users u
    JOIN group_members gm ON u.id = gm.user_id
    WHERE gm.group_id = ?
  `).all(groupId) as any[];

  const startDate = `${month}-01`;
  const endDate = `${month}-31`;

  const membersWithStats = members.map(member => {
    const records = db.prepare(
      'SELECT * FROM daily_records WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date'
    ).all(member.id, startDate, endDate) as any[];

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
      stats: { total, achieved, rate: total > 0 ? Math.round(achieved / total * 100) : 0, streak },
      records
    };
  });

  res.json({ members: membersWithStats, groupTargetTime: group?.target_time || '00:30' });
});

// Get group info
router.get('/:groupId', (req, res) => {
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.groupId);
  if (!group) {
    return res.status(404).json({ error: '群组不存在' });
  }
  res.json({ group });
});

export default router;
