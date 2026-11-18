import React from 'react';
import { Layers, Plus, Upload, Image as ImageIcon, ImageOff, Tag, Star } from 'lucide-react';

export default function Header({ 
  stats, 
  onOpenCreate, 
  onOpenImport,
  activeTab = 'all',
  onTabChange,
  favoritesCount = 0
}) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">ACACY Catalog</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  Audit & Retail
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Tra cứu mã sản phẩm & thư viện hình ảnh mẫu</p>
            </div>
          </div>

          {/* Stats Bar */}
          {stats && (
            <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200/80">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Tổng: <b className="text-slate-900">{stats.total_products?.toLocaleString('vi-VN')}</b></span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5 text-emerald-700">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Có ảnh: <b>{stats.total_with_images?.toLocaleString('vi-VN')}</b></span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5 text-amber-700">
                <ImageOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Chưa ảnh: <b>{stats.total_without_images?.toLocaleString('vi-VN')}</b></span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5 text-purple-700">
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                <span>Nhãn: <b>{stats.total_brands}</b></span>
              </div>
            </div>
          )}

          {/* Navigation Menu Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => onTabChange && onTabChange('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kho sản phẩm</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange && onTabChange('favorites')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'favorites'
                  ? 'bg-amber-500 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:text-amber-800 hover:bg-amber-50'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${activeTab === 'favorites' ? 'fill-white text-white' : 'fill-amber-500 text-amber-500'}`} />
              <span>Danh sách hay dùng</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'favorites'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {favoritesCount || 0}
              </span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenImport}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Import Excel</span>
            </button>
            <button
              onClick={onOpenCreate}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm shadow-blue-500/30"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm sản phẩm</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
