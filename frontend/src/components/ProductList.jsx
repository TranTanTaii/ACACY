import React, { useState } from 'react';
import { LayoutGrid, List as ListIcon, ChevronLeft, ChevronRight, ImageOff, Eye, Edit2, Trash2, Star, Copy, Check } from 'lucide-react';
import ProductCard from './ProductCard';

export default function ProductList({
  products = [],
  total = 0,
  page = 1,
  pageSize = 24,
  totalPages = 1,
  onPageChange,
  viewMode = 'grid',
  onViewModeChange,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
  isLoading = false,
  onOpenCreate,
  onOpenImport,
  hasActiveFilters = false,
  activeFiltersSummary = '',
  onClearFilters,
  favoriteCodeSet = new Set(),
  onToggleFavorite,
  onCopyCode
}) {
  const [tableCopiedCode, setTableCopiedCode] = useState(null);

  const handleTableCopy = (code, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(code);
    setTableCopiedCode(code);
    if (onCopyCode) onCopyCode(code);
    setTimeout(() => {
      setTableCopiedCode(prev => (prev === code ? null : prev));
    }, 2000);
  };
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      {/* List Toolbar: Result count & View Mode Toggle */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <div>
          <span>
            Hiển thị <b className="text-slate-800">{products.length}</b> / <b className="text-slate-800">{total.toLocaleString('vi-VN')}</b> sản phẩm
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Xem dạng lưới (Cards)"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'table'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Xem dạng bảng (Table)"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse space-y-3">
              <div className="w-full h-40 bg-slate-100 rounded-lg"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto my-8 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <ImageOff className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Không tìm thấy sản phẩm nào</h3>
          
          {hasActiveFilters ? (
            <div className="my-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
              <p>
                Sản phẩm có thể đang bị ẩn do đang áp dụng bộ lọc: <b className="font-semibold">{activeFiltersSummary}</b>.
              </p>
              {onClearFilters && (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm transition-all"
                >
                  ✕ Bỏ tất cả bộ lọc để tìm trong toàn bộ danh mục
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 mb-6">
              Thử thay đổi từ khóa tìm kiếm hoặc nhập thêm dữ liệu từ file Excel.
            </p>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenImport}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Import Excel
            </button>
            <button
              onClick={onOpenCreate}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              + Thêm thủ công
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onView={onViewProduct}
              onEdit={onEditProduct}
              onDelete={onDeleteProduct}
              isFavorite={favoriteCodeSet.has(p.code)}
              onToggleFavorite={onToggleFavorite}
              onCopyCode={onCopyCode}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-16 text-center">Ảnh</th>
                  <th className="py-3 px-4">Mã SKU</th>
                  <th className="py-3 px-3">Thương hiệu</th>
                  <th className="py-3 px-3">Quy cách</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-4">Lưu ý / Ghi chú</th>
                  <th className="py-3 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const hasImage = Boolean(p.image_url);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => onViewProduct(p)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      {/* Image column */}
                      <td className="py-2 px-3 text-center">
                        <div className="w-10 h-10 mx-auto rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                          {hasImage ? (
                            <img
                              src={p.image_url}
                              alt={p.code}
                              className="max-h-full max-w-full object-contain p-0.5"
                              loading="lazy"
                              onError={(e) => { e.target.parentElement.innerHTML = '<span class="text-[10px] text-slate-400">Lỗi</span>'; }}
                            />
                          ) : (
                            <ImageOff className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                        {p.code}
                      </td>

                      {/* Brand */}
                      <td className="py-2.5 px-3">
                        {p.brand ? (
                          <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                            {p.brand}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Packaging & Volume */}
                      <td className="py-2.5 px-3 text-slate-600">
                        {p.packaging || ''} {p.volume ? `• ${p.volume}` : ''}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            p.status_version?.includes('MỚI')
                              ? 'bg-emerald-50 text-emerald-700'
                              : p.status_version?.includes('CŨ')
                              ? 'bg-rose-50 text-rose-700'
                              : p.status_version?.includes('KM') || p.status_version?.includes('KHUYẾN MÃI')
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.status_version || 'CHUẨN'}
                        </span>
                      </td>

                      {/* Notes */}
                      <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate" title={p.notes || ''}>
                        {p.notes || '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => handleTableCopy(p.code, e)}
                            className={`p-1.5 rounded-md transition-colors ${
                              tableCopiedCode === p.code
                                ? 'text-emerald-600 bg-emerald-50'
                                : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'
                            }`}
                            title="Copy mã SKU"
                          >
                            {tableCopiedCode === p.code ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => onToggleFavorite && onToggleFavorite(p)}
                            className={`p-1.5 rounded-md transition-colors ${
                              favoriteCodeSet.has(p.code)
                                ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                            }`}
                            title={favoriteCodeSet.has(p.code) ? 'Bỏ khỏi Danh sách hay dùng' : 'Lưu vào Danh sách hay dùng'}
                          >
                            <Star className={`w-4 h-4 ${favoriteCodeSet.has(p.code) ? 'fill-amber-500' : ''}`} />
                          </button>
                          <button
                            onClick={() => onViewProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 rounded-md hover:bg-slate-100"
                            title="Sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
          <div className="text-slate-500">
            Trang <b className="text-slate-800">{page}</b> / <b className="text-slate-800">{totalPages}</b>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Trước
            </button>

            {/* Page number indicators */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((pNum, idx) => {
                if (pNum === '...') {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="w-7 h-7 flex items-center justify-center text-slate-400 font-medium select-none"
                    >
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={pNum}
                    onClick={() => onPageChange(pNum)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-medium text-xs transition-colors ${
                      pNum === page
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Sau <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
