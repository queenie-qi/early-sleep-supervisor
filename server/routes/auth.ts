import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// Simple registration/login by nickname
router.post('/login', (req, res) => {
  const { nickname } = req.body;
  if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
    return res.status(400).json({ error: '请输入昵称' });
  }

  const trimmed = nickname.trim();

  // Check if user exists
  let user = db.prepare('SELECT * FROM users WHERE nickname = ?').get(trimmed) as any;

  if (!user) {
    // Create new user
    const result = db.prepare('INSERT INTO users (nickname) VALUES (?)').run(trimmed);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  }

  res.json({ user });
});

// Update target time
router.put('/target-time', (req, res) => {
  const { userId, targetTime } = req.body;
  if (!userId || !targetTime) {
    return res.status(400).json({ error: '缺少参数' });
  }

  db.prepare('UPDATE users SET target_time = ? WHERE id = ?').run(targetTime, userId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  res.json({ user });
});

// Get user info
router.get('/user/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json({ user });
});

export default router;
