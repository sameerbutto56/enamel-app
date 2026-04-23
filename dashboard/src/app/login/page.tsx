'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, token, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      router.push('/');
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login({ email, password });
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1759310348050-e64fead4f21a')] bg-cover bg-center grayscale" />
      </div>

      <div className="w-full max-w-md bg-white p-8 border border-gray-200 shadow-sm z-10">
        <p className="font-mono text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Company Access</p>
        <h1 className="text-4xl font-black tracking-tighter mb-8">ENAMELS</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-mono text-[10px] font-bold text-gray-700 uppercase mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 bg-gray-50 border border-gray-300 px-4 focus:ring-1 focus:ring-black focus:border-black outline-none transition-all"
              placeholder="admin@enamels.com"
              required
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] font-bold text-gray-700 uppercase mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 bg-gray-50 border border-gray-300 px-4 focus:ring-1 focus:ring-black focus:border-black outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600 font-bold">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 bg-black text-white font-bold uppercase tracking-widest hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={20} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <p className="mt-8 text-xs text-gray-400 text-center font-mono">
          © 2024 ENAMELS INC.
        </p>
      </div>
    </main>
  );
}
