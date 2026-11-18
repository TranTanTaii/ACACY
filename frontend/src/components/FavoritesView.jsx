import React, { useState, useMemo, useEffect } from 'react';
import { 
  Star, Search, Plus, Copy, Check, Trash2, LayoutGrid, List as ListIcon, 
  ImageOff, ExternalLink, Sparkles, Filter, X, ArrowRight, RefreshCw
} from 'lucide-react';
import { productApi } from '../api/productApi';

function SafeFavoriteImage({ src, alt }) {
  const [hasErr, setHasErr] = useState(false);

  useEffect(() => {
    setHasErr(false);
  }, [src]);

  if (!src || hasErr) {
    return (
      <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
        <ImageOff className="w-6 h-6 mb-1 text-slate-300" />
        <span>Chưa có hình</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      className="max-h-full max-w-full object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-200"
      loading="lazy"
      onError={() => setHasErr(true)}
    />
  );
}

function SafeTableThumb({ src, alt }) {
  const [hasErr, setHasErr] = useState(false);

  useEffect(() => {
    setHasErr(false);
  }, [src]);

  if (!src || hasErr) {
    return <ImageOff className="w-4 h-4 text-slate-300" />;
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      className="max-h-full max-w-full object-contain"
      loading="lazy"
      onError={() => setHasErr(true)}
    />
  );
}

export default function FavoritesView({
  favorites = [],
  onRemoveFavorite,
  onClearAllFavorites,
  onOpenAddModal,
  onViewProduct,
  onGoToCatalog,
  onUpdateFavorites,
  showToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [copiedCode, setCopiedCode] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Extract unique brands among saved favorites
  const brands = useMemo(() => {
    const set = new Set();
    favorites.forEach(f => {
      if (f.brand) set.add(f.brand.toUpperCase());
    });
    return Array.from(set).sort();
  }, [favorites]);

  // Filtered items based on search query and brand
  const filteredFavorites = useMemo(() => {
    return favorites.filter(item => {
      // Brand filter
      if (selectedBrand && (item.brand || '').toUpperCase() !== selectedBrand) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const codeMatch = (item.code || '').toLowerCase().includes(q);
        const nameMatch = (item.name || '').toLowerCase().includes(q);
        const brandMatch = (item.brand || '').toLowerCase().includes(q);
        const catMatch = (item.category || '').toLowerCase().includes(q);
        const notesMatch = (item.notes || '').toLowerCase().includes(q);
        return codeMatch || nameMatch || brandMatch || catMatch || notesMatch;
      }
      return true;
    });
  }, [favorites, searchQuery, selectedBrand]);

  // Copy a single code
  const handleCopyCode = (code, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    if (showToast) showToast(`Đã copy mã: ${code}`);
    setTimeout(() => {
      setCopiedCode(prev => (prev === code ? null : prev));
    }, 2000);
  };

  // Copy all visible codes
  const handleCopyAllCodes = () => {
    if (filteredFavorites.length === 0) return;
    const allCodes = filteredFavorites.map(f => f.code).join('\n');
    navigator.clipboard.writeText(allCodes);
    setCopiedAll(true);
    if (showToast) showToast(`Đã copy ${filteredFavorites.length} mã sản phẩm vào bộ nhớ tạm!`);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Sync / refresh images and info from database
  const handleSyncImages = async () => {
    if (favorites.length === 0) return;
    setIsSyncing(true);
    try {
      const codes = favorites.map(f => f.code);
      const dbProducts = await productApi.batchLookup(codes);
      const dbMap = new Map(dbProducts.map(p => [p.code.toUpperCase(), p]));
      let updatedCount = 0;
      const updatedFavorites = favorites.map(f => {
        const dbProd = dbMap.get(f.code.toUpperCase());
        if (dbProd) {
          if (dbProd.image_url !== f.image_url) updatedCount++;
          return {
            ...f,
            ...dbProd,
            id: dbProd.id || f.id,
            image_url: dbProd.image_url || f.image_url
          };
        }
        return f;
      });
      if (onUpdateFavorites) {
        onUpdateFavorites(updatedFavorites);
      }
      if (showToast) {
        showToast(`✓ Đã đồng bộ hình ảnh kho (${updatedCount} ảnh mới)!`);
      }
    } catch (e) {
      console.error(e);
      if (showToast) showToast('Lỗi khi đồng bộ hình ảnh', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Star className="w-48 h-48 fill-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-amber-100 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Khu vực tra cứu nhanh cá nhân</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              ⭐ Danh sách hay dùng
            </h1>
            <p className="text-xs sm:text-sm text-amber-100 max-w-xl">
              Nơi lưu trữ các nhãn hiệu & hình ảnh sản phẩm bạn hay kiểm tra. Tra cứu tức thì và sao chép mã chỉ với 1 cú click!
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-white text-amber-700 hover:bg-amber-50 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-600" />
              <span>＋ Thêm nhãn & hình</span>
            </button>

            {favorites.length > 0 && (
              <button
                onClick={handleSyncImages}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all border border-white/30 backdrop-blur-xs"
                title="Đồng bộ lại hình ảnh mới nhất từ cơ sở dữ liệu"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Làm mới ảnh</span>
              </button>
            )}

            {favorites.length > 0 && (
              <button
                onClick={handleCopyAllCodes}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-700/60 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all border border-amber-400/40"
                title="Sao chép toàn bộ danh sách mã đang lọc"
              >
                {copiedAll ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedAll ? 'Đã copy tất cả!' : 'Copy tất cả mã'}</span>
              </button>
            )}

            {favorites.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Bạn có chắc muốn xóa tất cả sản phẩm trong Danh sách hay dùng?')) {
                    onClearAllFavorites();
                  }
                }}
                className="p-2 bg-white/10 hover:bg-rose-600 hover:text-white text-amber-100 rounded-xl transition-colors border border-white/20"
                title="Xóa toàn bộ danh sách"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar (Sticky on scroll) */}
      {favorites.length > 0 ? (
        <div className="sticky top-16 z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2 bg-slate-50/95 backdrop-blur-md transition-all shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)]">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-shadow space-y-2.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search Input inside Favorites */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm nhanh trong danh sách hay dùng (mã, nhãn hiệu, tên)..."
                  className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Actions & View mode toggle */}
              <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
                <span className="text-xs font-medium text-slate-500 hidden sm:inline-block">
                  Hiển thị <b className="text-amber-600">{filteredFavorites.length}</b> / <b className="text-slate-800">{favorites.length}</b> mã
                </span>

                {/* Sync Images button */}
                <button
                  type="button"
                  onClick={handleSyncImages}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                  title="Cập nhật lại hình ảnh từ kho"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">Đồng bộ ảnh</span>
                </button>

                {/* Quick Add button in sticky toolbar */}
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-xs active:scale-95"
                  title="Thêm nhãn & hình hay dùng"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm</span>
                </button>

                {/* Quick Copy All button in sticky toolbar */}
                <button
                  type="button"
                  onClick={handleCopyAllCodes}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 font-bold text-xs rounded-xl transition-all active:scale-95"
                  title="Copy tất cả mã đang lọc"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
                  <span>{copiedAll ? 'Đã copy!' : 'Copy tất cả'}</span>
                </button>

                {/* Grid / Table toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-white text-amber-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Xem dạng thẻ (Grid)"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition-all ${
                      viewMode === 'table'
                        ? 'bg-white text-amber-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Xem dạng bảng (Table)"
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Brand Filter Chips */}
            {brands.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-100 scrollbar-thin">
                <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 pl-1 pr-1 flex-shrink-0">
                  <Filter className="w-3 h-3" /> Nhãn:
                </span>
                <button
                  onClick={() => setSelectedBrand('')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors ${
                    selectedBrand === ''
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({favorites.length})
                </button>
                {brands.map(b => {
                  const count = favorites.filter(f => (f.brand || '').toUpperCase() === b).length;
                  return (
                    <button
                      key={b}
                      onClick={() => setSelectedBrand(selectedBrand === b ? '' : b)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors ${
                        selectedBrand === b
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {b} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Main List Display */}
      {favorites.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 p-10 sm:p-14 text-center max-w-xl mx-auto shadow-sm my-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <Star className="w-8 h-8 fill-amber-400 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Danh sách hay dùng chưa có sản phẩm nào</h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
            Bạn có thể dễ dàng thêm sản phẩm vào đây bằng cách bấm dấu <b>⭐</b> trên bất kỳ sản phẩm nào trong kho, hoặc bấm <b>"＋ Thêm nhãn & hình"</b> để dán hàng loạt mã hay dùng từ Excel!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm nhãn & hình hay dùng</span>
            </button>
            <button
              onClick={onGoToCatalog}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span>Vào kho sản phẩm</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : filteredFavorites.length === 0 ? (
        /* Filter has no matches */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          <p className="mb-3">Không tìm thấy sản phẩm nào khớp với từ khóa <b>"{searchQuery}"</b> trong danh sách hay dùng.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedBrand('');
            }}
            className="text-amber-600 font-semibold hover:underline"
          >
            Xóa bộ lọc tìm kiếm
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFavorites.map((item) => {
            const isCopied = copiedCode === item.code;
            return (
              <div
                key={item.code}
                onClick={() => onViewProduct && onViewProduct(item)}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all duration-200 p-3.5 flex flex-col justify-between cursor-pointer relative"
              >
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFavorite(item.code);
                  }}
                  className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-slate-100/80 hover:bg-rose-50 hover:text-rose-600 text-slate-400 flex items-center justify-center transition-colors"
                  title="Bỏ khỏi danh sách hay dùng"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Top: Image & Badges */}
                <div>
                  <div className="w-full h-40 bg-slate-50 rounded-xl mb-3 border border-slate-100 flex items-center justify-center p-2 overflow-hidden group-hover:bg-amber-50/20 transition-colors">
                    <SafeFavoriteImage src={item.image_url} alt={item.code} />
                  </div>

                  {/* Brand & Status Badges */}
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    {item.brand && (
                      <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                        {item.brand}
                      </span>
                    )}
                    {item.status_version && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                        item.status_version.includes('MỚI')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status_version.includes('CŨ')
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {item.status_version}
                      </span>
                    )}
                    {item.volume && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        {item.volume}
                      </span>
                    )}
                  </div>

                  {/* Code (Clickable to copy) */}
                  <div
                    onClick={(e) => handleCopyCode(item.code, e)}
                    className="group/code cursor-copy mb-2"
                    title="Bấm để copy mã"
                  >
                    <code className="text-xs font-mono font-bold text-slate-900 group-hover/code:text-amber-600 transition-colors line-clamp-2 select-all">
                      {item.code}
                    </code>
                  </div>

                  {item.name && item.name !== item.code && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                      {item.name}
                    </p>
                  )}
                </div>

                {/* Big Copy Button */}
                <div className="pt-2 border-t border-slate-100 mt-1">
                  <button
                    type="button"
                    onClick={(e) => handleCopyCode(item.code, e)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-800 border border-amber-200/80'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>✓ Đã chép mã!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>📋 Copy mã</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Mode */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-16 text-center">Hình</th>
                  <th className="py-3 px-4">Mã SKU</th>
                  <th className="py-3 px-3">Nhãn hiệu</th>
                  <th className="py-3 px-3">Quy cách</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-3 text-center">Sao chép</th>
                  <th className="py-3 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredFavorites.map((item) => {
                  const isCopied = copiedCode === item.code;
                  return (
                    <tr
                      key={item.code}
                      onClick={() => onViewProduct && onViewProduct(item)}
                      className="hover:bg-amber-50/30 transition-colors cursor-pointer"
                    >
                      {/* Image */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center mx-auto">
                          <SafeTableThumb src={item.image_url} alt={item.code} />
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-2.5 px-4">
                        <span className="font-mono font-bold text-slate-900 select-all hover:text-amber-600 transition-colors">
                          {item.code}
                        </span>
                        {item.name && item.name !== item.code && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{item.name}</div>
                        )}
                      </td>

                      {/* Brand */}
                      <td className="py-2.5 px-3">
                        {item.brand ? (
                          <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {item.brand}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Volume */}
                      <td className="py-2.5 px-3 text-slate-600">
                        {item.volume || '-'}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3">
                        {item.status_version ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {item.status_version}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Copy Action */}
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleCopyCode(item.code, e)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-100 hover:bg-amber-500 hover:text-white text-amber-800'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy mã</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Remove Action */}
                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onRemoveFavorite(item.code)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Bỏ khỏi danh sách"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
