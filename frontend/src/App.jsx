import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Input from './components/ui/Input';
import Button from './components/ui/Button';
import { useAuth } from './hooks/useAuth';
import { useAppStore } from './store/appStore';
import { initBg } from './lib/jarvisBackground';

import Dashboard from './pages/Dashboard';
import Habits from './pages/Habits';
import Notes from './pages/Notes';
import Menu from './pages/Menu';
import Budget from './pages/Budget';
import Fitness from './pages/Fitness';
import Bike from './pages/Bike';
import Work from './pages/Work';
import Blajeni from './pages/Blajeni';

function Login() {
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (mode === 'login') await login(email, password);
    else await register(email, password);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="j-card" style={{ width: '100%', maxWidth: 360, padding: '2rem' }}>
        <h1 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          JARVIS<span style={{ color: 'var(--accent)' }}>.</span>
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--dim)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Your personal assistant
        </p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '0.25rem' }}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
        <button
          style={{ marginTop: '1rem', width: '100%', textAlign: 'center', fontSize: '0.75rem', color: 'var(--faint)', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'No account? Register' : 'Have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}

function BgCanvas() {
  const canvasRef = useRef(null);
  const tweaks = useAppStore(s => s.tweaks);
  const bgRef = useRef(null);

  useEffect(() => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    bgRef.current = initBg(canvas);
    return () => bgRef.current?.destroy();
  }, []);

  useEffect(() => {
    bgRef.current?.set({ accent: tweaks.accent, motion: tweaks.motion });
  }, [tweaks]);

  return null;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('jarvis:palette'));
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <BgCanvas />
      {!isAuthenticated ? (
        <Login />
      ) : (
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/fitness" element={<Fitness />} />
            <Route path="/bike" element={<Bike />} />
            <Route path="/work" element={<Work />} />
            <Route path="/blajeni" element={<Blajeni />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
    </>
  );
}
