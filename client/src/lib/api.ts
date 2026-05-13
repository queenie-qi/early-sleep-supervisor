const BASE_URL = '/api';

export async function login(nickname: string) {
  const res = await fetch(`${BASE_URL}?path=auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname })
  });
  return res.json();
}

export async function updateTargetTime(userId: number, targetTime: string) {
  const res = await fetch(`${BASE_URL}?path=auth/target-time`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, targetTime })
  });
  return res.json();
}

export async function uploadRecord(userId: number, date: string, sleepTime: string) {
  const res = await fetch(`${BASE_URL}?path=records/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, date, sleepTime })
  });
  return res.json();
}

export async function getMonthlyRecords(userId: number, year: number, month: number) {
  const res = await fetch(`${BASE_URL}?path=records/monthly&userId=${userId}&year=${year}&month=${month}`);
  return res.json();
}

export async function getTodayRecord(userId: number) {
  const res = await fetch(`${BASE_URL}?path=records/today&userId=${userId}`);
  return res.json();
}

export async function createGroup(name: string, userId: number, targetTime?: string) {
  const res = await fetch(`${BASE_URL}?path=groups/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, userId, targetTime })
  });
  return res.json();
}

export async function joinGroup(inviteCode: string, userId: number) {
  const res = await fetch(`${BASE_URL}?path=groups/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteCode, userId })
  });
  return res.json();
}

export async function getMyGroups(userId: number) {
  const res = await fetch(`${BASE_URL}?path=groups/my&userId=${userId}`);
  return res.json();
}

export async function getGroupMembers(groupId: number, month?: string) {
  const params = new URLSearchParams({ path: 'groups/members', groupId: String(groupId) });
  if (month) params.set('month', month);
  const res = await fetch(`${BASE_URL}?${params}`);
  return res.json();
}

export async function updateGroupTargetTime(groupId: number, targetTime: string) {
  const res = await fetch(`${BASE_URL}?path=groups/target-time`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupId, targetTime })
  });
  return res.json();
}
