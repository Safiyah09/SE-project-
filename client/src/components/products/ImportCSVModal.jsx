import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { importProductsCSV } from '../../services/productServices';

const ImportCSVModal = ({ isModalOpen, closeModal, onSuccess, showToast }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  if (!isModalOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setUploadError(null);
    } else {
      setFile(null);
      setUploadError('Please select a valid CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await importProductsCSV(formData);
      showToast(`Successfully imported ${result.successCount} products. ${result.failedCount > 0 ? `${result.failedCount} failed.` : ''}`, 'success');
      onSuccess();
      closeModal();
      setFile(null);
    } catch (err) {
      console.error('Import error:', err);
      const msg = err.response?.data?.message || 'Failed to upload CSV';
      setUploadError(msg);
      showToast(msg, 'error');
    } finally {
      setIsUploading(false);
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md w-full max-w-md overflow-hidden animate-fade-in">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-50 bg-gray-50/20">
          <h2 className="text-lg font-bold text-[#172b1f]">Import Products (CSV)</h2>
          <button
            onClick={() => {
              closeModal();
              setFile(null);
              setUploadError(null);
            }}
            className="text-[#8a948d] hover:text-[#172b1f] transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {uploadError && (
            <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 p-2.5 rounded-xl font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{uploadError}</p>
            </div>
          )}

          <div className="flex flex-col items-center justify-center w-full">
            <label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-[#8a948d] mb-3" />
                <p className="mb-2 text-sm text-gray-500 font-semibold"><span className="font-bold text-[#2f8f46]">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">CSV files only</p>
              </div>
              <input 
                id="csv-upload" 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </label>
          </div>

          {file && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
              <FileText className="w-5 h-5 text-[#2f8f46]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1a5d2e] truncate">{file.name}</p>
                <p className="text-xs text-[#2f8f46]">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              <button 
                onClick={() => setFile(null)}
                className="text-[#1a5d2e] hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  closeModal();
                  setFile(null);
                  setUploadError(null);
                }}
                disabled={isUploading}
                className="btn-secondary !px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="btn-primary min-w-[100px] disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Upload'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportCSVModal;
