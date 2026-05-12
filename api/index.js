import { sql, initDb } from './db.js';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 8);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;

  try {
    switch (path) {
      // Health check
      case 'health':
        return res.json({ status: 'ok', timestamp: new Date().toISOString() });

      // Init database
      case 'init':
        if (req.method !== 'POST') return methodNotAllowed(res);
        await initDb();
        return res.json({ success: true, message: 'Database initialized' });

      // Auth routes
      case 'auth/login':
        if (req.method !== 'POST') return methodNotAllowed(res);
        return await authLogin(req, res);

      case 'auth/target-time':
        if (req.method !== 'PUT') return methodNotAllowed(res);
        return await authTargetTime(req, res);

      case 'auth/user':
        if (req.method !== 'GET') return methodNotAllowed(res);
        return await authGetUser(req, res);

      // Records routes
      case 'records/upload':
        if (req.method !== 'POST') return methodNotAllowed(res);
        return await recordsUpload(req, res);

      case 'records/today':
        if (req.method !== 'GET') return methodNotAllowed(res);
        return await recordsToday(req, res);

      case 'records/monthly':
        if (req.method !== 'GET') return methodNotAllowed(res);
        return await recordsMonthly(req, res);

      // Groups routes
      case 'groups/create':
        if (req.method !== 'POST') return methodNotAllowed(res);
        return await groupsCreate(req, res);

      case 'groups/join':
        if (req.method !== 'POST') return methodNotAllowed(res);
        return await groupsJoin(req, res);

      case 'groups/my':
        if (req.method !== 'GET') return methodNotAllowed(res);
        return await groupsMy(req, res);

      case 'groups/members':
        if (req.method !== 'GET') return methodNotAllowed(res);
        return await groupsMembers(req, res);

      case 'groups/target-time':
        if (req.method !== 'PUT') return methodNotAllowed(res);
        return await groupsTargetTime(req, res);

      case 'groups/get':
        if (req.method !== 'GET') return methodNotAllowed(res);
        return await groupsGet(req, res);

      default:
        return res.status(404).json({ error: 'Not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function methodNotAllowed(res) {
  return res.status(405).json({ error: 'Method not allowed' });
}

// Auth handlers
async function authLogin(req, res) {
  const { nickname } = req.body;
  if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
    return res.status(400).json({ error: '请输入昵称' });
  }

  const trimmed = nickname.trim();
  let result = await sql`SELECT * FROM users WHERE nickname = ${trimmed}`;
  let user = result.rows[0];

  if (!user) {
    result = await sql`INSERT INTO users (nickname) VALUES (${trimmed}) RETURNING *`;
    user = result.rows[0];
  }

  return res.json({ user });
}

async function authTargetTime(req, res) {
  const { userId, targetTime } = req.body;
  if (!userId || !targetTime) {
    return res.status(400).json({ error: '缺少参数' });
  }

  const result = await sql`
    UPDATE users SET target_time = ${targetTime} WHERE id = ${userId}
    RETURNING *
  `;
  return res.json({ user: result.rows[0] });
}

async function authGetUser(req, res) {
  const { id } = req.query;
  const result = await sql`SELECT * FROM users WHERE id = ${id}`;
  const user = result.rows[0];
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  return res.json({ user });
}

// Records handlers
async function recordsUpload(req, res) {
  const { userId, date, sleepTime } = req.body;

  if (!userId || !date || !sleepTime) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  let result = await sql`SELECT target_time FROM users WHERE id = ${userId}`;
  const user = result.rows[0];
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  result = await sql`
    SELECT g.target_time FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = ${userId}
  `;
  const groupTargets = result.rows;

  let effectiveTarget = user.target_time;
  if (groupTargets.length > 0) {
    effectiveTarget = groupTargets
      .map(g => g.target_time)
      .reduce((strictest, current) => isStricter(current, strictest) ? current : strictest);
  }

  const goalAchieved = isTimeBeforeOrEqual(sleepTime, effectiveTarget) ? 1 : 0;

  result = await sql`
    INSERT INTO daily_records (user_id, date, last_usage_time, goal_achieved)
    VALUES (${userId}, ${date}, ${sleepTime}, ${goalAchieved})
    ON CONFLICT (user_id, date) DO UPDATE SET
      last_usage_time = EXCLUDED.last_usage_time,
      goal_achieved = EXCLUDED.goal_achieved
    RETURNING *
  `;

  return res.json({ record: result.rows[0], goalAchieved: !!goalAchieved });
}

async function recordsToday(req, res) {
  const { userId } = req.query;
  const today = new Date().toISOString().split('T')[0];
  const result = await sql`
    SELECT * FROM daily_records WHERE user_id = ${userId} AND date = ${today}
  `;
  return res.json({ record: result.rows[0] || null });
}

async function recordsMonthly(req, res) {
  const { userId, year, month } = req.query;
  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  const endDate = `${year}-${month.padStart(2, '0')}-31`;

  const result = await sql`
    SELECT * FROM daily_records
    WHERE user_id = ${userId} AND date BETWEEN ${startDate} AND ${endDate}
    ORDER BY date
  `;
  const records = result.rows;

  const total = records.length;
  const achieved = records.filter(r => r.goal_achieved).length;
  const streak = await calculateStreak(userId);

  return res.json({
    records,
    stats: {
      total,
      achieved,
      rate: total > 0 ? Math.round(achieved / total * 100) : 0,
      streak
    }
  });
}

// Groups handlers
async function groupsCreate(req, res) {
  const { name, userId, targetTime } = req.body;
  if (!name || !userId) {
    return res.status(400).json({ error: '缺少参数' });
  }

  const inviteCode = nanoid();
  const groupTargetTime = targetTime || '00:30';

  let result = await sql`
    INSERT INTO groups (name, invite_code, target_time)
    VALUES (${name}, ${inviteCode}, ${groupTargetTime})
    RETURNING *
  `;
  const group = result.rows[0];

  await sql`
    INSERT INTO group_members (group_id, user_id) VALUES (${group.id}, ${userId})
  `;

  return res.json({ group });
}

async function groupsJoin(req, res) {
  const { inviteCode, userId } = req.body;
  if (!inviteCode || !userId) {
    return res.status(400).json({ error: '缺少参数' });
  }

  let result = await sql`SELECT * FROM groups WHERE invite_code = ${inviteCode}`;
  const group = result.rows[0];

  if (!group) {
    return res.status(404).json({ error: '群组不存在' });
  }

  const existingResult = await sql`
    SELECT * FROM group_members WHERE group_id = ${group.id} AND user_id = ${userId}
  `;

  if (existingResult.rows.length > 0) {
    return res.json({ group, message: '已经是群组成员' });
  }

  await sql`INSERT INTO group_members (group_id, user_id) VALUES (${group.id}, ${userId})`;
  return res.json({ group });
}

async function groupsMy(req, res) {
  const { userId } = req.query;
  const result = await sql`
    SELECT g.* FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = ${userId}
  `;
  return res.json({ groups: result.rows });
}

async function groupsMembers(req, res) {
  const { groupId, month } = req.query;
  const targetMonth = month || new Date().toISOString().slice(0, 7);

  const groupResult = await sql`SELECT * FROM groups WHERE id = ${groupId}`;
  const group = groupResult.rows[0];

  const membersResult = await sql`
    SELECT u.id, u.nickname, u.avatar_url, u.target_time
    FROM users u
    JOIN group_members gm ON u.id = gm.user_id
    WHERE gm.group_id = ${groupId}
  `;
  const members = membersResult.rows;

  const startDate = `${targetMonth}-01`;
  const endDate = `${targetMonth}-31`;

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

  return res.json({
    members: membersWithStats,
    groupTargetTime: group?.target_time || '00:30'
  });
}

async function groupsTargetTime(req, res) {
  const { groupId, targetTime } = req.body;

  if (!targetTime) {
    return res.status(400).json({ error: '缺少目标时间' });
  }

  const result = await sql`
    UPDATE groups SET target_time = ${targetTime} WHERE id = ${groupId}
    RETURNING *
  `;
  return res.json({ group: result.rows[0] });
}

async function groupsGet(req, res) {
  const { groupId } = req.query;
  const result = await sql`SELECT * FROM groups WHERE id = ${groupId}`;
  const group = result.rows[0];

  if (!group) {
    return res.status(404).json({ error: '群组不存在' });
  }

  return res.json({ group });
}

// Helper functions
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
