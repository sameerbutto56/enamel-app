'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Sidebar from './Sidebar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login');
    }
  }, [isLoading, token, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
        <Loader2 size={40} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">System Online</p>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-xs font-mono font-bold text-gray-400 hover:text-black uppercase">Help</button>
            <button className="text-xs font-mono font-bold text-gray-400 hover:text-black uppercase">Docs</button>
          </div>
        </header>
        <div className="p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
