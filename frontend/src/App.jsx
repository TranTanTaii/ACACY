import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import FavoritesView from './components/FavoritesView';
import AddFavoriteModal from './components/AddFavoriteModal';
import ProductList from './components/ProductList';
import ProductDetailModal from './components/ProductDetailModal';
import ProductFormModal from './components/ProductFormModal';
import ImportExcelModal from './components/ImportExcelModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import { productApi } from './api/productApi';

export default function App() {
  // Navigation tab: 'all' | 'favorites'
  const [activeTab, setActiveTab] = useState('all');

  // Favorites state persisted in localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('acacy_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAddFavoriteOpen, setIsAddFavoriteOpen] = useState(false);

  // Sync favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('acacy_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error('Error saving favorites to localStorage:', e);
    }
  }, [favorites]);

  // Set of favorite codes for fast O(1) checks
  const favoriteCodeSet = useMemo(() => {
    return new Set(favorites.map(f => f.code));
  }, [favorites]);

  // Products state
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [imageFilter, setImageFilter] = useState(null); // null (all), true (has image), false (no image)
  const [statusFilter, setStatusFilter] = useState('');

  // Stats state
  const [stats, setStats] = useState(null);

  // View mode: 'grid' or 'table'
  const [viewMode, setViewMode] = useState('grid');

  // Modals state
  const [detailProduct, setDetailProduct] = useState(null);
  const [formProduct, setFormProduct] = useState(null); // null for create, object for edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deleteProductItem, setDeleteProductItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast / notification
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load stats
  const loadStats = async () => {
    try {
      const data = await productApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Load products list
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        query: searchQuery || undefined,
        brand: selectedBrand || undefined,
        has_image: imageFilter !== null ? imageFilter : undefined,
        status_version: statusFilter || undefined,
        page,
        page_size: pageSize
      };
      const res = await productApi.getProducts(params);
      setProducts(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Error loading products:', err);
      showToast('Lỗi khi tải danh sách sản phẩm', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedBrand, imageFilter, statusFilter, page, pageSize]);

  // Initial load
  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Handle Search Input Change
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setPage(1); // reset to page 1 on search
  };

  // Handle Selecting a suggestion from autocomplete
  const handleSelectSuggestion = (suggestion) => {
    // 1. Luôn cập nhật searchQuery để danh sách sản phẩm bên dưới lọc ngay sản phẩm này
    setSearchQuery(suggestion.code);
    setPage(1);

    // 2. Tự động gỡ các bộ lọc xung đột đang làm ẩn sản phẩm này (nếu có)
    if (statusFilter && suggestion.status_version) {
      const sf = statusFilter.toUpperCase();
      const sv = suggestion.status_version.toUpperCase();
      if (!sv.includes(sf) && !sf.includes(sv)) {
        setStatusFilter('');
      }
    }
    if (imageFilter !== null && imageFilter !== suggestion.has_image) {
      setImageFilter(null);
    }
    if (selectedBrand && suggestion.brand && selectedBrand.toUpperCase() !== suggestion.brand.toUpperCase()) {
      setSelectedBrand('');
    }

    // 3. Mở modal chi tiết sản phẩm
    productApi.getProduct(suggestion.id).then((p) => {
      setDetailProduct(p);
    }).catch(() => {});
  };

  // Handle Brand filter change
  const handleBrandChange = (brand) => {
    setSelectedBrand(brand);
    setPage(1);
  };

  // Handle Image filter change
  const handleImageFilterChange = (val) => {
    setImageFilter(val);
    setPage(1);
  };

  // Handle Status filter change
  const handleStatusFilterChange = (st) => {
    setStatusFilter(st);
    setPage(1);
  };

  // Favorites Handlers
  const handleToggleFavorite = (product) => {
    if (!product?.code) return;
    if (favoriteCodeSet.has(product.code)) {
      setFavorites(prev => prev.filter(f => f.code !== product.code));
      showToast(`Đã bỏ "${product.code}" khỏi Danh sách hay dùng`);
    } else {
      const item = {
        id: product.id,
        code: product.code,
        name: product.name || product.code,
        brand: product.brand || 'CHƯA PHÂN LOẠI',
        category: product.category || null,
        volume: product.volume || null,
        packaging: product.packaging || null,
        status_version: product.status_version || 'CHUẨN',
        image_url: product.image_url || null,
        notes: product.notes || null,
        sheet_name: product.sheet_name || null,
        added_at: new Date().toISOString()
      };
      setFavorites(prev => [item, ...prev]);
      showToast(`⭐ Đã thêm "${product.code}" vào Danh sách hay dùng!`);
    }
  };

  const handleRemoveFavorite = (code) => {
    setFavorites(prev => prev.filter(f => f.code !== code));
    showToast(`Đã xóa khỏi Danh sách hay dùng`);
  };

  const handleClearAllFavorites = () => {
    setFavorites([]);
    showToast('Đã xóa toàn bộ danh sách hay dùng');
  };

  const handleAddFavoriteCustom = (newProd) => {
    if (!newProd?.code) return;
    setFavorites(prev => {
      const exists = prev.some(f => f.code.toUpperCase() === newProd.code.toUpperCase());
      if (exists) return prev;
      return [newProd, ...prev];
    });
    showToast(`⭐ Đã thêm "${newProd.code}" vào Danh sách hay dùng!`);
  };

  const handleBatchAddFavorites = (newProds) => {
    if (!newProds || newProds.length === 0) return;
    setFavorites(prev => {
      const existingCodes = new Set(prev.map(f => f.code.toUpperCase()));
      const uniqueNew = newProds.filter(p => !existingCodes.has(p.code.toUpperCase()));
      return [...uniqueNew, ...prev];
    });
    showToast(`⭐ Đã thêm ${newProds.length} sản phẩm vào Danh sách hay dùng!`);
  };

  // CRUD actions
  const handleOpenCreate = () => {
    setFormProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (prod) => {
    setFormProduct(prod);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (prod) => {
    setDeleteProductItem(prod);
  };

  const handleConfirmDelete = async () => {
    if (!deleteProductItem) return;
    setIsDeleting(true);
    try {
      await productApi.deleteProduct(deleteProductItem.id);
      showToast(`Đã xóa sản phẩm ${deleteProductItem.code}`);
      setDeleteProductItem(null);
      loadProducts();
      loadStats();
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa sản phẩm', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleProductSaved = (savedProduct) => {
    showToast(formProduct ? 'Đã cập nhật sản phẩm thành công!' : 'Đã thêm sản phẩm mới!');

    if (savedProduct) {
      // 1. Immediately update products state in memory
      setProducts(prev => prev.map(p => {
        if (p.id === savedProduct.id || (p.code && p.code.toUpperCase() === savedProduct.code.toUpperCase())) {
          return { ...p, ...savedProduct };
        }
        return p;
      }));

      // 2. Immediately update favorites in memory & localStorage
      setFavorites(prev => prev.map(f => {
        if (f.id === savedProduct.id || (f.code && f.code.toUpperCase() === savedProduct.code.toUpperCase())) {
          return {
            ...f,
            ...savedProduct,
            image_url: savedProduct.image_url
          };
        }
        return f;
      }));

      // 3. Update detailProduct if currently viewing it
      setDetailProduct(prev => {
        if (!prev) return null;
        if (prev.id === savedProduct.id || (prev.code && prev.code.toUpperCase() === savedProduct.code.toUpperCase())) {
          return { ...prev, ...savedProduct };
        }
        return prev;
      });

      // 4. If image filter was set to 'no image' and product now has image, reset filter so it's not hidden
      if (imageFilter === false && savedProduct.image_url) {
        setImageFilter(null);
      }
    }

    // 5. Reload products & stats from server
    loadProducts();
    loadStats();
  };

  const handleImportCompleted = () => {
    showToast('Import dữ liệu hoàn tất!');
    loadProducts();
    loadStats();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Header with navigation tabs */}
      <Header
        stats={stats}
        onOpenCreate={handleOpenCreate}
        onOpenImport={() => setIsImportOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        favoritesCount={favorites.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'favorites' ? (
          /* TAB: Danh sách hay dùng */
          <FavoritesView
            favorites={favorites}
            onRemoveFavorite={handleRemoveFavorite}
            onClearAllFavorites={handleClearAllFavorites}
            onOpenAddModal={() => setIsAddFavoriteOpen(true)}
            onViewProduct={(p) => setDetailProduct(p)}
            onGoToCatalog={() => setActiveTab('all')}
            onUpdateFavorites={setFavorites}
            showToast={showToast}
          />
        ) : (
          /* TAB: Kho sản phẩm (Catalog) */
          <>
            {/* Sticky Search & Autocomplete Container (Clean & Compact) */}
            <div className="sticky top-16 z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-2 bg-slate-50/95 backdrop-blur-md transition-all shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)]">
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                  onSelectSuggestion={handleSelectSuggestion}
                  selectedBrand={selectedBrand}
                  onBrandChange={handleBrandChange}
                  brands={stats?.top_brands || []}
                  imageFilter={imageFilter}
                  onImageFilterChange={handleImageFilterChange}
                  statusFilter={statusFilter}
                  onStatusFilterChange={handleStatusFilterChange}
                />
              </div>
            </div>

            {/* Product List (Grid / Table) */}
            <ProductList
              products={products}
              total={total}
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
              onPageChange={setPage}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onViewProduct={(p) => setDetailProduct(p)}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteClick}
              isLoading={isLoading}
              onOpenCreate={handleOpenCreate}
              onOpenImport={() => setIsImportOpen(true)}
              hasActiveFilters={Boolean(selectedBrand || statusFilter || imageFilter !== null)}
              activeFiltersSummary={[
                selectedBrand ? `Nhãn: ${selectedBrand}` : null,
                statusFilter ? `Trạng thái: ${statusFilter}` : null,
                imageFilter === true ? 'Có ảnh' : imageFilter === false ? 'Chưa ảnh' : null
              ].filter(Boolean).join(', ')}
              onClearFilters={() => {
                setSelectedBrand('');
                setStatusFilter('');
                setImageFilter(null);
              }}
              favoriteCodeSet={favoriteCodeSet}
              onToggleFavorite={handleToggleFavorite}
              onCopyCode={(code) => showToast(`Đã copy mã: ${code}`)}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        <p>ACACY Merchandising & Retail Image Audit Catalog © 2026</p>
      </footer>

      {/* Modals */}
      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onEdit={(p) => {
          handleEditProduct(p);
        }}
        onDelete={(p) => {
          setDetailProduct(null);
          handleDeleteClick(p);
        }}
        isFavorite={detailProduct ? favoriteCodeSet.has(detailProduct.code) : false}
        onToggleFavorite={handleToggleFavorite}
        onProductUpdated={handleProductSaved}
      />

      <AddFavoriteModal
        isOpen={isAddFavoriteOpen}
        onClose={() => setIsAddFavoriteOpen(false)}
        onAddProduct={handleAddFavoriteCustom}
        onBatchAddProducts={handleBatchAddFavorites}
        existingCodes={favoriteCodeSet}
      />

      <ProductFormModal
        product={formProduct}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={handleProductSaved}
      />

      <ImportExcelModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportCompleted={handleImportCompleted}
      />

      <DeleteConfirmModal
        product={deleteProductItem}
        isOpen={Boolean(deleteProductItem)}
        onClose={() => setDeleteProductItem(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[60] animate-bounce">
          <div
            className={`px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border ${
              toastMessage.type === 'error'
                ? 'bg-rose-600 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
