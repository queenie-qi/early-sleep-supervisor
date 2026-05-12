import { useState, useEffect } from 'react';
import { getMonthlyRecords, uploadRecord } from '../lib/api';

interface Props {
  userId: number;
}

export default function MyRecords({ userId }: Props) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, achieved: 0, rate: 0, streak: 0 });

  const [editDate, setEditDate] = useState<string | null>(null);
  const [sleepTime, setSleepTime] = useState('23:00');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRecords();
  }, [userId, year, month]);

  const loadRecords = async () => {
    const data = await getMonthlyRecords(userId, year, month);
    setRecords(data.records || []);
    setStats(data.stats || { total: 0, achieved: 0, rate: 0, streak: 0 });
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  const getRecordForDay = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return records.find((r: any) => r.date === dateStr);
  };

  const handleDayClick = (day: number) => {
    const today = new Date();
    const clickedDate = new Date(year, month - 1, day);
    if (clickedDate > today) return;

    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existing = getRecordForDay(day);
    setSleepTime(existing?.last_usage_time || '23:00');
    setEditDate(dateStr);
  };

  const handleSubmit = async () => {
    if (!editDate || !sleepTime) return;

    setSubmitting(true);
    try {
      await uploadRecord(userId, editDate, sleepTime);
      setEditDate(null);
      loadRecords();
    } catch {
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 font-duo">
      <h1 className="text-2xl font-extrabold text-duo-text-primary mb-4">我的记录</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-duo-green-ice border-2 border-duo-green-light/50 rounded-duo-card p-3 text-center">
          <div className="text-2xl font-extrabold text-duo-green-base">{stats.achieved}</div>
          <div className="text-[11px] font-bold text-duo-green-dark">达标天数</div>
        </div>
        <div className="bg-duo-blue-ice border-2 border-duo-blue-light/50 rounded-duo-card p-3 text-center">
          <div className="text-2xl font-extrabold text-duo-blue-base">{stats.rate}%</div>
          <div className="text-[11px] font-bold text-duo-blue-medium">达标率</div>
        </div>
        <div className="bg-[#fff3e0] border-2 border-duo-gold-base/30 rounded-duo-card p-3 text-center">
          <div className="text-2xl font-extrabold text-duo-gold-orange">{stats.streak}</div>
          <div className="text-[11px] font-bold text-duo-gold-medium">连续天数</div>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-duo bg-duo-gray-6 text-duo-text-secondary font-bold">&lt;</button>
        <span className="font-extrabold text-duo-text-primary">{year}年{month}月</span>
        <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-duo bg-duo-gray-6 text-duo-text-secondary font-bold">&gt;</button>
      </div>

      {/* Calendar */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
          <div key={d} className="text-duo-text-tertiary py-1 text-xs font-bold">{d}</div>
        ))}

        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const record = getRecordForDay(day);
          const today = new Date();
          const isToday = year === today.getFullYear() && month === today.getMonth() + 1 && day === today.getDate();
          const isFuture = new Date(year, month - 1, day) > today;

          let bgColor = 'bg-duo-gray-6 text-duo-text-secondary';
          if (record) {
            bgColor = record.goal_achieved
              ? 'bg-duo-green-base text-white'
              : 'bg-duo-red-base text-white';
          } else if (isFuture) {
            bgColor = 'bg-white text-duo-gray-5';
          }

          return (
            <div
              key={day}
              onClick={() => !isFuture && handleDayClick(day)}
              className={`aspect-square flex items-center justify-center rounded-[10px] text-sm font-bold cursor-pointer ${bgColor} ${isToday ? 'ring-2 ring-duo-blue-base ring-offset-1' : ''} ${!isFuture ? 'active:scale-90 transition-transform' : ''}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-center mt-4 text-xs text-duo-text-secondary font-bold">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-duo-green-base inline-block" /> 达标
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-duo-red-base inline-block" /> 未达标
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-duo-gray-6 inline-block" /> 未记录
        </span>
      </div>
      <p className="text-center text-xs text-duo-text-tertiary mt-2">点击日期可补记/修改</p>

      {/* Edit modal */}
      {editDate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-[430px] rounded-t-[20px] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-lg text-duo-text-primary">
                {getRecordForDay(parseInt(editDate.split('-')[2])) ? '修改记录' : '补记'} — {editDate}
              </h2>
              <button onClick={() => setEditDate(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-duo-gray-6 text-duo-text-tertiary text-lg">&times;</button>
            </div>

            {(() => {
              const day = parseInt(editDate.split('-')[2]);
              const existing = getRecordForDay(day);
              if (existing) {
                return (
                  <div className={`mb-4 p-3 rounded-duo text-sm font-bold ${
                    existing.goal_achieved
                      ? 'bg-duo-green-ice text-duo-green-dark'
                      : 'bg-red-50 text-duo-red-base'
                  }`}>
                    当前记录: 入睡 {existing.last_usage_time}，{existing.goal_achieved ? '已达标' : '未达标'}
                  </div>
                );
              }
              return null;
            })()}

            <label className="text-sm text-duo-text-secondary font-bold block mb-2">入睡时间</label>
            <input
              type="time"
              value={sleepTime}
              onChange={(e) => setSleepTime(e.target.value)}
              className="w-full px-4 py-3 border-2 border-duo-gray-5 rounded-duo text-xl text-center font-mono font-bold text-duo-text-primary focus:outline-none focus:border-duo-blue-base transition-colors"
            />

            <button
              onClick={handleSubmit}
              disabled={submitting || !sleepTime}
              className={`w-full mt-4 h-12 rounded-duo font-extrabold text-base uppercase tracking-tight transition-all ${
                submitting || !sleepTime
                  ? 'bg-duo-gray-5 text-duo-gray-2'
                  : 'bg-duo-green-base text-white shadow-[0_4px_0_0_#58a700] active:shadow-[0_2px_0_0_#58a700] active:translate-y-[2px]'
              }`}
            >
              {submitting ? '提交中...' : '确认'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
