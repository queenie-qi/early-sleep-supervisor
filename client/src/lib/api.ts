const BASE_URL = '/api';

export async function login(nickname: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname })
  });
  return res.json();
}

export async function updateTargetTime(userId: number, targetTime: string) {
  const res = await fetch(`${BASE_URL}/auth/target-time`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, targetTime })
  });
  return res.json();
}

export async function uploadRecord(userId: number, date: string, sleepTime: string) {
  const res = await fetch(`${BASE_URL}/records/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, date, sleepTime })
  });
  return res.json();
}

export async function getMonthlyRecords(userId: number, year: number, month: number) {
  const res = await fetch(`${BASE_URL}/records/monthly/${userId}/${year}/${month}`);
  return res.json();
}

export async function getTodayRecord(userId: number) {
  const res = await fetch(`${BASE_URL}/records/today/${userId}`);
  return res.json();
}

export async function createGroup(name: string, userId: number) {
  const res = await fetch(`${BASE_URL}/groups/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, userId })
  });
  return res.json();
}

export async function joinGroup(inviteCode: string, userId: number) {
  const res = await fetch(`${BASE_URL}/groups/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteCode, userId })
  });
  return res.json();
}

export async function getMyGroups(userId: number) {
  const res = await fetch(`${BASE_URL}/groups/my/${userId}`);
  return res.json();
}

export async function getGroupMembers(groupId: number, month?: string) {
  const params = month ? `?month=${month}` : '';
  const res = await fetch(`${BASE_URL}/groups/${groupId}/members${params}`);
  return res.json();
}

export async function updateGroupTargetTime(groupId: number, targetTime: string) {
  const res = await fetch(`${BASE_URL}/groups/${groupId}/target-time`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetTime })
  });
  return res.json();
}
