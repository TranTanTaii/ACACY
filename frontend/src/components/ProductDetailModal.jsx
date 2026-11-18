import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Copy, Check, Edit2, Trash2, ImageOff, Tag, Package, 
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Download, Star, Upload
} from 'lucide-react';
import { productApi } from '../api/productApi';

export default function ProductDetailModal({ 
  product, 
  onClose, 
  onEdit, 
  onDelete,
  isFavorite = false,
  onToggleFavorite,
  onProductUpdated
}) {
  const [copied, setCopied] = useState(false);
  const [zoomImage, setZoomImage] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgError, setImgError] = useState(false);
  const [isUploadingDirect, setIsUploadingDirect] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    // Reset zoom & error when modal opens or closes or product changes
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setZoomImage(false);
    setImgError(false);
  }, [product]);

  // Handle ESC key to close zoom or modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (zoomImage) {
          setZoomImage(false);
          setZoomLevel(1);
          setPanPosition({ x: 0, y: 0 });
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomImage, onClose]);

  if (!product) return null;

  const hasImage = Boolean(product.image_url) && !imgError;

  const copyCode = () => {
    navigator.clipboard.writeText(product.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomIn = (e) => {
    e?.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = (e) => {
    e?.stopPropagation();
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = (e) => {
    e?.stopPropagation();
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomLevel((prev) => Math.min(prev + 0.25, 4));
    } else {
      setZoomLevel((prev) => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) setPanPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  const handleMouseDown = (e) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDirectFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !product) return;
    setIsUploadingDirect(true);
    try {
      const isCustom = String(product.id || '').startsWith('custom_');
      if (isCustom) {
        const reader = new FileReader();
        reader.onload = () => {
          const updated = { ...product, image_url: reader.result };
          setImgError(false);
          if (onProductUpdated) onProductUpdated(updated);
        };
        reader.readAsDataURL(file);
      } else {
        const updated = await productApi.uploadProductImage(product.id, file);
        setImgError(false);
        if (onProductUpdated) onProductUpdated(updated);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tải ảnh lên: ' + err.message);
    } finally {
      setIsUploadingDirect(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden w-full max-w-4xl max-h-[92vh] flex flex-col my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Chi tiết sản phẩm</h2>
              {product.brand && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {product.brand}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit && onEdit(product)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                title="Chỉnh sửa sản phẩm"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete && onDelete(product)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                title="Xóa sản phẩm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Đóng (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1">
            <div className="grid gap-6 md:grid-cols-2">
              
              {/* Left Column: Image or Upload Box */}
              <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl p-4 relative group">
                {hasImage ? (
                  <>
                    <div
                      className="w-full h-72 flex items-center justify-center cursor-zoom-in relative rounded-xl overflow-hidden bg-white/80 p-2 border border-slate-100 shadow-inner"
                      onClick={() => setZoomImage(true)}
                      title="Bấm để phóng to ảnh toàn màn hình"
                    >
                      <img
                        src={product.image_url}
                        alt={product.code}
                        className="max-h-full max-w-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
                        onError={() => setImgError(true)}
                      />
                      
                      {/* Hover Overlay Button */}
                      <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-slate-800 text-xs font-bold shadow-lg backdrop-blur-sm">
                          <ZoomIn className="w-4 h-4 text-blue-600" /> Phóng to ảnh
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => setZoomImage(true)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        <Maximize2 className="w-3.5 h-3.5" /> Phóng to chi tiết
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        disabled={isUploadingDirect}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:underline"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingDirect ? 'Đang tải...' : 'Thay đổi ảnh khác'}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-72 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white/80 p-5 text-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <ImageOff className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 mb-1">Chưa có hình ảnh sản phẩm</p>
                    <p className="text-[11px] text-slate-400 mb-4 max-w-xs">
                      Tải lên hình ảnh bao bì hoặc nhãn dán để phục vụ tra cứu kiểm toán hình ảnh
                    </p>
                    <button
                      type="button"
                      disabled={isUploadingDirect}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isUploadingDirect ? 'Đang tải ảnh...' : 'Chọn ảnh từ máy tính'}</span>
                    </button>
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleDirectFileUpload}
                  className="hidden"
                />
              </div>

              {/* Right Column: Product Attributes */}
              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  {/* SKU Code with copy button */}
                  <div className="mb-3">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Mã nhãn sản phẩm (SKU ID)
                    </label>
                    <div className="flex items-center justify-between p-2.5 bg-slate-100/80 rounded-xl border border-slate-200">
                      <code className="text-sm sm:text-base font-bold text-slate-900 font-mono break-all select-all">
                        {product.code}
                      </code>
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <button
                          onClick={() => onToggleFavorite && onToggleFavorite(product)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isFavorite
                              ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                              : 'text-slate-500 hover:text-amber-600 hover:bg-white'
                          }`}
                          title={isFavorite ? 'Đã lưu trong Danh sách hay dùng (Bấm để bỏ)' : 'Lưu vào Danh sách hay dùng'}
                        >
                          <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                        <button
                          onClick={copyCode}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                          title="Copy mã"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {/* Status version */}
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        product.status_version?.includes('MỚI')
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : product.status_version?.includes('CŨ')
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : product.status_version?.includes('KM') || product.status_version?.includes('KHUYẾN MÃI')
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {product.status_version || 'CHUẨN'}
                    </span>

                    {/* Packaging */}
                    {product.packaging && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                        <Package className="w-3.5 h-3.5 text-slate-500" />
                        {product.packaging}
                      </span>
                    )}

                    {/* Volume */}
                    {product.volume && (
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                        {product.volume}
                      </span>
                    )}

                    {/* Category */}
                    {product.category && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                        <Tag className="w-3.5 h-3.5 text-slate-500" />
                        {product.category}
                      </span>
                    )}
                  </div>

                  {/* Product Name */}
                  {product.name && (
                    <div className="mb-4">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Tên sản phẩm / Quy cách
                      </label>
                      <p className="text-sm font-medium text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {product.name}
                      </p>
                    </div>
                  )}

                  {/* Notes / Special labels */}
                  {product.notes && (
                    <div className="mb-4">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Ghi chú / Lưu ý dán nhãn
                      </label>
                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed">
                        {product.notes}
                      </div>
                    </div>
                  )}
                </div>

                {/* Metadata details */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div>
                    <span className="block font-medium text-slate-500">Sheet Excel:</span>
                    <span>{product.sheet_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block font-medium text-slate-500">File nguồn:</span>
                    <span className="truncate block" title={product.source_file || ''}>
                      {product.source_file || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">ID: {product.id}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit && onEdit(product)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Chỉnh sửa toàn bộ</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Zoom Viewer */}
      {zoomImage && hasImage && (
        <div 
          className="fixed inset-0 z-[70] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center animate-fadeIn select-none overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Zoom controls bar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 px-4 py-2 rounded-full text-white text-xs shadow-2xl backdrop-blur-md">
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              title="Phóng to (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="font-mono text-[11px] w-12 text-center text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              title="Thu nhỏ (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <button
              onClick={handleResetZoom}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              title="Mặc định (100%)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              {product.code}
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={() => setZoomImage(false)}
            className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 rounded-full transition-colors border border-slate-700/60"
            title="Đóng phóng to (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Zoomable Image Container */}
          <div 
            className="w-full h-full flex items-center justify-center p-8 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <img
              src={product.image_url}
              alt={product.code}
              draggable={false}
              style={{
                transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                transition: isDragging ? 'none' : 'transform 0.15s ease-out'
              }}
              className="max-h-[85vh] max-w-[85vw] object-contain drop-shadow-2xl pointer-events-none"
            />
          </div>
        </div>
      )}
    </>
  );
}
