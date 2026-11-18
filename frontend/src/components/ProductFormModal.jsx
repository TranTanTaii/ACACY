import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Trash2, Check, Link as LinkIcon } from 'lucide-react';
import { productApi } from '../api/productApi';

export default function ProductFormModal({ product, isOpen, onClose, onSaved }) {
  const isEditing = Boolean(product && product.id);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    brand: '',
    category: '',
    packaging: '',
    volume: '',
    status_version: 'CHUẨN',
    notes: '',
    image_url: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code || '',
        name: product.name || '',
        brand: product.brand || '',
        category: product.category || '',
        packaging: product.packaging || '',
        volume: product.volume || '',
        status_version: product.status_version || 'CHUẨN',
        notes: product.notes || '',
        image_url: product.image_url || '',
      });
      setImagePreview(product.image_url || null);
      setImageFile(null);
      setRemoveCurrentImage(false);
    } else {
      setFormData({
        code: '',
        name: '',
        brand: '',
        category: '',
        packaging: '',
        volume: '',
        status_version: 'CHUẨN',
        notes: '',
        image_url: '',
      });
      setImagePreview(null);
      setImageFile(null);
      setRemoveCurrentImage(false);
    }
    setErrorMessage('');
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveCurrentImage(false);
    }
  };

  const handleImageUrlChange = (url) => {
    setFormData((prev) => ({ ...prev, image_url: url }));
    if (!imageFile) {
      setImagePreview(url || null);
      setRemoveCurrentImage(!url);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image_url: '' }));
    setRemoveCurrentImage(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setErrorMessage('Vui lòng nhập mã sản phẩm');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let savedProduct = null;
      const isCustom = String(product?.id || '').startsWith('custom_');

      if (isCustom) {
        // Handle custom favorite item
        savedProduct = {
          ...product,
          ...formData,
          code: formData.code.trim().toUpperCase(),
          image_url: removeCurrentImage
            ? null
            : imagePreview || formData.image_url || product.image_url || null,
        };
      } else if (isEditing) {
        // 1. Update text metadata
        savedProduct = await productApi.updateProduct(product.id, {
          ...formData,
          code: formData.code.trim().toUpperCase(),
          image_url: removeCurrentImage
            ? null
            : formData.image_url || undefined,
        });

        // 2. Handle image changes
        if (removeCurrentImage) {
          savedProduct = await productApi.removeProductImage(product.id);
        } else if (imageFile) {
          savedProduct = await productApi.uploadProductImage(product.id, imageFile);
        }
      } else {
        // Create new database product
        savedProduct = await productApi.createProduct({
          ...formData,
          code: formData.code.trim().toUpperCase(),
        });
        if (imageFile) {
          savedProduct = await productApi.uploadProductImage(savedProduct.id, imageFile);
        }
      }

      if (onSaved) {
        onSaved(savedProduct);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi khi lưu sản phẩm');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden w-full max-w-2xl my-auto animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-base font-bold text-slate-900">
            {isEditing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Code (SKU) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Mã sản phẩm (SKU Code) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Ví dụ: CLEAR_48H_CHAI_630G"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 uppercase"
            />
          </div>

          {/* Name / Display label */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Tên hiển thị / Mô tả sản phẩm</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ví dụ: Dầu gội Clear 48H sạch gàu chai 630g"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Grid Brand & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Thương hiệu</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Ví dụ: CLEAR, OMO, PEPSI..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Ngành hàng / Loại</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ví dụ: DG (Dầu gội), NG (Nước giặt)..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Packaging, Volume & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Quy cách đóng gói</label>
              <input
                type="text"
                value={formData.packaging}
                onChange={(e) => setFormData({ ...formData, packaging: e.target.value })}
                placeholder="Ví dụ: CHAI, LON, TÚI..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Dung tích / Khối lượng</label>
              <input
                type="text"
                value={formData.volume}
                onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                placeholder="Ví dụ: 380G, 630ML..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Trạng thái / Mẫu</label>
              <select
                value={formData.status_version}
                onChange={(e) => setFormData({ ...formData, status_version: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              >
                <option value="CHUẨN">CHUẨN</option>
                <option value="MẪU MỚI">MẪU MỚI</option>
                <option value="MẪU CŨ">MẪU CŨ</option>
                <option value="KHUYẾN MÃI">KHUYẾN MÃI (KM)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Ghi chú / Lưu ý dán nhãn
            </label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ví dụ: NẾU CÓ THÊM SP TẶNG KÈM THÌ KHOANH NHÃN KM..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Image Upload Area */}
          <div className="pt-1">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Hình ảnh mẫu sản phẩm
            </label>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative w-24 h-24 bg-white border border-slate-200 rounded-xl p-1.5 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain"
                      onError={() => {
                        // don't hide parent, keep fallback
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors shadow-xs"
                      title="Gỡ ảnh này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-slate-100 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 flex-shrink-0">
                    <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                    <span className="text-[10px]">Chưa có ảnh</span>
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="image-file-input"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-file-input"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer border border-blue-200 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{imagePreview ? 'Thay đổi ảnh khác' : 'Chọn ảnh từ máy tính'}</span>
                    </label>
                    {imageFile && (
                      <span className="text-[11px] text-emerald-600 font-medium">
                        ✓ Đã chọn file ({imageFile.name})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Hỗ trợ PNG, JPG, JPEG, WebP. Tự động tối ưu hóa kích thước.
                  </p>
                </div>
              </div>

              {/* Paste Image URL Input */}
              <div className="pt-2 border-t border-slate-200/60">
                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    placeholder="Hoặc dán URL hình ảnh trực tiếp (https://...)"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-sans"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors shadow-sm"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Đang lưu...
                </span>
              ) : isEditing ? (
                'Cập nhật sản phẩm'
              ) : (
                'Thêm sản phẩm'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
