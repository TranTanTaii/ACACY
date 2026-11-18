import React, { useState } from 'react';
import { Eye, Edit2, Trash2, ImageOff, Star, Copy, Check } from 'lucide-react';

export default function ProductCard({ 
  product, 
  onView, 
  onEdit, 
  onDelete,
  isFavorite = false,
  onToggleFavorite,
  onCopyCode
}) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [product.image_url]);

  const hasImage = Boolean(product.image_url) && !imgError;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(product.code);
    setCopied(true);
    if (onCopyCode) onCopyCode(product.code);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => onView(product)}
      className="group relative bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      {/* Top Star (Favorite) Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onToggleFavorite) onToggleFavorite(product);
        }}
        className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
          isFavorite
            ? 'bg-amber-500 text-white shadow-xs scale-105'
            : 'bg-white/80 backdrop-blur-xs text-slate-400 hover:text-amber-500 hover:bg-white shadow-xs border border-slate-200/60'
        }`}
        title={isFavorite ? 'Bỏ khỏi Danh sách hay dùng' : 'Lưu vào Danh sách hay dùng'}
      >
        <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white text-white' : ''}`} />
      </button>

      {/* Top Section: Image (if exists) or Compact Header */}
      <div>
        {hasImage ? (
          <div className="w-full h-44 bg-slate-50 border border-slate-100 rounded-lg mb-3 flex items-center justify-center p-2 overflow-hidden group-hover:bg-blue-50/20 transition-colors">
            <img
              src={product.image_url}
              alt={product.code}
              className="max-h-full max-w-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <div className="w-full h-16 bg-slate-50 border border-dashed border-slate-200 rounded-lg mb-3 flex items-center justify-center text-slate-400 gap-1.5 text-xs">
            <ImageOff className="w-4 h-4 text-slate-400" />
            <span>Không có hình ảnh</span>
          </div>
        )}

        {/* Brand & Status Badges */}
        <div className="flex items-center justify-between gap-1 mb-1.5 pr-6">
          {product.brand ? (
            <span className="text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
              {product.brand}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">Chưa phân loại</span>
          )}

          {product.status_version && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                product.status_version.includes('MỚI')
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : product.status_version.includes('CŨ')
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : product.status_version.includes('KM') || product.status_version.includes('KHUYẾN MÃI')
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {product.status_version}
            </span>
          )}
        </div>

        {/* Code Title (Clickable to copy) */}
        <div className="relative group/title">
          <h3
            className="font-mono text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1 select-all"
            title={product.code}
          >
            {product.code}
          </h3>
        </div>

        {/* Attributes (Category, Volume, Packaging) */}
        <div className="flex flex-wrap gap-1 text-[11px] text-slate-500 mb-2">
          {product.category && (
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
              {product.category}
            </span>
          )}
          {product.volume && (
            <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium text-slate-700">
              {product.volume}
            </span>
          )}
          {product.packaging && (
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
              {product.packaging}
            </span>
          )}
        </div>

        {/* Notes (if any) */}
        {product.notes && (
          <p className="text-[11px] text-slate-500 line-clamp-2 italic bg-slate-50 p-1.5 rounded border border-slate-100">
            {product.notes}
          </p>
        )}
      </div>

      {/* Card Actions Bottom */}
      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
        {/* Quick copy code button */}
        <button
          onClick={handleCopy}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
            copied
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
          }`}
          title="Sao chép mã SKU"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="text-[11px]">{copied ? 'Đã chép' : 'Copy'}</span>
        </button>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onView(product)}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(product)}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Chỉnh sửa"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(product)}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Xóa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
