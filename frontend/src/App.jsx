import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Card from './components/ui/Card';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import { useAuth } from './hooks/useAuth';

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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm" variant="elevated">
        <h1 className="mb-1 text-center text-2xl font-bold text-primary">
          JARVIS<span className="text-accent">.</span>
        </h1>
        <p className="mb-6 text-center text-sm text-muted">Your personal assistant</p>
        <form onSubmit={submit} className="space-y-3">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <Button type="submit" loading={loading} className="w-full">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
        <button
          className="mt-4 w-full text-center text-xs text-muted hover:text-white/75"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? "No account? Register" : 'Have an account? Sign in'}
        </button>
      </Card>
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Login />;

  return (
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
  );
}
