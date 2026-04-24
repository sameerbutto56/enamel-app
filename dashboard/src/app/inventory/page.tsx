'use client';

import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/lib/store';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Package,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  Image as ImageIcon,
  Film
} from 'lucide-react';
import { companyApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';

export default function InventoryPage() {
  const { token, isLoading: authLoading } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: 0,
    stock_qty: 0,
    category_id: '',
    images: [] as { url: string; type: string; filename?: string }[],
  });

  const fetchProducts = async () => {
    if (authLoading || !token) return;
    setLoading(true);
    try {
      const [resProd, resCat] = await Promise.all([
        companyApi.getProducts(),
        companyApi.getCategories()
      ]);
      setProducts(resProd.data.items);
      setCategories(resCat.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token, authLoading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formDataUpload = new FormData();
    for (let i = 0; i < files.length; i++) {
      formDataUpload.append('files', files[i]);
    }

    try {
      // Direct fetch to upload endpoint
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const uploadedMedia = await response.json();
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedMedia]
      }));
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload files.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        stock_qty: Number(formData.stock_qty),
        variants: []
      };

      if (editingProduct) {
        await companyApi.updateProduct(editingProduct.id, payload);
      } else {
        await companyApi.createProduct(payload);
      }
      setShowAddModal(false);
      setEditingProduct(null);
      setFormData({ name: '', sku: '', price: 0, stock_qty: 0, category_id: '', images: [] });
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to save product. Check if SKU is unique.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price,
      stock_qty: product.stock_qty,
      category_id: product.category_id || '',
      images: product.images || [],
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await companyApi.deleteProduct(id);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to delete product.');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'SKU', 'Category', 'Price', 'Stock', 'Status'];
    const rows = products.map(p => [
      p.name,
      p.sku,
      p.category_name || 'Medical Wear',
      p.price,
      p.stock_qty,
      p.is_active ? 'Active' : 'Draft'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "inventory_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                         p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' ? true : 
                         filterStatus === 'active' ? p.is_active : !p.is_active;
    const matchesCategory = filterCategory === 'all' ? true : p.category_id === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tighter">Inventory</h2>
            <p className="text-gray-500 font-medium">Manage your product catalog and stock</p>
          </div>
          <button 
            onClick={() => {
              setEditingProduct(null);
              setFormData({ name: '', sku: '', price: 0, stock_qty: 0, category_id: '', images: [] });
              setShowAddModal(true);
            }}
            className="h-12 px-6 bg-black text-white font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-gray-900 transition-all active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        </div>

        {/* Add Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-lg h-full bg-white shadow-2xl p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black tracking-tighter uppercase">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                }} className="text-gray-400 hover:text-black transition-colors font-mono text-xl">×</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block font-mono text-[10px] font-bold text-gray-700 uppercase mb-3 tracking-widest">Product Media Gallery</label>
                  
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {formData.images.map((media, idx) => (
                      <div key={idx} className="relative aspect-square bg-gray-100 border border-gray-200 group overflow-hidden">
                        {media.type === 'video' ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
                            <Film size={24} className="text-white/50" />
                            <span className="text-[8px] text-white/50 uppercase mt-1 font-bold">Video</span>
                          </div>
                        ) : (
                          <img src={media.url} alt="" className="w-full h-full object-cover" />
                        )}
                        <button 
                          type="button"
                          onClick={() => removeMedia(idx)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    
                    <button 
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "aspect-square border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:border-black hover:bg-gray-50 transition-all",
                        uploading && "opacity-50 cursor-wait"
                      )}
                    >
                      {uploading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
                      ) : (
                        <>
                          <Upload size={20} className="text-gray-400" />
                          <span className="text-[10px] font-black uppercase tracking-tighter text-gray-500">Upload</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    multiple 
                    className="hidden" 
                    onChange={handleFileUpload}
                    accept="image/*,video/*"
                  />
                  <p className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">Support multiple Images and Videos</p>
                </div>

                <div>
                  <label className="block font-mono text-[10px] font-bold text-gray-700 uppercase mb-1.5 tracking-widest">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full h-12 bg-gray-50 border border-gray-300 px-4 focus:border-black outline-none transition-all"
                    placeholder="Navy Blue Scrubs"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] font-bold text-gray-700 uppercase mb-1.5 tracking-widest">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    className="w-full h-12 bg-gray-50 border border-gray-300 px-4 focus:border-black outline-none transition-all uppercase text-xs font-bold"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] font-bold text-gray-700 uppercase mb-1.5 tracking-widest">SKU</label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="w-full h-12 bg-gray-50 border border-gray-300 px-4 focus:border-black outline-none transition-all uppercase"
                      placeholder="SCR-001"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] font-bold text-gray-700 uppercase mb-1.5 tracking-widest">Price (Rs.)</label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                      className="w-full h-12 bg-gray-50 border border-gray-300 px-4 focus:border-black outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-mono text-[10px] font-bold text-gray-700 uppercase mb-1.5 tracking-widest">Initial Stock</label>
                  <input
                    type="number"
                    required
                    value={formData.stock_qty}
                    onChange={(e) => setFormData({...formData, stock_qty: Number(e.target.value)})}
                    className="w-full h-12 bg-gray-50 border border-gray-300 px-4 focus:border-black outline-none transition-all"
                  />
                </div>

                <div className="pt-8 flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingProduct(null);
                    }}
                    className="flex-1 h-14 border-2 border-gray-200 text-gray-400 font-bold uppercase tracking-widest hover:border-black hover:text-black transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="flex-1 h-14 bg-black text-white font-bold uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Saving...' : (editingProduct ? 'Update Product' : 'Save Product')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
            <div className="relative w-full md:w-96">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, SKUs, tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-white border border-gray-300 rounded-sm outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto relative">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex-1 md:flex-none h-11 px-4 bg-white border border-gray-300 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest transition-all",
                  showFilters ? "border-black bg-black text-white" : "hover:bg-gray-50"
                )}
              >
                <Filter size={16} />
                <span>Filters</span>
              </button>
              
              {showFilters && (
                <div className="absolute top-12 right-0 z-10 w-48 bg-white border border-gray-200 shadow-xl p-4 animate-in fade-in zoom-in-95 duration-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Filter by Status</p>
                  <div className="space-y-2">
                    {['all', 'active', 'draft'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setFilterStatus(status as any);
                          setShowFilters(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
                          filterStatus === status ? "bg-black text-white" : "hover:bg-gray-100"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 mt-4 border-t border-gray-100 pt-3">Filter by Category</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => { setFilterCategory('all'); setShowFilters(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
                        filterCategory === 'all' ? "bg-black text-white" : "hover:bg-gray-100"
                      )}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setFilterCategory(cat.id); setShowFilters(false); }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
                          filterCategory === cat.id ? "bg-black text-white" : "hover:bg-gray-100"
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={exportToCSV}
                className="flex-1 md:flex-none h-11 px-4 bg-white border border-gray-300 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest hover:bg-gray-50"
              >
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200">
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest">Product</th>
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest">SKU</th>
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category</th>
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest">Price</th>
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest">Stock</th>
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                  <th className="p-4 font-mono text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                          {product.images?.[0] ? (
                            product.images[0].type === 'video' ? (
                              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                <Film size={16} className="text-white/50" />
                              </div>
                            ) : (
                              <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                            )
                          ) : (
                            <Package size={20} className="text-gray-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900 group-hover:text-black transition-colors">{product.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono uppercase">{product.images?.length || 0} Media Files</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs font-bold bg-gray-100 px-2 py-1">{product.sku}</span>
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-600">
                      {product.category_name || 'Medical Wear'}
                    </td>
                    <td className="p-4 text-sm font-bold text-gray-900">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          product.stock_qty > 50 ? "bg-green-500" : product.stock_qty > 0 ? "bg-orange-500" : "bg-red-500"
                        )} />
                        <span className="text-sm font-bold">{product.stock_qty}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 text-[10px] font-black uppercase tracking-widest border",
                        product.is_active 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      )}>
                        {product.is_active ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(product)}
                          className="p-2 text-gray-400 hover:text-black transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-xs font-mono text-gray-500">Showing {products.length} products</p>
            <div className="flex items-center gap-2">
              <button className="p-2 border border-gray-300 bg-white text-gray-400 hover:text-black disabled:opacity-50" disabled>
                <ChevronLeft size={16} />
              </button>
              <button className="p-2 border border-gray-300 bg-white text-gray-400 hover:text-black disabled:opacity-50" disabled>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
