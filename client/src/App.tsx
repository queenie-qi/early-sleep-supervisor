import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Upload from './pages/Upload';
import MyRecords from './pages/MyRecords';
import GroupRecords from './pages/GroupRecords';
import Login from './pages/Login';

function App() {
  const [userId, setUserId] = useState<number | null>(() => {
    const stored = localStorage.getItem('userId');
    return stored ? Number(stored) : null;
  });
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('nickname') || '';
  });

  const handleLogin = (id: number, name: string) => {
    setUserId(id);
    setNickname(name);
    localStorage.setItem('userId', String(id));
    localStorage.setItem('nickname', name);
  };

  if (!userId) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen font-duo">
        <div className="flex-1 pb-20">
          <Routes>
            <Route path="/" element={<Upload userId={userId} />} />
            <Route path="/records" element={<MyRecords userId={userId} />} />
            <Route path="/group" element={<GroupRecords userId={userId} />} />
            <Route path="/join/:inviteCode" element={<GroupRecords userId={userId} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>

        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t-2 border-duo-gray-6 flex">
      <NavTab to="/" label="打卡" icon="🏠" active={location.pathname === '/'} />
      <NavTab to="/records" label="记录" icon="📊" active={location.pathname === '/records'} />
      <NavTab to="/group" label="群组" icon="👥" active={location.pathname === '/group' || location.pathname.startsWith('/join/')} />
    </nav>
  );
}

function NavTab({ to, label, icon, active }: { to: string; label: string; icon: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`flex-1 flex flex-col items-center py-3 pb-6 text-xs font-bold transition-colors ${
        active
          ? 'text-duo-blue-base'
          : 'text-duo-gray-3'
      }`}
    >
      <span className={`text-xl mb-0.5 w-10 h-10 flex items-center justify-center rounded-duo ${
        active ? 'bg-duo-blue-ice' : ''
      }`}>{icon}</span>
      <span className="text-[11px]">{label}</span>
    </Link>
  );
}

export default App;
