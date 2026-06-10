import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAppStore } from '../store/appStore';

export function useAuth() {
  const { user, token, setAuth, logout } = useAppStore();
  const [loading, setLoading] = useState(false);

  async function submit(path, email, password) {
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/${path}`, { email, password });
      setAuth(data.user, data.token);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  return {
    user,
    isAuthenticated: !!token,
    loading,
    login: (email, password) => submit('login', email, password),
    register: (email, password) => submit('register', email, password),
    logout
  };
}
