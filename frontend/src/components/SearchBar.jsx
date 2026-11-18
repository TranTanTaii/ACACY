import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Image as ImageIcon, ImageOff, Filter, Tag, ChevronDown, Zap } from 'lucide-react';
import { productApi } from '../api/productApi';

const COMMON_PATTERNS = [
  { code: '_BCR', desc: 'Bàn chải' },
  { code: '_BG', desc: 'Bột giặt' },
  { code: '_DG', desc: 'Dầu gội' },
  { code: '_DX', desc: 'Dầu xả' },
  { code: '_KDR', desc: 'Kem đánh răng' },
  { code: '_KEM_U', desc: 'Kem ủ' },
  { code: '_NG', desc: 'Nước giặt' },
  { code: '_NLS', desc: 'Lau sàn' },
  { code: '_NRC', desc: 'Rửa chén' },
  { code: '_NRT', desc: 'Rửa tay' },
  { code: '_NSM', desc: 'Súc miệng' },
  { code: '_NXV', desc: 'Xả vải' },
  { code: '_ST', desc: 'Sữa tắm' },
  { code: '_VIEN_GIAT', desc: 'Viên giặt' },
  { code: '_XP', desc: 'Xà phòng' },
];

export default function SearchBar({
  searchQuery,
  onSearchChange,
  onSelectSuggestion,
  selectedBrand,
  onBrandChange,
  brands = [],
  imageFilter,
  onImageFilterChange,
  statusFilter,
  onStatusFilterChange
}) {
  const [inputValue, setInputValue] = useState(searchQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);
  const hoverTimeoutRef = useRef(null);

  // Sap xep danh sach nhan hieu theo alphabet A-Z
  const sortedBrands = React.useMemo(() => {
    return [...brands].sort((a, b) => (a.brand || '').localeCompare(b.brand || '', 'vi', { sensitivity: 'base' }));
  }, [brands]);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync external search query
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced fetch suggestions
  const handleInputChange = (val) => {
    setInputValue(val);
    setSelectedIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val || val.trim().length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      onSearchChange('');
      if (selectedBrand) onBrandChange('');
      return;
    }

    // Neu nguoi dung sua chu khong con khop voi brand nua thi reset brand filter de tim kiem tu do
    if (selectedBrand && !val.toUpperCase().startsWith(selectedBrand.toUpperCase())) {
      onBrandChange('');
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await productApi.getSuggestions(val, 12);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setIsLoading(false);
      }
      onSearchChange(val);
    }, 200);
  };

  // Xu ly khi bam chon nhanh 1 nhan hieu -> Nhay text len thanh tim kiem de sua ma
  const handleBrandClick = (brandName) => {
    const isSelected = selectedBrand === brandName;
    if (isSelected) {
      // Bam lai nhan hieu dang chon -> Huy loc
      onBrandChange('');
      if (inputValue === brandName) {
        setInputValue('');
        onSearchChange('');
        setSuggestions([]);
        setIsOpen(false);
      }
    } else {
      // Chon nhan hieu -> Nhay text len thanh tim kiem & focus con tro vao cuoi
      onBrandChange(brandName);
      setInputValue(brandName);
      onSearchChange(brandName);

      // Load ngay goi y cac ma cua nhan hieu nay
      productApi.getSuggestions(brandName, 12).then((results) => {
        setSuggestions(results);
        setIsOpen(results.length > 0);
      }).catch(() => {});

      // Focus vao o tim kiem va dat con tro chuot o cuoi de nguoi dung tien go them ma
      if (inputRef.current) {
        inputRef.current.focus();
        setTimeout(() => {
          if (inputRef.current) {
            const len = brandName.length;
            inputRef.current.setSelectionRange(len, len);
          }
        }, 50);
      }
    }
  };

  const handleResetBrand = () => {
    onBrandChange('');
    if (selectedBrand && inputValue === selectedBrand) {
      setInputValue('');
      onSearchChange('');
      setSuggestions([]);
      setIsOpen(false);
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Tim mau dang co trong chuoi tim kiem
  const getActivePattern = (text) => {
    if (!text) return null;
    const upper = text.toUpperCase();
    const sorted = [...COMMON_PATTERNS].sort((a, b) => b.code.length - a.code.length);
    for (const p of sorted) {
      if (upper.includes(p.code)) {
        return p.code;
      }
    }
    return null;
  };

  const activePattern = getActivePattern(inputValue);

  // Xu ly khi click vao 1 nut mau (_NRC, _NLS, _NG...) -> Noi chuoi hoac thay the mau
  const handlePatternClick = (patternCode) => {
    const currentVal = inputValue || '';
    const currentPattern = getActivePattern(currentVal);
    let nextVal = '';

    if (currentPattern === patternCode) {
      // Bam lai mau dang chon -> Huy mau khoi chuoi tim kiem
      nextVal = currentVal.replace(new RegExp(patternCode, 'i'), '').trim();
      if (nextVal.endsWith('_')) nextVal = nextVal.slice(0, -1);
    } else if (currentPattern) {
      // Thay the mau cu bang mau moi
      nextVal = currentVal.replace(new RegExp(currentPattern, 'i'), patternCode);
    } else {
      // Noi mau moi vao chuoi tim kiem
      if (!currentVal.trim()) {
        nextVal = patternCode;
      } else if (currentVal.endsWith('_')) {
        nextVal = currentVal + patternCode.replace(/^_/, '');
      } else {
        nextVal = currentVal + patternCode;
      }
    }

    setInputValue(nextVal);
    onSearchChange(nextVal);

    if (nextVal.trim().length > 0) {
      productApi.getSuggestions(nextVal, 12).then((results) => {
        setSuggestions(results);
        setIsOpen(results.length > 0);
      }).catch(() => {});
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }

    if (inputRef.current) {
      inputRef.current.focus();
      setTimeout(() => {
        if (inputRef.current) {
          const len = nextVal.length;
          inputRef.current.setSelectionRange(len, len);
        }
      }, 50);
    }
  };

  const handleRemovePattern = () => {
    if (!activePattern) return;
    let nextVal = (inputValue || '').replace(new RegExp(activePattern, 'i'), '').trim();
    if (nextVal.endsWith('_')) nextVal = nextVal.slice(0, -1);
    setInputValue(nextVal);
    onSearchChange(nextVal);
    if (nextVal.trim().length > 0) {
      productApi.getSuggestions(nextVal, 12).then((results) => {
        setSuggestions(results);
        setIsOpen(results.length > 0);
      }).catch(() => {});
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
    if (inputRef.current) inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        onSearchChange(inputValue);
        setIsOpen(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      } else {
        onSearchChange(inputValue);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (item) => {
    setInputValue(item.code);
    setIsOpen(false);
    onSearchChange(item.code);
    onSelectSuggestion(item);
  };

  const clearSearch = () => {
    setInputValue('');
    setSuggestions([]);
    setIsOpen(false);
    onSearchChange('');
    if (selectedBrand) onBrandChange('');
  };

  return (
    <div className="w-full space-y-3">
      {/* Search Input Bar */}
      <div ref={containerRef} className="relative w-full">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className={`w-5 h-5 ${isLoading ? 'animate-pulse text-blue-500' : ''}`} />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm theo mã sản phẩm (ví dụ: CLEAR, OMO, PS, PEPSI, 380G...)..."
            className="w-full pl-11 pr-24 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-sm transition-all"
          />

          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
            {inputValue && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">
              Enter
            </kbd>
          </div>
        </div>

        {/* Suggestion Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100 flex justify-between">
              <span>Gợi ý mã sản phẩm ({suggestions.length})</span>
              <span className="normal-case text-slate-400 font-normal">Dùng phím ↑ ↓ để chọn</span>
            </div>
            <ul>
              {suggestions.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <li
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between border-b border-slate-50 transition-colors ${
                      isSelected ? 'bg-blue-50/80 text-blue-900' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Mini Thumbnail or Icon */}
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {item.has_image ? (
                          <img
                            src={item.image_url}
                            alt={item.code}
                            className="w-full h-full object-contain p-0.5"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <ImageOff className="w-4 h-4 text-slate-400" />
                        )}
                      </div>

                      <div className="truncate">
                        <div className="font-medium text-sm truncate font-mono">{item.code}</div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          {item.brand && (
                            <span className="font-semibold text-blue-600">{item.brand}</span>
                          )}
                          {item.status_version && (
                            <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              {item.status_version}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {item.has_image ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <ImageIcon className="w-3 h-3 text-emerald-600" /> Có ảnh
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Chưa ảnh
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Cử chỉ rê chuột (Hover) mở rộng / thu gọn danh sách nhãn hiệu & bộ lọc */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-full pt-1 border-t border-slate-100 transition-all"
      >
        {/* Thanh mũi tên cử chỉ ngay dưới ô tìm kiếm */}
        <div
          onClick={() => setIsExpanded((prev) => !prev)}
          className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 select-none ${
            isExpanded
              ? 'bg-blue-50/90 border border-blue-200 text-blue-900 shadow-xs'
              : 'bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 text-slate-600'
          }`}
          title={isExpanded ? 'Rê chuột ra xa để thu gọn' : 'Rê chuột lại gần để mở rộng'}
        >
          {/* Thông tin nhãn hiệu & bộ lọc đang kích hoạt */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span>Nhãn hiệu & Bộ lọc:</span>
            </span>

            {/* Huy hiệu nhãn hiệu đang chọn */}
            {selectedBrand ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold shadow-xs">
                {selectedBrand}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetBrand();
                  }}
                  className="hover:text-blue-200 font-bold ml-1 text-xs"
                  title="Bỏ lọc nhãn hiệu"
                >
                  ✕
                </button>
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium">
                Tất cả nhãn hiệu ({brands.length})
              </span>
            )}

            {/* Huy hiệu mẫu thường gặp đang chọn */}
            {activePattern && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-mono font-semibold">
                {activePattern}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePattern();
                  }}
                  className="hover:text-purple-950 font-bold ml-0.5 text-xs font-sans"
                  title="Bỏ mẫu tìm kiếm"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Huy hiệu trạng thái / ảnh đang chọn */}
            {(imageFilter !== null || statusFilter) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[11px] font-medium">
                {imageFilter === true ? 'Có ảnh' : imageFilter === false ? 'Chưa ảnh' : ''}
                {imageFilter !== null && statusFilter ? ' • ' : ''}
                {statusFilter || ''}
              </span>
            )}
          </div>

          {/* Mũi tên hướng dẫn cử chỉ rê chuột */}
          <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0 ml-2">
            <span className="text-[11px] font-medium hidden sm:inline transition-colors">
              {isExpanded ? 'Rê chuột ra xa để thu gọn' : 'Rê chuột vào để mở'}
            </span>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-300 ${
                isExpanded
                  ? 'rotate-180 bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-500 border-slate-200 group-hover:border-blue-400 group-hover:text-blue-600 group-hover:shadow-xs'
              }`}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Khung nội dung mở rộng: Nút chọn nhãn hiệu & Bộ lọc */}
        {isExpanded && (
          <div className="mt-2.5 space-y-3 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Hàng chọn nhãn hiệu */}
            {brands && brands.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Bấm chọn nhãn hiệu ({brands.length}):
                  </span>
                  {selectedBrand && (
                    <button
                      type="button"
                      onClick={handleResetBrand}
                      className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      Đặt lại (Xem tất cả)
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {/* Button Tất cả nhãn hiệu */}
                  <button
                    type="button"
                    onClick={handleResetBrand}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${
                      !selectedBrand
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-sm shadow-blue-500/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 hover:border-slate-300 font-medium'
                    }`}
                  >
                    Tất cả nhãn hiệu
                  </button>

                  {/* Danh sách nút các nhãn hiệu */}
                  {sortedBrands.map((b) => {
                    const isSelected = selectedBrand === b.brand;
                    return (
                      <button
                        key={b.brand}
                        type="button"
                        onClick={() => handleBrandClick(b.brand)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm shadow-blue-500/20 ring-2 ring-blue-500/20'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 font-medium'
                        }`}
                      >
                        <span>{b.brand}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                            isSelected
                              ? 'bg-blue-700/80 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {b.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hàng mẫu thường gặp (Bấm để nối chuỗi tìm kiếm) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="text-[11px] text-slate-600 font-semibold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Mẫu thường gặp (Bấm để nối mã tìm kiếm):</span>
                </span>
                {activePattern && (
                  <button
                    type="button"
                    onClick={handleRemovePattern}
                    className="text-[11px] text-purple-600 hover:text-purple-800 hover:underline font-medium"
                  >
                    Bỏ chọn mẫu ({activePattern})
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {COMMON_PATTERNS.map((p) => {
                  const isSelected = activePattern === p.code;
                  return (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => handlePatternClick(p.code)}
                      title={`${p.code}: ${p.desc} (Bấm để nối vào ô tìm kiếm)`}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-sm shadow-purple-500/20 ring-2 ring-purple-400/30'
                          : 'bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-800 border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <span className="font-mono font-bold">{p.code}</span>
                      <span
                        className={`text-[10px] ${
                          isSelected ? 'text-purple-100' : 'text-slate-400'
                        }`}
                      >
                        {p.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hàng bộ lọc: Ảnh & Trạng thái */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium mr-1 flex items-center gap-1 text-[11px]">
                <Filter className="w-3 h-3" /> Trạng thái:
              </span>

              {/* Lọc ảnh */}
              <button
                onClick={() => onImageFilterChange(null)}
                className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${
                  imageFilter === null
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Tất cả ảnh
              </button>
              <button
                onClick={() => onImageFilterChange(true)}
                className={`px-2.5 py-1 rounded-full border text-[11px] font-medium inline-flex items-center gap-1 transition-all ${
                  imageFilter === true
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                <ImageIcon className="w-3 h-3" /> Có ảnh
              </button>
              <button
                onClick={() => onImageFilterChange(false)}
                className={`px-2.5 py-1 rounded-full border text-[11px] font-medium inline-flex items-center gap-1 transition-all ${
                  imageFilter === false
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'
                }`}
              >
                <ImageOff className="w-3 h-3" /> Chưa ảnh
              </button>

              {/* Lọc trạng thái / phiên bản */}
              <div className="h-3.5 w-px bg-slate-300 mx-1"></div>
              {['CHUẨN', 'MẪU MỚI', 'MẪU CŨ', 'KHUYẾN MÃI'].map((st) => (
                <button
                  key={st}
                  onClick={() => onStatusFilterChange(statusFilter === st ? '' : st)}
                  className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
