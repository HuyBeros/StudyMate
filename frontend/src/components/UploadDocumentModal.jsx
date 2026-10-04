import React, { useState, useRef } from 'react';
import { 
  X, UploadCloud, FileText, FileCode2, File, CheckCircle2, AlertCircle, Loader2, Sparkles, ArrowRight
} from 'lucide-react';
import { uploadDocumentApi } from '../services/api';

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'pptx'];

export default function UploadDocumentModal({ 
  isOpen, 
  onClose, 
  subjectId, 
  subjectName = '', 
  onUploadSuccess 
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const getFileExtension = (filename) => {
    return (filename || '').split('.').pop().toLowerCase();
  };

  const validateAndSetFile = (file) => {
    setError('');
    setSuccess('');
    if (!file) return;

    const ext = getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Định dạng .${ext.toUpperCase()} không được hỗ trợ. Vui lòng chọn tệp PDF, DOCX hoặc PPTX.`);
      setSelectedFile(null);
      return;
    }

    // Check size <= 30MB
    if (file.size > 30 * 1024 * 1024) {
      setError('Kích thước tệp vượt quá giới hạn 30MB. Vui lòng chọn tệp nhỏ hơn.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn một tệp tài liệu trước khi tải lên.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const res = await uploadDocumentApi(subjectId, selectedFile);
      if (res && res.success) {
        setSuccess(`Tải lên thành công: ${selectedFile.name}`);
        if (onUploadSuccess) {
          onUploadSuccess(res.data);
        }
        setTimeout(() => {
          handleClose();
        }, 1200);
      } else {
        setError(res?.message || 'Tải tài liệu lên thất bại. Vui lòng thử lại!');
      }
    } catch (err) {
      console.error('[UploadDocumentModal] Upload error:', err);
      setError(err.response?.data?.message || err.message || 'Lỗi kết nối máy chủ khi tải lên.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) return;
    setSelectedFile(null);
    setError('');
    setSuccess('');
    onClose();
  };

  const renderFileIcon = (filename) => {
    const ext = getFileExtension(filename);
    if (ext === 'pdf') return <FileText className="w-8 h-8 text-red-500" />;
    if (ext === 'docx') return <FileText className="w-8 h-8 text-blue-500" />;
    if (ext === 'pptx') return <FileCode2 className="w-8 h-8 text-orange-500" />;
    return <File className="w-8 h-8 text-slate-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#111C32] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Be_Vietnam_Pro'] font-bold text-lg text-slate-900 dark:text-white">
                Tải lên tài liệu học tập
              </h3>
              {subjectName && (
                <p className="text-xs text-slate-400 font-medium">Môn: {subjectName}</p>
              )}
            </div>
          </div>
          <button 
            onClick={handleClose}
            disabled={uploading}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-4 flex items-center gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl text-red-700 dark:text-red-300 text-xs font-semibold animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        {/* Drag & Drop Area */}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          onClick={(e) => { e.target.value = null; }}
          accept=".pdf,.docx,.pptx"
          className="hidden"
        />

        {!selectedFile ? (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              dragActive 
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 scale-[1.01]' 
                : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-900/30'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                Kéo thả tài liệu vào đây hoặc <span className="text-blue-600 dark:text-blue-400 underline decoration-2 underline-offset-2">chọn từ máy tính</span>
              </p>
              <p className="text-xs text-slate-400">
                Hỗ trợ định dạng: <strong className="text-slate-600 dark:text-slate-300">PDF, DOCX, PPTX</strong> (Tối đa 30MB)
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI tự động trích xuất nội dung văn bản ngay sau khi tải lên</span>
            </div>
          </div>
        ) : (
          /* Selected File Card */
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-xs flex-shrink-0">
                  {renderFileIcon(selectedFile.name)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatFileSize(selectedFile.size)} • <span className="uppercase">{getFileExtension(selectedFile.name)}</span>
                  </p>
                </div>
              </div>

              {!uploading && (
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-500 transition-colors ml-2 cursor-pointer flex-shrink-0"
                  title="Chọn tệp khác"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {uploading && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-300">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang gửi tệp & trích xuất văn bản AI...
                  </span>
                  <span>Đang xử lý</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-900/60 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 dark:bg-blue-400 h-full rounded-full animate-pulse w-full"></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tải lên...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Tải lên ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
