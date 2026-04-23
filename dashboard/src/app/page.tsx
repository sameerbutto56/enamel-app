'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/lib/store';
import { 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  AlertTriangle,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { companyApi } from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function DashboardPage() {
  const { token, isLoading: authLoading } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (authLoading || !token) return;
      
      setLoading(true);
      try {
        const [statsRes, ordersRes] = await Promise.all([
          companyApi.getAnalytics(),
          companyApi.getOrders({ limit: 5 })
        ]);
        setStats(statsRes.data);
        setRecentOrders(ordersRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token, authLoading]);

  const statCards = [
    { label: 'Total Revenue', value: formatCurrency(stats?.total_revenue || 0), icon: TrendingUp, color: 'text-green-600' },
    { label: 'Total Orders', value: stats?.total_orders || 0, icon: ShoppingBag, color: 'text-blue-600' },
    { label: 'Pending Fulfillment', value: stats?.by_status?.placed?.count || 0, icon: Clock, color: 'text-orange-600' },
    { label: 'Low Stock Alerts', value: 3, icon: AlertTriangle, color: 'text-red-600' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">Overview</h2>
          <p className="text-gray-500 font-medium">Real-time performance metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <div key={i} className="bg-white p-6 border border-gray-200 shadow-sm rounded-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 bg-gray-50 rounded-sm", stat.color)}>
                  <stat.icon size={20} />
                </div>
                <ArrowUpRight size={16} className="text-gray-400" />
              </div>
              <p className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black tracking-tight mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 border border-gray-200 shadow-sm rounded-sm">
            <h3 className="font-bold text-lg mb-6">Sales Performance</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { name: 'Mon', sales: 4000 },
                  { name: 'Tue', sales: 3000 },
                  { name: 'Wed', sales: 2000 },
                  { name: 'Thu', sales: 2780 },
                  { name: 'Fri', sales: 1890 },
                  { name: 'Sat', sales: 2390 },
                  { name: 'Sun', sales: 3490 },
                ]}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EA580C" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#EA580C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '0', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#EA580C" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 border border-gray-200 shadow-sm rounded-sm">
            <h3 className="font-bold text-lg mb-6">Recent Orders</h3>
            <div className="space-y-6">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 flex items-center justify-center font-bold text-xs">
                    {order.order_number.slice(-3)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{order.customer_name}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                  </div>
                  <p className="font-bold text-sm">{formatCurrency(order.total)}</p>
                </div>
              ))}
              {recentOrders.length === 0 && <p className="text-sm text-gray-500">No recent orders</p>}
            </div>
            <button className="w-full mt-8 py-3 bg-gray-50 text-xs font-bold uppercase tracking-widest border border-gray-200 hover:bg-gray-100 transition-all">
              View All Orders
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

