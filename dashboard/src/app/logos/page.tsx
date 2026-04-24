'use client';

import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuthStore } from '@/lib/store';
import { Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { companyApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function LogosPage() {
  const { token, isLoading: authLoading } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [logos, setLogos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    image_url: '',
  });

  const fetchLogos = async () => {
    if (authLoading || !token) return;
    setLoading(true);
    try {
      const res = await companyApi.getLogos();
      setLogos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogos();
  }, [token, authLoading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('files', files[0]);

    try {
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
        image_url: uploadedMedia[0].url
      }));
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload logo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      alert("Please upload an image first.");
      return;
    }
    setSubmitting(true);
    try {
      await companyApi.createLogo(formData);
      setShowAddModal(false);
      setFormData({ name: '', image_url: '' });
      fetchLogos();
    } catch (err) {
      console.error(err);
      alert('Failed to save logo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this logo?')) return;
    try {
      await companyApi.deleteLogo(id);
      fetchLogos();
    } catch (err) {
      console.error(err);
      alert('Failed to delete logo.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tighter">Logo Gallery</h2>
            <p className="text-gray-500 font-medium">Manage standard logos for customers to select</p>
          </div>
          <button 
            onClick={() => {
              setFormData({ name: '', image_url: '' });
              setShowAddModal(true);
            }}
            className="h-12 px-6 bg-black text-white font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-gray-900 transition-all active:scale-[0.98]"
          >
            <Plus size={18} />
            <span>Upload Logo</span>
          </button>
        </div>

        {/* Add Logo Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md h-full bg-white shadow-2xl p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black tracking-tighter uppercase">Add New Logo</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-black transition-colors font-mono text-xl">×</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block font-mono text-[10px] font-bold text-gray-700 uppercase mb-3 tracking-widest">Logo Image</label>
                  
                  <div className="mb-4">
                    {formData.image_url ? (
                      <div className="relative aspect-video bg-gray-100 border border-gray-200 group overflow-hidden flex items-center justify-center p-4">
                        <img src={formData.image_url} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, image_url: ''})}
                          className="absolute top-2 right-2 bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "w-full aspect-video border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 hover:border-black hover:bg-gray-50 transition-all",
                          uploading && "opacity-50 cursor-wait"
                        )}
                      >
                        {uploading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black" />
                        ) : (
                          <>
                            <Upload size={24} className="text-gray-400" />
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Upload Image</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload}
                    accept="image/*"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] font-bold text-gray-700 uppercase mb-1.5 tracking-widest">Logo Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full h-12 bg-gray-50 border border-gray-300 px-4 focus:border-black outline-none transition-all"
                    placeholder="e.g. Shaukat Khanum Hospital"
                  />
                </div>

                <div className="pt-8 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 h-14 border-2 border-gray-200 text-gray-400 font-bold uppercase tracking-widest hover:border-black hover:text-black transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="flex-1 h-14 bg-black text-white font-bold uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Saving...' : 'Save Logo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {loading ? (
            <div className="col-span-full h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EA580C]" />
            </div>
          ) : logos.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 bg-white">
              <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="font-bold text-gray-900 mb-1">No Logos Found</p>
              <p className="text-sm text-gray-500">Upload your first standard logo to let customers choose it!</p>
            </div>
          ) : (
            logos.map((logo) => (
              <div key={logo.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden group shadow-sm hover:shadow-md transition-all">
                <div className="aspect-square bg-gray-50 p-6 flex items-center justify-center relative">
                  <img src={logo.image_url} alt={logo.name} className="max-w-full max-h-full object-contain" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => handleDelete(logo.id)}
                      className="bg-white text-red-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="p-4 text-center border-t border-gray-100">
                  <p className="font-bold text-xs uppercase tracking-wider truncate" title={logo.name}>
                    {logo.name}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
