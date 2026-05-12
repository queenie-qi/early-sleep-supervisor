import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getMyGroups, createGroup, joinGroup, getGroupMembers, updateGroupTargetTime } from '../lib/api';

interface Props {
  userId: number;
}

export default function GroupRecords({ userId }: Props) {
  const { inviteCode } = useParams();
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [groupTargetTime, setGroupTargetTime] = useState('00:30');
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupTarget, setNewGroupTarget] = useState('00:30');
  const [joinCode, setJoinCode] = useState(inviteCode || '');
  const [loading, setLoading] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState('');

  useEffect(() => {
    loadGroups();
  }, [userId]);

  useEffect(() => {
    if (inviteCode) {
      handleJoin(inviteCode);
    }
  }, [inviteCode]);

  const loadGroups = async () => {
    const { groups: g } = await getMyGroups(userId);
    setGroups(g || []);
    if (g && g.length > 0 && !selectedGroup) {
      selectGroup(g[0]);
    }
  };

  const selectGroup = async (group: any) => {
    setSelectedGroup(group);
    setGroupTargetTime(group.target_time || '00:30');
    setEditingTarget(false);
    const { members: m } = await getGroupMembers(group.id);
    setMembers(m || []);
  };

  const handleCreate = async () => {
    if (!newGroupName.trim()) return;
    setLoading(true);
    try {
      const { group } = await createGroup(newGroupName.trim(), userId);
      if (newGroupTarget && newGroupTarget !== '00:30') {
        await updateGroupTargetTime(group.id, newGroupTarget);
      }
      setShowCreate(false);
      setNewGroupName('');
      setNewGroupTarget('00:30');
      await loadGroups();
      selectGroup(group);
    } catch {
      alert('创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (code?: string) => {
    const codeToUse = code || joinCode;
    if (!codeToUse.trim()) return;
    setLoading(true);
    try {
      const { group } = await joinGroup(codeToUse.trim(), userId);
      setShowJoin(false);
      setJoinCode('');
      await loadGroups();
      selectGroup(group);
    } catch {
      alert('加入失败，请检查邀请码');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTarget = async () => {
    if (!selectedGroup || !tempTarget) return;
    setLoading(true);
    try {
      const { group } = await updateGroupTargetTime(selectedGroup.id, tempTarget);
      setSelectedGroup(group);
      setGroupTargetTime(tempTarget);
      setEditingTarget(false);
    } catch {
      alert('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const shareLink = () => {
    if (!selectedGroup) return;
    const url = `${window.location.origin}/join/${selectedGroup.invite_code}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      alert('邀请链接已复制，发送给朋友即可加入');
    } else {
      prompt('复制以下链接发给朋友:', url);
    }
  };

  return (
    <div className="p-4 font-duo">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold text-duo-text-primary">群组</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoin(true)}
            className="text-sm px-4 py-2 rounded-duo border-2 border-duo-gray-6 bg-white text-duo-blue-base font-bold shadow-[0_3px_0_0_#e5e5e5] active:shadow-[0_1px_0_0_#e5e5e5] active:translate-y-[2px] transition-all"
          >
            加入
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm px-4 py-2 rounded-duo bg-duo-green-base text-white font-bold shadow-[0_3px_0_0_#58a700] active:shadow-[0_1px_0_0_#58a700] active:translate-y-[2px] transition-all"
          >
            创建
          </button>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="mb-4 p-4 bg-white border-2 border-duo-gray-6 rounded-duo-card">
          <label className="text-sm text-duo-text-secondary font-bold block mb-1">群组名称</label>
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="起个名字"
            className="w-full px-3 py-2 border-2 border-duo-gray-5 rounded-duo mb-3 font-bold text-duo-text-primary focus:outline-none focus:border-duo-blue-base"
          />
          <label className="text-sm text-duo-text-secondary font-bold block mb-1">目标入睡时间</label>
          <input
            type="time"
            value={newGroupTarget}
            onChange={(e) => setNewGroupTarget(e.target.value)}
            className="w-full px-3 py-2 border-2 border-duo-gray-5 rounded-duo mb-3 font-bold text-duo-text-primary text-center focus:outline-none focus:border-duo-blue-base"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={loading}
              className={`flex-1 h-11 rounded-duo font-bold text-sm transition-all ${
                loading
                  ? 'bg-duo-gray-5 text-duo-gray-2'
                  : 'bg-duo-green-base text-white shadow-[0_3px_0_0_#58a700] active:shadow-[0_1px_0_0_#58a700] active:translate-y-[2px]'
              }`}
            >
              {loading ? '创建中...' : '创建'}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 h-11 rounded-duo border-2 border-duo-gray-6 text-duo-text-secondary font-bold text-sm shadow-[0_3px_0_0_#e5e5e5] active:shadow-[0_1px_0_0_#e5e5e5] active:translate-y-[2px] transition-all">
              取消
            </button>
          </div>
        </div>
      )}

      {/* Join modal */}
      {showJoin && (
        <div className="mb-4 p-4 bg-white border-2 border-duo-gray-6 rounded-duo-card">
          <label className="text-sm text-duo-text-secondary font-bold block mb-1">邀请码</label>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="输入邀请码"
            className="w-full px-3 py-2 border-2 border-duo-gray-5 rounded-duo mb-3 font-bold text-duo-text-primary focus:outline-none focus:border-duo-blue-base"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleJoin()}
              disabled={loading}
              className={`flex-1 h-11 rounded-duo font-bold text-sm transition-all ${
                loading
                  ? 'bg-duo-gray-5 text-duo-gray-2'
                  : 'bg-duo-blue-base text-white shadow-[0_3px_0_0_#1899d6] active:shadow-[0_1px_0_0_#1899d6] active:translate-y-[2px]'
              }`}
            >
              {loading ? '加入中...' : '加入'}
            </button>
            <button onClick={() => setShowJoin(false)} className="px-4 h-11 rounded-duo border-2 border-duo-gray-6 text-duo-text-secondary font-bold text-sm shadow-[0_3px_0_0_#e5e5e5] active:shadow-[0_1px_0_0_#e5e5e5] active:translate-y-[2px] transition-all">
              取消
            </button>
          </div>
        </div>
      )}

      {/* Group tabs */}
      {groups.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {groups.map((g: any) => (
            <button
              key={g.id}
              onClick={() => selectGroup(g)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                selectedGroup?.id === g.id
                  ? 'bg-duo-blue-base text-white shadow-[0_2px_0_0_#1899d6]'
                  : 'bg-duo-gray-6 text-duo-text-secondary'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Group target time */}
      {selectedGroup && (
        <div className="mb-4 p-4 bg-[#fff8e8] border-2 border-duo-gold-base/30 rounded-duo-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <div>
                <div className="text-xs font-bold text-duo-gold-medium">群组目标</div>
                {editingTarget ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="time"
                      value={tempTarget}
                      onChange={(e) => setTempTarget(e.target.value)}
                      className="px-2 py-1 border-2 border-duo-gold-base/50 rounded-lg text-sm font-bold text-duo-text-primary focus:outline-none focus:border-duo-gold-base bg-white"
                    />
                    <button
                      onClick={handleSaveTarget}
                      disabled={loading}
                      className="px-3 py-1 rounded-lg bg-duo-gold-base text-white text-xs font-bold"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingTarget(false)}
                      className="px-2 py-1 text-xs font-bold text-duo-text-tertiary"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="text-lg font-extrabold text-duo-text-primary">{groupTargetTime} 前入睡</div>
                )}
              </div>
            </div>
            {!editingTarget && (
              <button
                onClick={() => { setEditingTarget(true); setTempTarget(groupTargetTime); }}
                className="text-duo-blue-base text-sm font-bold"
              >
                修改
              </button>
            )}
          </div>
        </div>
      )}

      {/* Share button */}
      {selectedGroup && (
        <button onClick={shareLink} className="w-full mb-4 h-11 rounded-duo border-2 border-duo-blue-base/30 bg-duo-blue-ice text-duo-blue-base font-bold text-sm">
          分享邀请链接
        </button>
      )}

      {/* Members list */}
      {members.length > 0 ? (
        <div className="space-y-3">
          {members.map((member: any) => (
            <div key={member.id} className="border-2 border-duo-gray-6 rounded-duo-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-duo-text-primary">{member.nickname}</span>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                  member.stats.rate >= 80 ? 'bg-duo-green-ice text-duo-green-dark' :
                  member.stats.rate >= 50 ? 'bg-[#fff8e8] text-duo-gold-medium' :
                  'bg-red-50 text-duo-red-base'
                }`}>
                  {member.stats.rate}% 达标
                </span>
              </div>
              <div className="flex gap-4 text-xs text-duo-text-secondary font-bold">
                <span>达标 {member.stats.achieved} 天</span>
                <span>🔥 连续 {member.stats.streak} 天</span>
              </div>
              {/* Mini calendar dots */}
              <div className="flex gap-0.5 mt-3 flex-wrap">
                {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const record = member.records?.find((r: any) => r.date === dateStr);
                  const isFuture = day > new Date().getDate();

                  let color = 'bg-duo-gray-5';
                  if (record) color = record.goal_achieved ? 'bg-duo-green-base' : 'bg-duo-red-base';
                  else if (isFuture) color = 'bg-duo-gray-6';

                  return <div key={day} className={`w-2.5 h-2.5 rounded-sm ${color}`} />;
                })}
              </div>
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">👥</div>
          <div className="font-extrabold text-duo-text-primary text-lg">还没有加入群组</div>
          <div className="text-sm mt-1 text-duo-text-secondary">创建或加入一个群组，和朋友一起早睡</div>
        </div>
      ) : null}
    </div>
  );
}
