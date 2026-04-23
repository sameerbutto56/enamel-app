'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Monitor, 
  BarChart3, 
  Users, 
  LogOut,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Package, label: 'Inventory', href: '/inventory' },
  { icon: ShoppingCart, label: 'Orders', href: '/orders' },
  { icon: RotateCcw, label: 'Returns', href: '/returns' },
  { icon: Monitor, label: 'POS Terminal', href: '/pos' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: Users, label: 'Team', href: '/team' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  return (
    <aside className="w-64 bg-[#111827] text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-black tracking-tighter">ENAMELS</h1>
        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
          Internal Systems
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-sm transition-all group",
              pathname === item.href 
                ? "bg-[#EA580C] text-white font-bold" 
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <item.icon size={20} strokeWidth={pathname === item.href ? 2.5 : 2} />
            <span className="flex-1">{item.label}</span>
            {pathname === item.href && <ChevronRight size={14} />}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-4">
          <div className="w-10 h-10 bg-gray-700 rounded-sm flex items-center justify-center font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-bold truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:bg-red-900/20 hover:text-red-400 rounded-sm transition-all"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
