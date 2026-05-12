import { useState, useEffect, useCallback } from 'react';
import { uploadRecord, getTodayRecord } from '../lib/api';

interface Props {
  userId: number;
}

function Confetti() {
  const [particles] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.5,
      size: 6 + Math.random() * 8,
      color: ['#58cc02', '#1cb0f6', '#ffc800', '#ce82ff', '#ff4b4b', '#ff9600', '#79d634', '#63c9f9', '#ffd900', '#daa0ff'][i % 10],
      drift: (Math.random() - 0.5) * 60,
      rotation: Math.random() * 360,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            borderRadius: '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}px`,
            transform: `rotate(${p.rotation}deg)`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export default function Upload({ userId }: Props) {
  const [sleepTime, setSleepTime] = useState('23:00');
  const [submitting, setSubmitting] = useState(false);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState<{ achieved: boolean } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTime, setEditTime] = useState('');

  useEffect(() => {
    getTodayRecord(userId).then(({ record }) => setTodayRecord(record));
  }, [userId]);

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3500);
  }, []);

  const handleSubmit = async () => {
    if (!sleepTime) return;

    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { record, goalAchieved } = await uploadRecord(userId, today, sleepTime);
      setTodayRecord(record);
      setJustSubmitted({ achieved: goalAchieved });
      if (goalAchieved) {
        triggerConfetti();
      }
    } catch {
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editTime) return;

    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { record, goalAchieved } = await uploadRecord(userId, today, editTime);
      setTodayRecord(record);
      setIsEditing(false);
      setJustSubmitted({ achieved: goalAchieved });
      if (goalAchieved) {
        triggerConfetti();
      }
    } catch {
      alert('修改失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = () => {
    setEditTime(todayRecord?.last_usage_time || '23:00');
    setIsEditing(true);
    setJustSubmitted(null);
  };

  return (
    <div className="p-4 font-duo">
      {showConfetti && <Confetti />}

      <h1 className="text-2xl font-extrabold text-duo-text-primary mb-5">早睡打卡</h1>

      {/* Already checked in — show status */}
      {todayRecord && !justSubmitted && !isEditing && (
        <div className={`p-6 rounded-duo-card border-2 text-center ${
          todayRecord.goal_achieved
            ? 'bg-duo-green-ice border-duo-green-light'
            : 'bg-red-50 border-duo-red-light'
        }`}>
          <div className="text-5xl mb-3">{todayRecord.goal_achieved ? '🌟' : '😴'}</div>
          <div className={`text-xl font-extrabold ${
            todayRecord.goal_achieved ? 'text-duo-green-dark' : 'text-duo-red-base'
          }`}>
            {todayRecord.goal_achieved ? '今日已达标！' : '今日未达标'}
          </div>
          <div className="text-duo-text-secondary text-sm mt-1">
            入睡时间: <span className="font-bold">{todayRecord.last_usage_time}</span>
          </div>
          <button
            onClick={startEditing}
            className="mt-4 h-10 px-6 rounded-duo border-2 border-duo-gray-6 bg-white text-duo-blue-base font-bold text-sm shadow-[0_3px_0_0_#e5e5e5] active:shadow-[0_1px_0_0_#e5e5e5] active:translate-y-[2px] transition-all"
          >
            修改时间
          </button>
        </div>
      )}

      {/* Edit mode */}
      {isEditing && (
        <div className="p-6 rounded-duo-card border-2 border-duo-blue-base bg-duo-blue-ice text-center">
          <div className="text-3xl mb-2">✏️</div>
          <p className="text-duo-text-secondary font-bold mb-4">修改入睡时间</p>
          <input
            type="time"
            value={editTime}
            onChange={(e) => setEditTime(e.target.value)}
            className="w-48 mx-auto px-4 py-3 border-2 border-duo-gray-5 rounded-duo text-2xl text-center font-mono font-bold text-duo-text-primary focus:outline-none focus:border-duo-blue-base transition-colors bg-white"
          />
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 h-11 rounded-duo border-2 border-duo-gray-6 bg-white text-duo-text-secondary font-bold text-sm shadow-[0_3px_0_0_#e5e5e5] active:shadow-[0_1px_0_0_#e5e5e5] active:translate-y-[2px] transition-all"
            >
              取消
            </button>
            <button
              onClick={handleEditSubmit}
              disabled={submitting || !editTime}
              className={`flex-1 h-11 rounded-duo font-bold text-sm transition-all ${
                submitting || !editTime
                  ? 'bg-duo-gray-5 text-duo-gray-2'
                  : 'bg-duo-blue-base text-white shadow-[0_3px_0_0_#1899d6] active:shadow-[0_1px_0_0_#1899d6] active:translate-y-[2px]'
              }`}
            >
              {submitting ? '提交中...' : '确认修改'}
            </button>
          </div>
        </div>
      )}

      {/* Just submitted result */}
      {justSubmitted && !isEditing && (
        <div className={`p-8 rounded-duo-card border-2 text-center ${
          justSubmitted.achieved
            ? 'bg-duo-green-ice border-duo-green-light'
            : 'bg-[#fff8f0] border-duo-gold-base'
        }`}>
          <div className="text-6xl mb-3">{justSubmitted.achieved ? '🎉' : '💪'}</div>
          <div className={`text-xl font-extrabold ${
            justSubmitted.achieved ? 'text-duo-green-dark' : 'text-duo-gold-medium'
          }`}>
            {justSubmitted.achieved ? '太棒了！早睡达标！' : '明天继续加油！'}
          </div>
          <div className="text-duo-text-secondary text-sm mt-2">
            入睡时间: <span className="font-bold">{todayRecord?.last_usage_time}</span>
          </div>
          {justSubmitted.achieved && (
            <div className="text-sm text-duo-green-base mt-2 font-bold">保持好习惯，继续坚持！</div>
          )}
          <button
            onClick={startEditing}
            className="mt-4 h-10 px-6 rounded-duo border-2 border-duo-gray-6 bg-white text-duo-blue-base font-bold text-sm shadow-[0_3px_0_0_#e5e5e5] active:shadow-[0_1px_0_0_#e5e5e5] active:translate-y-[2px] transition-all"
          >
            修改时间
          </button>
        </div>
      )}

      {/* New check-in input */}
      {!todayRecord && !justSubmitted && (
        <div className="space-y-5">
          <div className="bg-white border-2 border-duo-gray-6 rounded-duo-card p-6 text-center">
            <div className="text-5xl mb-3">🌙</div>
            <p className="text-duo-text-primary font-bold text-lg mb-4">今天几点入睡的？</p>
            <input
              type="time"
              value={sleepTime}
              onChange={(e) => setSleepTime(e.target.value)}
              className="w-48 mx-auto px-4 py-3 border-2 border-duo-gray-5 rounded-duo text-2xl text-center font-mono font-bold text-duo-text-primary focus:outline-none focus:border-duo-green-base transition-colors"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !sleepTime}
            className={`w-full h-12 rounded-duo font-extrabold text-base uppercase tracking-tight transition-all ${
              submitting || !sleepTime
                ? 'bg-duo-gray-5 text-duo-gray-2'
                : 'bg-duo-green-base text-white shadow-[0_4px_0_0_#58a700] active:shadow-[0_2px_0_0_#58a700] active:translate-y-[2px]'
            }`}
          >
            {submitting ? '提交中...' : '打卡'}
          </button>
        </div>
      )}
    </div>
  );
}
