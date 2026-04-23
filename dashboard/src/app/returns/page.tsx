'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  RotateCcw, 
  Search, 
  Filter, 
  ShieldAlert, 
  CheckCircle, 
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

import { companyApi } from '@/lib/api';

export default function ReturnsPage() {
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await companyApi.getOrders();
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrders();
  }, []);

  const handleApproveReturn = async (orderId: string) => {
    if (!confirm('Are you sure you want to approve this return? This will automatically add the items back to your inventory.')) return;
    try {
      await companyApi.processReturn(orderId);
      alert('Return approved! Inventory has been updated.');
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert('Failed to process return. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'returned': return { color: 'bg-green-50 text-green-700 border-green-200', label: 'Returned & Restocked', icon: CheckCircle };
      case 'cancelled': return { color: 'bg-red-50 text-red-700 border-red-200', label: 'Cancelled', icon: XCircle };
      default: return { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Eligible', icon: Clock };
    }
  };

  const filteredOrders = orders.filter(o => 
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tighter">Returns Center</h2>
            <p className="text-gray-500 font-medium">Auto-restock inventory with unique bill codes</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg flex items-center gap-3">
            <ShieldAlert size={20} className="text-amber-600" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Inventory Sync</p>
              <p className="text-xs font-bold text-amber-900">Auto-Update On Return</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
            <div className="relative w-full md:w-96">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Enter Bill Code or Customer Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-white border border-gray-300 rounded-sm outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200">
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bill Code</th>
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest">Customer</th>
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest">Items</th>
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-400 font-mono text-xs uppercase">No matching bills found</td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const status = getStatusBadge(order.status);
                    const Icon = status.icon;
                    const canReturn = order.status !== 'returned' && order.status !== 'cancelled';
                    
                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="p-4 font-mono text-sm text-[#EA580C] font-black">#{order.order_number}</td>
                        <td className="p-4">
                          <p className="font-bold text-sm">{order.customer_name}</p>
                          <p className="text-xs text-gray-500">{order.customer_phone}</p>
                        </td>
                        <td className="p-4 text-xs text-gray-600 font-medium">
                          {order.items.length} Items purchased
                        </td>
                        <td className="p-4 text-sm font-bold text-gray-900">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="p-4">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase border", status.color)}>
                            <Icon size={10} />
                            {status.label}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canReturn ? (
                              <button 
                                onClick={() => handleApproveReturn(order.id)}
                                className="h-10 px-4 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#EA580C] transition-all flex items-center gap-2"
                              >
                                <RotateCcw size={14} />
                                Process Return
                              </button>
                            ) : (
                              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No Action Needed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
