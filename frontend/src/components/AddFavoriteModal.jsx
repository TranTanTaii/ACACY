import React, { useState } from 'react';
import { X, Search, Plus, Check, FileText, Image as ImageIcon, AlertCircle, Copy, Layers } from 'lucide-react';
import { productApi } from '../api/productApi';

export default function AddFavoriteModal({
  isOpen,
  onClose,
  onAddProduct,
  onBatchAddProducts,
  existingCodes = new Set()
}) {
  const [activeTab, setActiveTab] = useState('paste'); // 'paste' | 'search' | 'custom'

  // Tab 1: Paste codes
  const [pasteText, setPasteText] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResults, setLookupResults] = useState(null); // { found: [], notFound: [] }

  // Tab 2: Search from catalog
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogResults, setCatalogResults] = useState([]);

  // Tab 3: Custom item
  const [customCode, setCustomCode] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [customName, setCustomName] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [customImagePreview, setCustomImagePreview] = useState(null);

  if (!isOpen) return null;

  // Handle Tab 1: Batch Lookup
  const handleLookupCodes = async () => {
    if (!pasteText.trim()) return;

    // Split by newlines, commas, tabs, spaces
    const rawTokens = pasteText
      .split(/[\r\n,\t;]+/)
      .map(s => s.trim())
      .filter(Boolean);

    // Unique codes
    const uniqueCodes = Array.from(new Set(rawTokens));
    if (uniqueCodes.length === 0) return;

    setIsLookingUp(true);
    try {
      const foundProducts = await productApi.batchLookup(uniqueCodes);
      
      const foundCodeSet = new Set(foundProducts.map(p => p.code.toUpperCase()));
      const notFoundCodes = uniqueCodes.filter(c => !foundCodeSet.has(c.toUpperCase()));

      setLookupResults({
        found: foundProducts,
        notFound: notFoundCodes
      });
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tra cứu mã sản phẩm');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleConfirmBatchAdd = () => {
    if (!lookupResults) return;

    const toAdd = [...lookupResults.found];

    // Also include unmatched codes as custom items
    lookupResults.notFound.forEach(code => {
      toAdd.push({
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        code: code,
        name: code,
        brand: code.split('_')[0] || 'KHÁC',
        status_version: 'TỰ THÊM',
        image_url: null
      });
    });

    onBatchAddProducts(toAdd);
    setPasteText('');
    setLookupResults(null);
    onClose();
  };

  // Handle Tab 2: Catalog Search
  const handleCatalogSearch = async (val) => {
    setCatalogSearch(val);
    if (!val || val.trim().length < 2) {
      setCatalogResults([]);
      return;
    }
    setCatalogLoading(true);
    try {
      const res = await productApi.getProducts({ query: val.trim(), page_size: 15 });
      setCatalogResults(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCatalogLoading(false);
    }
  };

  // Handle Tab 3: Custom file input
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomImagePreview(reader.result);
        setCustomImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (!customCode.trim()) return;

    const newProd = {
      id: `custom_${Date.now()}`,
      code: customCode.trim().toUpperCase(),
      name: customName.trim() || customCode.trim(),
      brand: customBrand.trim().toUpperCase() || customCode.split('_')[0] || 'KHÁC',
      status_version: 'TỰ THÊM',
      image_url: customImageUrl || null
    };

    onAddProduct(newProd);
    setCustomCode('');
    setCustomBrand('');
    setCustomName('');
    setCustomImageUrl('');
    setCustomImagePreview(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              ★
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Thêm vào Danh sách hay dùng</h2>
              <p className="text-xs text-slate-500">Lưu nhanh các nhãn hiệu & hình ảnh thường dùng để tra cứu và copy mã</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'paste'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Dán danh sách mã</span>
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'search'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>2. Chọn từ kho sản phẩm</span>
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'custom'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>3. Tự tạo nhãn & hình riêng</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-700">
          {/* TAB 1: PASTE CODES */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Dán danh sách mã sản phẩm vào đây (mỗi mã 1 dòng hoặc cách nhau bởi dấu phẩy, khoảng trắng):
                </label>
                <textarea
                  rows={5}
                  value={pasteText}
                  onChange={(e) => {
                    setPasteText(e.target.value);
                    setLookupResults(null);
                  }}
                  placeholder="Ví dụ:&#10;PS_KDR_THAO_DUOC_10_LOI_ICH_100G&#10;OMO_BG_CHUYEN_GIA_CHO_MAY_CUA_TRUOC_COMFORT_6KG&#10;SUNSILK_DG_MEM_MUOT_TOA_HUONG_650G"
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>

              {!lookupResults ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleLookupCodes}
                    disabled={isLookingUp || !pasteText.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-amber-500/20"
                  >
                    {isLookingUp ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Đang tra cứu dữ liệu & hình ảnh...
                      </span>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Tra cứu & Lấy hình ảnh từ kho</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-emerald-700 font-bold">✓ Tìm thấy {lookupResults.found.length} sản phẩm</span>
                      {lookupResults.notFound.length > 0 && (
                        <span className="text-amber-700 font-medium ml-2">
                          (và {lookupResults.notFound.length} mã chưa có trong kho)
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setLookupResults(null)}
                      className="text-slate-400 hover:text-slate-600 text-[11px] underline"
                    >
                      Dán lại
                    </button>
                  </div>

                  {/* List of matched items */}
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                    {lookupResults.found.map((prod) => (
                      <div key={prod.id || prod.code} className="flex items-center gap-3 pt-2 text-xs">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {prod.image_url ? (
                            <img src={prod.image_url} alt="" className="w-full h-full object-contain p-0.5" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-bold text-slate-800 truncate">{prod.code}</div>
                          <div className="text-[11px] text-slate-500 truncate">{prod.brand} • {prod.category || 'Sản phẩm'}</div>
                        </div>
                        {existingCodes.has(prod.code) && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                            Đã có sẵn
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Not found items */}
                    {lookupResults.notFound.map((code) => (
                      <div key={code} className="flex items-center gap-3 pt-2 text-xs opacity-75">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex-shrink-0 flex items-center justify-center text-amber-600 text-[10px] font-bold">
                          MỚI
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-semibold text-slate-700 truncate">{code}</div>
                          <div className="text-[11px] text-amber-600">Mã chưa có hình trong kho (vẫn thêm được)</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Confirm button */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setLookupResults(null)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmBatchAdd}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Xác nhận thêm {lookupResults.found.length + lookupResults.notFound.length} mã vào danh sách</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CATALOG SEARCH */}
          {activeTab === 'search' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => handleCatalogSearch(e.target.value)}
                  placeholder="Gõ mã SKU hoặc tên nhãn hiệu để tìm (ví dụ: OMO, PS, COMFORT)..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>

              {catalogLoading ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Đang tìm kiếm trong kho sản phẩm...
                </div>
              ) : catalogResults.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  {catalogSearch.trim().length >= 2 
                    ? 'Không tìm thấy sản phẩm nào khớp với từ khóa.'
                    : 'Nhập ít nhất 2 ký tự để tìm kiếm sản phẩm trong kho.'}
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                  {catalogResults.map((p) => {
                    const isAlreadyAdded = existingCodes.has(p.code);
                    return (
                      <div key={p.id} className="flex items-center justify-between gap-3 pt-2 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-lg bg-slate-50 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {p.image_url ? (
                              <img src={p.image_url} alt="" className="w-full h-full object-contain p-0.5" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-mono font-bold text-slate-800 truncate">{p.code}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <span className="font-semibold text-blue-600">{p.brand}</span>
                              {p.volume && <span>• {p.volume}</span>}
                              {p.status_version && (
                                <span className="bg-slate-100 text-slate-600 px-1 rounded text-[10px]">
                                  {p.status_version}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onAddProduct(p)}
                          disabled={isAlreadyAdded}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all ${
                            isAlreadyAdded
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                          }`}
                        >
                          {isAlreadyAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Đã lưu</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Thêm</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM ITEM */}
          {activeTab === 'custom' && (
            <form onSubmit={handleAddCustom} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mã sản phẩm / SKU <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="Ví dụ: OMO_BG_COMFORT_6KG"
                  className="w-full font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nhãn hàng / Thương hiệu:</label>
                  <input
                    type="text"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="Ví dụ: OMO, PS, SUNSILK"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tên gọi / Mô tả ngắn:</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Tùy chọn..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Image Input */}
              <div className="space-y-2 pt-1">
                <label className="block font-semibold text-slate-700">Hình ảnh nhãn sản phẩm:</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                    {customImagePreview || customImageUrl ? (
                      <img src={customImagePreview || customImageUrl} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customImageUrl}
                      onChange={(e) => {
                        setCustomImageUrl(e.target.value);
                        setCustomImagePreview(null);
                      }}
                      placeholder="Hoặc dán URL hình ảnh (https://...)"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!customCode.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-sm"
                >
                  + Thêm vào danh sách
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
