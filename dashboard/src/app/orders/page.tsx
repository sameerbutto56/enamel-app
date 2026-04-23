'use client';

import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/lib/store';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Truck, 
  CheckCircle, 
  XCircle,
  X,
  Clock,
  Printer,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { companyApi } from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

const WS_URL = 'ws://localhost:8000/api/ws';

export default function OrdersPage() {
  const { token, isLoading: authLoading } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [trackingOrder, setTrackingOrder] = useState<any>(null);
  const [trackSearch, setTrackSearch] = useState('');
  const ws = useRef<WebSocket | null>(null);

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const order = orders.find(o => 
      o.order_number.toLowerCase() === trackSearch.toLowerCase().replace('#', '')
    );
    if (order) {
      setTrackingOrder(order);
      setTrackSearch('');
    } else {
      alert('Order not found. Please check the number.');
    }
  };

  const statusSteps = [
    { key: 'placed', label: 'Order Placed' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' }
  ];

  const getCurrentStepIndex = (status: string) => {
    const idx = statusSteps.findIndex(s => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  const fetchOrders = async () => {
    if (authLoading || !token) return;
    try {
      const res = await companyApi.getOrders();
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !token) return;

    fetchOrders();

    // Setup WebSocket for real-time order notifications
    ws.current = new WebSocket(WS_URL);
    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.event === 'new_order' || data.event === 'order_updated') {
        fetchOrders(); // Refresh list on any order event
      }
    };

    return () => ws.current?.close();
  }, [token, authLoading]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'placed': return { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Placed', icon: Clock };
      case 'confirmed': return { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Confirmed', icon: CheckCircle };
      case 'processing': return { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Processing', icon: Clock };
      case 'shipped': return { color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Shipped', icon: Truck };
      case 'out_for_delivery': return { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Out for Delivery', icon: Truck };
      case 'delivered': return { color: 'bg-green-50 text-green-700 border-green-200', label: 'Delivered', icon: CheckCircle };
      case 'cancelled': return { color: 'bg-red-50 text-red-700 border-red-200', label: 'Cancelled', icon: XCircle };
      default: return { color: 'bg-gray-50 text-gray-700 border-gray-200', label: status, icon: Clock };
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await companyApi.updateOrderStatus(id, { status: newStatus });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tighter">Orders</h2>
            <p className="text-gray-500 font-medium">Manage customer orders and fulfillment</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-500" />
              <div className="w-8 h-8 rounded-full border-2 border-white bg-orange-500" />
              <div className="w-8 h-8 rounded-full border-2 border-white bg-green-500" />
            </div>
            <p className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest ml-2">Live Fulfillment</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#EA580C]" />
          <div className="mb-6 md:mb-0">
            <h3 className="text-xl font-black uppercase tracking-tighter text-gray-900">Quick Track Order</h3>
            <p className="text-sm text-gray-400 font-medium mt-1">Enter order number for instant live status</p>
          </div>
          <form onSubmit={handleQuickTrack} className="flex gap-3 w-full md:w-auto">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="#ORD-000"
                value={trackSearch}
                onChange={(e) => setTrackSearch(e.target.value)}
                className="h-14 w-full md:w-64 bg-gray-50 border border-gray-200 pl-11 pr-4 rounded-xl font-mono text-sm focus:border-[#EA580C] focus:bg-white focus:ring-4 focus:ring-[#EA580C]/5 outline-none transition-all"
              />
            </div>
            <button 
              type="submit"
              className="h-14 px-8 bg-black text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-[#EA580C] hover:shadow-[0_8px_20px_rgba(234,88,12,0.3)] transition-all active:scale-95 whitespace-nowrap"
            >
              Track Now
            </button>
          </form>
        </div>

        {/* Tracking Modal */}
        {trackingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse" />
                    <p className="font-mono text-[10px] font-bold text-[#EA580C] uppercase tracking-widest">Live Tracking</p>
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter">Order #{trackingOrder.order_number}</h3>
                </div>
                <button 
                  onClick={() => setTrackingOrder(null)}
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Customer Details</p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Name</p>
                        <p className="font-bold text-gray-900">{trackingOrder.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Contact</p>
                        <p className="font-bold text-gray-900">{trackingOrder.customer_phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Shipping to</p>
                        <p className="font-medium text-gray-600 text-sm leading-relaxed">
                          {trackingOrder.shipping_address?.address}, {trackingOrder.shipping_address?.city}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#EA580C]/5 rounded-xl p-5 border border-[#EA580C]/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#EA580C] mb-4">Order Summary</p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Total Amount</p>
                        <p className="text-2xl font-black text-gray-900">{formatCurrency(trackingOrder.total)}</p>
                      </div>
                      <p className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded border border-gray-100">
                        {trackingOrder.items.length} Items
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Fulfillment Timeline</p>
                  <div className="relative space-y-0">
                    {/* Timeline Line */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100" />
                    
                    {(() => {
                      const isWalkIn = trackingOrder.customer_name?.toLowerCase().includes('walk-in');
                      const walkInSteps = [
                        { key: 'placed', label: 'Sale Recorded' },
                        { key: 'delivered', label: 'Handed Over' }
                      ];
                      const activeSteps = isWalkIn ? walkInSteps : statusSteps;
                      
                      return activeSteps.map((step, idx) => {
                        const currentIdx = isWalkIn 
                          ? (trackingOrder.status === 'delivered' ? 1 : 0)
                          : getCurrentStepIndex(trackingOrder.status);
                        
                        const isCompleted = idx <= currentIdx;
                        const isCurrent = idx === currentIdx && trackingOrder.status !== 'delivered' && trackingOrder.status !== 'cancelled';
                        const isFinal = idx === activeSteps.length - 1 && trackingOrder.status === 'delivered';
                        
                        return (
                          <div key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
                            <div className={cn(
                              "w-6 h-6 rounded-full border-4 z-10 flex items-center justify-center transition-all duration-500",
                              isFinal ? "bg-green-500 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]" :
                              isCurrent ? "bg-[#EA580C] border-[#EA580C] shadow-[0_0_15px_rgba(234,88,12,0.4)]" :
                              isCompleted ? "bg-black border-black" : "bg-white border-gray-100"
                            )}>
                              {isCompleted && !isCurrent && !isFinal && <CheckCircle size={10} className="text-white" />}
                              {isCurrent && <Clock size={10} className="text-white animate-spin-slow" />}
                              {isFinal && <CheckCircle size={12} className="text-white" />}
                            </div>
                            <div className="pt-0.5">
                              <p className={cn(
                                "text-xs font-bold uppercase tracking-wider",
                                isFinal ? "text-green-600" :
                                isCurrent ? "text-[#EA580C]" : 
                                isCompleted ? "text-black" : "text-gray-300"
                              )}>
                                {step.label}
                                {isFinal && " — COMPLETED"}
                              </p>
                              {isCurrent && (
                                <p className="text-[10px] text-gray-500 mt-0.5 italic">In progress...</p>
                              )}
                              {isFinal && (
                                <p className="text-[10px] text-green-500 mt-0.5 font-bold uppercase tracking-tighter">Transaction Finished</p>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                <button 
                  onClick={() => setTrackingOrder(null)}
                  className="flex-1 h-12 bg-white border border-gray-200 text-gray-600 font-bold uppercase tracking-widest text-[10px] rounded-lg hover:border-black hover:text-black transition-all"
                >
                  Close Tracker
                </button>
                <button 
                  onClick={() => setTrackingOrder(null)}
                  className="flex-1 h-12 bg-black text-white font-bold uppercase tracking-widest text-[10px] rounded-lg hover:bg-gray-800 transition-all shadow-lg"
                >
                  Manage Order
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
            <div className="relative w-full md:w-96">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search order #, customer, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-white border border-gray-300 rounded-sm outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <select className="h-11 px-4 bg-white border border-gray-300 font-bold text-xs uppercase tracking-widest outline-none focus:ring-1 focus:ring-black">
                <option>All Statuses</option>
                <option>Placed</option>
                <option>Processing</option>
                <option>Shipped</option>
                <option>Delivered</option>
              </select>
              <button className="h-11 px-4 bg-white border border-gray-300 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest hover:bg-gray-50">
                <Printer size={16} />
                <span>Print Daily Log</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200">
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest">Order #</th>
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest">Customer</th>
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest">Items</th>
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4">
                        <span className="font-mono text-sm font-black text-[#EA580C]">{order.order_number}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-sm text-gray-900">{order.customer_name}</p>
                        <p className="text-xs text-gray-500">{order.customer_phone}</p>
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-600">
                        {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                      </td>
                      <td className="p-4 text-xs font-mono text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border",
                          statusInfo.color
                        )}>
                          <StatusIcon size={10} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold text-gray-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select 
                            className="text-[10px] font-bold uppercase tracking-widest border border-gray-300 px-2 py-1 outline-none"
                            value={order.status}
                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          >
                            <option value="placed">Placed</option>
                            <option value="confirmed">Confirm</option>
                            <option value="processing">Process</option>
                            <option value="shipped">Ship</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Deliver</option>
                            <option value="cancelled">Cancel</option>
                          </select>
                          <button 
                            onClick={() => setTrackingOrder(order)}
                            className="p-2 text-gray-400 hover:text-black transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
