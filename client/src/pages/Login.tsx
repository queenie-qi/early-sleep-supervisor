import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { login } from '../lib/api';

interface Props {
  onLogin: (id: number, nickname: string) => void;
}

export default function Login({ onLogin }: Props) {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const { inviteCode } = useParams();
  const navigate = useNavigate();

  // 如果有邀请码，保存到 localStorage，登录后自动加入
  useEffect(() => {
    if (inviteCode) {
      localStorage.setItem('pendingJoinCode', inviteCode);
    }
  }, [inviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setLoading(true);
    try {
      const { user } = await login(nickname.trim());
      onLogin(user.id, user.nickname);
      // 登录成功后，如果有邀请码会自动跳转（在 App.tsx 中处理）
    } catch (err) {
      alert('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-duo-green-base flex flex-col items-center justify-center p-6 font-duo">
      {/* Mascot area */}
      <div className="text-7xl mb-4">🌙</div>
      <h1 className="text-3xl font-extrabold text-white mb-1">早睡监督</h1>
      <p className="text-white/80 mb-8 text-center text-lg">
        {inviteCode ? '登录后即可加入群组' : '和朋友互相监督，养成早睡好习惯'}
      </p>

      {/* Card */}
      <form onSubmit={handleSubmit} className="w-full max-w-xs bg-white rounded-duo-card p-6 shadow-lg">
        <label className="block text-duo-text-secondary text-sm font-bold mb-2 text-center">你的昵称</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="输入昵称开始"
          className="w-full px-4 py-3 border-2 border-duo-gray-5 rounded-duo text-center text-lg font-bold text-duo-text-primary focus:outline-none focus:border-duo-blue-base transition-colors"
          maxLength={20}
        />
        <button
          type="submit"
          disabled={loading || !nickname.trim()}
          className={`w-full mt-4 h-12 rounded-duo font-extrabold text-base uppercase tracking-tight transition-all ${
            loading || !nickname.trim()
              ? 'bg-duo-gray-5 text-duo-gray-2'
              : 'bg-duo-green-base text-white shadow-[0_4px_0_0_#58a700] active:shadow-[0_2px_0_0_#58a700] active:translate-y-[2px]'
          }`}
        >
          {loading ? '进入中...' : inviteCode ? '加入群组' : '开始'}
        </button>
      </form>
    </div>
  );
}
