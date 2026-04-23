'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/lib/store';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  ArrowUpRight, 
  ArrowDownRight,
  Download
} from 'lucide-react';
import { companyApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

export default function AnalyticsPage() {
  const { token, isLoading: authLoading } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (authLoading || !token) return;
      
      setLoading(true);
      try {
        const res = await companyApi.getAnalytics();
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token, authLoading]);

  const COLORS = ['#111827', '#EA580C', '#4B5563', '#9CA3AF', '#E5E7EB'];

  const categoryData = [
    { name: 'Scrubs', value: 45 },
    { name: 'Lab Coats', value: 25 },
    { name: 'Shoes', value: 15 },
    { name: 'Caps', value: 10 },
    { name: 'Other', value: 5 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tighter">Analytics</h2>
            <p className="text-gray-500 font-medium">Detailed sales and performance data</p>
          </div>
          <button className="h-11 px-6 bg-white border border-gray-300 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-all">
            <Download size={16} />
            <span>Download Report</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 border border-gray-200 shadow-sm rounded-sm">
            <p className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-1">Average Order Value</p>
            <p className="text-3xl font-black tracking-tighter">{formatCurrency(4850)}</p>
            <div className="flex items-center gap-1 text-green-600 mt-2 text-sm font-bold">
              <ArrowUpRight size={16} />
              <span>+12.5%</span>
            </div>
          </div>
          <div className="bg-white p-6 border border-gray-200 shadow-sm rounded-sm">
            <p className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-1">Conversion Rate</p>
            <p className="text-3xl font-black tracking-tighter">3.2%</p>
            <div className="flex items-center gap-1 text-red-600 mt-2 text-sm font-bold">
              <ArrowDownRight size={16} />
              <span>-0.4%</span>
            </div>
          </div>
          <div className="bg-white p-6 border border-gray-200 shadow-sm rounded-sm">
            <p className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-1">Active Customers</p>
            <p className="text-3xl font-black tracking-tighter">1,248</p>
            <div className="flex items-center gap-1 text-green-600 mt-2 text-sm font-bold">
              <ArrowUpRight size={16} />
              <span>+8.2%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 border border-gray-200 shadow-sm rounded-sm">
            <h3 className="font-bold text-lg mb-8 uppercase tracking-tight">Sales by Category</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '0', border: '1px solid #E5E7EB' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              {categoryData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-bold text-gray-600 uppercase">{item.name}</span>
                  <span className="text-xs font-mono font-bold ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 border border-gray-200 shadow-sm rounded-sm">
            <h3 className="font-bold text-lg mb-8 uppercase tracking-tight">Monthly Revenue</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { month: 'Jan', rev: 450000 },
                  { month: 'Feb', rev: 520000 },
                  { month: 'Mar', rev: 480000 },
                  { month: 'Apr', rev: 610000 },
                  { month: 'May', rev: 590000 },
                  { month: 'Jun', rev: 720000 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#9CA3AF'}}
                    tickFormatter={(value) => `${value/1000}k`}
                  />
                  <Tooltip 
                    cursor={{fill: '#F9FAFB'}}
                    contentStyle={{ borderRadius: '0', border: '1px solid #E5E7EB' }}
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <Bar dataKey="rev" fill="#111827" radius={[2, 2, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
