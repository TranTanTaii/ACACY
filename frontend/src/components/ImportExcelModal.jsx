import React, { useState, useEffect } from 'react';
import { X, Upload, FileSpreadsheet, Check, CheckSquare, Square, AlertCircle, RefreshCw, Layers, Image as ImageIcon } from 'lucide-react';
import { productApi } from '../api/productApi';

export default function ImportExcelModal({ isOpen, onClose, onImportCompleted }) {
  const [workspaceFiles, setWorkspaceFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null); // { name, path, isLocal }
  const [previewData, setPreviewData] = useState(null); // { filename, file_path, sheets }
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [updateExisting, setUpdateExisting] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch workspace files when modal opens
  useEffect(() => {
    if (isOpen) {
      loadWorkspaceFiles();
      setPreviewData(null);
      setSelectedFile(null);
      setImportResult(null);
      setErrorMessage('');
    }
  }, [isOpen]);

  const loadWorkspaceFiles = async () => {
    try {
      const files = await productApi.getWorkspaceFiles();
      setWorkspaceFiles(files);
    } catch (err) {
      console.error('Error fetching workspace files:', err);
    }
  };

  if (!isOpen) return null;

  // Handle click on workspace shortcut file
  const handleSelectWorkspaceFile = async (file) => {
    setIsLoading(true);
    setErrorMessage('');
    setSelectedFile({ name: file.name, path: file.path, isLocal: true });
    try {
      const preview = await productApi.previewLocalFile(file.path);
      setPreviewData(preview);
      // default select all sheets that have products
      setSelectedSheets(preview.sheets.map((s) => s.name));
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi khi đọc file Excel');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle upload of external file
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage('');
    setSelectedFile({ name: file.name, isLocal: false });

    try {
      const preview = await productApi.uploadAndPreview(file);
      setPreviewData(preview);
      setSelectedSheets(preview.sheets.map((s) => s.name));
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi khi upload và phân tích file Excel');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSheet = (sheetName) => {
    if (selectedSheets.includes(sheetName)) {
      setSelectedSheets(selectedSheets.filter((s) => s !== sheetName));
    } else {
      setSelectedSheets([...selectedSheets, sheetName]);
    }
  };

  const selectAllSheets = () => {
    if (previewData && previewData.sheets) {
      setSelectedSheets(previewData.sheets.map((s) => s.name));
    }
  };

  const deselectAllSheets = () => {
    setSelectedSheets([]);
  };

  const handleStartImport = async () => {
    if (!previewData || selectedSheets.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 sheet để import');
      return;
    }

    setIsImporting(true);
    setErrorMessage('');
    setImportResult(null);

    try {
      const result = await productApi.executeImport({
        file_path: previewData.file_path,
        selected_sheets: selectedSheets,
        update_existing: updateExisting
      });
      setImportResult(result);
      onImportCompleted();
    } catch (err) {
      setErrorMessage(err.message || 'Lỗi trong quá trình import dữ liệu');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Import Dữ Liệu Từ File Excel</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Import Result Screen */}
          {importResult ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-emerald-900">Import hoàn tất thành công!</h3>
                <p className="text-xs text-emerald-700 mt-1 font-mono">{importResult.filename}</p>

                <div className="grid grid-cols-3 gap-2 mt-4 text-xs font-semibold">
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                    <span className="text-slate-500 block text-[11px]">Thêm mới</span>
                    <span className="text-base font-bold text-emerald-600">
                      +{importResult.total_inserted.toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                    <span className="text-slate-500 block text-[11px]">Cập nhật</span>
                    <span className="text-base font-bold text-blue-600">
                      {importResult.total_updated.toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
                    <span className="text-slate-500 block text-[11px]">Ảnh trích xuất</span>
                    <span className="text-base font-bold text-purple-600">
                      {importResult.total_images_extracted.toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sheet detail list */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-50 px-3.5 py-2 font-semibold text-slate-700 border-b border-slate-200">
                  Chi tiết từng Sheet đã xử lý ({importResult.sheets?.length})
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {importResult.sheets?.map((s, idx) => (
                    <div key={idx} className="px-3.5 py-2 flex items-center justify-between">
                      <span className="font-medium text-slate-800">{s.sheet}</span>
                      <div className="flex items-center gap-3 text-slate-500">
                        <span>{s.rows_found} dòng</span>
                        {s.images_extracted > 0 && (
                          <span className="text-purple-600 font-medium">
                            {s.images_extracted} ảnh
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Select File (Workspace shortcuts or Upload) */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-2">
                  1. Chọn file Excel để nhập dữ liệu
                </label>

                {/* Workspace quick files */}
                {workspaceFiles.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[11px] text-slate-500 block mb-1.5 font-medium">
                      Các file Excel có sẵn trong thư mục làm việc:
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {workspaceFiles.map((f) => (
                        <div
                          key={f.name}
                          onClick={() => handleSelectWorkspaceFile(f)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            selectedFile?.name === f.name
                              ? 'bg-blue-50/80 border-blue-500 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <div className="truncate">
                              <span className="text-xs font-semibold text-slate-900 block truncate">
                                {f.name}
                              </span>
                              <span className="text-[11px] text-slate-400">Dung lượng: {f.size_mb} MB</span>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-blue-600 px-2 py-1 rounded bg-blue-100/60 flex-shrink-0">
                            {selectedFile?.name === f.name ? 'Đang chọn' : 'Chọn file'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload other file button */}
                <div className="relative">
                  <input
                    type="file"
                    id="excel-upload-input"
                    accept=".xlsx, .xlsm"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="excel-upload-input"
                    className="w-full border border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-3 flex items-center justify-center gap-2 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/30 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Hoặc tải lên file .xlsx khác từ máy tính của bạn</span>
                  </label>
                </div>
              </div>

              {/* Loading indicator */}
              {isLoading && (
                <div className="py-6 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-xs font-medium">Đang phân tích cấu trúc file Excel & hình ảnh...</span>
                </div>
              )}

              {/* Step 2: Sheet Selector (if preview available) */}
              {previewData && !isLoading && (
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block">
                        2. Chọn Sheet cần import ({selectedSheets.length}/{previewData.sheets.length})
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Hệ thống tự động trích xuất mã sản phẩm và ảnh mẫu tương ứng
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={selectAllSheets}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Chọn hết
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={deselectAllSheets}
                        className="text-slate-500 hover:underline"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  {/* Sheets List */}
                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl p-2 divide-y divide-slate-100 bg-slate-50/50">
                    {previewData.sheets.map((sheet) => {
                      const isSelected = selectedSheets.includes(sheet.name);
                      return (
                        <div
                          key={sheet.name}
                          onClick={() => toggleSheet(sheet.name)}
                          className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 text-blue-900 font-medium' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                            )}
                            <span className="text-xs">{sheet.name}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            {sheet.has_images ? (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                                <ImageIcon className="w-3 h-3 text-emerald-600" /> {sheet.image_count} ảnh
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Chưa có ảnh</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Update Existing Checkbox */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="update-existing"
                      checked={updateExisting}
                      onChange={(e) => setUpdateExisting(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <label htmlFor="update-existing" className="text-xs text-slate-700 cursor-pointer">
                      Cập nhật thông tin và bổ sung hình ảnh nếu mã sản phẩm đã có trong hệ thống
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50 flex-shrink-0">
          {importResult ? (
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              Hoàn tất & Đóng
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isImporting}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleStartImport}
                disabled={!previewData || selectedSheets.length === 0 || isImporting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-lg transition-colors shadow-sm"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang bóc tách dữ liệu & hình ảnh...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Bắt đầu Import ({selectedSheets.length} sheet)</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
