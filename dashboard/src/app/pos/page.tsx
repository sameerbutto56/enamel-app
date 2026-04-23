'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  CreditCard, 
  Banknote,
  ArrowLeft,
  Package,
  CheckCircle,
  Loader2,
  Printer,
  MessageSquare
} from 'lucide-react';
import { companyApi } from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function POSPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any>(null);

  useEffect(() => {
    async function fetchProducts() {
      if (authLoading || !token) return;
      
      setLoading(true);
      try {
        const res = await companyApi.getProducts({ limit: 100 });
        setProducts(res.data.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [token, authLoading]);

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) => 
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        product_id: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1,
        image: product.images?.[0]?.url
      }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.product_id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter((item) => item.quantity > 0));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const res = await companyApi.posCheckout({
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        payment_method: paymentMethod,
        customer_name: customerName,
        note: 'POS in-store sale'
      });
      setSuccessOrder(res.data);
      setCart([]);
      setCustomerName('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (successOrder) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-6 print-receipt">
        <div className="w-full max-w-md bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="bg-green-500 p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
              <CheckCircle size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Sale Complete</h1>
            <p className="text-white/80 font-mono text-[10px] mt-1 uppercase tracking-widest">Digital Bill • {formatDate(successOrder.created_at)}</p>
          </div>

          <div className="p-8">
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-dashed border-gray-200">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bill Code</p>
                <p className="text-xl font-mono font-black text-[#EA580C]">{successOrder.order_number}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                <p className="font-bold">{successOrder.customer_name || 'Walk-in'}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {successOrder.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{item.product_name}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                  </div>
                  <p className="text-sm font-black text-gray-900">{formatCurrency(item.line_total)}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-5 space-y-3 mb-8">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(successOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Payment Mode</span>
                <span className="font-black uppercase tracking-tighter">{successOrder.payment_method}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="text-sm font-black uppercase tracking-widest text-gray-900">Total Paid</span>
                <span className="text-2xl font-black text-[#EA580C]">{formatCurrency(successOrder.total)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setSuccessOrder(null)}
                className="h-14 bg-black text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-gray-800 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-3"
              >
                Start New Sale
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => window.print()}
                  className="h-14 bg-white border-2 border-gray-100 text-gray-900 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:border-black transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={16} />
                  Print Bill
                </button>
                <button 
                  onClick={() => {
                    const phone = successOrder.customer_phone || prompt('Enter phone number:');
                    if (phone) alert(`Thank you message & Review link sent to ${phone}!`);
                  }}
                  className="h-14 bg-blue-50 border-2 border-blue-100 text-blue-600 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare size={16} />
                  Send SMS
                </button>
              </div>

              <button 
                onClick={() => router.push('/orders')}
                className="h-14 border-2 border-gray-50 text-gray-300 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:border-black hover:text-black transition-all active:scale-[0.98]"
              >
                Go to Order History
              </button>
            </div>
          </div>
          
          <div className="bg-gray-100 p-4 text-center print:hidden">
            <p className="text-[9px] font-mono text-gray-400 uppercase leading-relaxed tracking-wider">
              Thank you for shopping with ENAMELS<br/>
              Return within 2 days with original receipt
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F7F7F5] overflow-hidden font-inter">
      {/* Product Selection Side */}
      <div className="flex-1 flex flex-col border-r border-gray-200 bg-white">
        <header className="p-6 border-b border-gray-200 flex items-center gap-6">
          <button onClick={() => router.push('/')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="relative flex-1">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Scan barcode or search products..."
              className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-300 rounded-sm outline-none focus:ring-1 focus:ring-black transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white border border-gray-200 p-4 rounded-sm hover:border-[#EA580C] hover:shadow-md transition-all text-left group"
            >
              <div className="aspect-square bg-gray-50 mb-3 border border-gray-100 flex items-center justify-center overflow-hidden">
                {product.images?.[0] ? (
                  <img src={product.images[0].url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <Package size={24} className="text-gray-300" />
                )}
              </div>
              <p className="font-bold text-sm line-clamp-1 group-hover:text-[#EA580C] transition-colors">{product.name}</p>
              <p className="text-xs text-gray-500 font-mono uppercase mt-1">{product.sku}</p>
              <p className="font-black text-lg mt-2">{formatCurrency(product.price)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart/Checkout Side */}
      <div className="w-[450px] bg-white flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black tracking-tighter">CURRENT SALE</h2>
            <div className="bg-orange-100 text-[#EA580C] px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest">
              POS-01
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Customer Name (Optional)"
                className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-sm outline-none focus:border-black transition-all text-sm"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.map((item) => (
            <div key={item.product_id} className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="w-14 h-14 bg-gray-50 border border-gray-100 flex-shrink-0">
                {item.image && <img src={item.image} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{item.name}</p>
                <p className="text-xs text-gray-500 font-mono">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-200 rounded-sm">
                  <button onClick={() => updateQty(item.product_id, -1)} className="p-2 hover:bg-gray-50"><Minus size={14} /></button>
                  <span className="font-bold text-sm px-2 w-8 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product_id, 1)} className="p-2 hover:bg-gray-50"><Plus size={14} /></button>
                </div>
                <p className="font-black text-sm w-20 text-right">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
              <ShoppingCart size={64} strokeWidth={1} className="mb-4" />
              <p className="text-sm font-medium">Cart is empty</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="space-y-3 mb-8">
            <div className="flex justify-between items-center text-gray-500">
              <span className="text-sm">Subtotal</span>
              <span className="font-mono">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-500">
              <span className="text-sm">Tax (0%)</span>
              <span className="font-mono">Rs. 0</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="text-xl font-black tracking-tight">TOTAL</span>
              <span className="text-3xl font-black tracking-tight text-[#EA580C]">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={cn(
                "h-14 flex items-center justify-center gap-3 border-2 font-bold uppercase tracking-widest transition-all",
                paymentMethod === 'cash' ? "border-[#EA580C] bg-orange-50 text-[#EA580C]" : "border-gray-200 bg-white text-gray-400"
              )}
            >
              <Banknote size={20} />
              <span>Cash</span>
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={cn(
                "h-14 flex items-center justify-center gap-3 border-2 font-bold uppercase tracking-widest transition-all",
                paymentMethod === 'card' ? "border-[#EA580C] bg-orange-50 text-[#EA580C]" : "border-gray-200 bg-white text-gray-400"
              )}
            >
              <CreditCard size={20} />
              <span>Card</span>
            </button>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || submitting}
            className="w-full h-16 bg-[#EA580C] text-white font-black text-xl uppercase tracking-widest hover:bg-[#C2410C] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 shadow-lg shadow-orange-200"
          >
            {submitting ? <Loader2 className="animate-spin" /> : 'COMPLETE SALE'}
          </button>
        </div>
      </div>
    </div>
  );
}
