import React, { useState, useEffect } from 'react';
import { 
  X, UploadCloud, Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Calendar, Clock, MapPin, User, Save, RefreshCw
} from 'lucide-react';
import { importScheduleImageApi, confirmScheduleImportApi, checkScheduleConflictApi } from '../services/api';

export default function ImportScheduleModal({ isOpen, onClose, subjects = [], onImportSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewSlots, setPreviewSlots] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    setSelectedFile(file);
    setLoading(true);
    setError('');
    setPreviewSlots([]);

    try {
      const res = await importScheduleImageApi(file);
      if (res && res.success) {
        setPreviewSlots(res.data || []);
      } else {
        setError(res?.message || 'Không thể nhận diện hình ảnh này.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ khi xử lý ảnh.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = async (index, field, value) => {
    const updated = [...previewSlots];
    updated[index][field] = value;
    setPreviewSlots(updated);

    // If dayOfWeek, startTime, or endTime changes, re-run conflict check
    if (field === 'dayOfWeek' || field === 'startTime' || field === 'endTime') {
      const slot = updated[index];
      if (slot.dayOfWeek && slot.startTime && slot.endTime) {
        try {
          const checkRes = await checkScheduleConflictApi({
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime.length === 5 ? `${slot.startTime}:00` : slot.startTime,
            endTime: slot.endTime.length === 5 ? `${slot.endTime}:00` : slot.endTime,
            isRecurring: true
          });
          if (checkRes && checkRes.success) {
            updated[index].hasConflict = checkRes.data.hasConflict;
            updated[index].conflictMessage = checkRes.data.hasConflict ? checkRes.data.message : '';
            setPreviewSlots([...updated]);
          }
        } catch (e) {
          console.warn("Conflict check error:", e);
        }
      }
    }
  };

  const handleRemoveRow = (index) => {
    setPreviewSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddRow = () => {
    setPreviewSlots(prev => [
      ...prev,
      {
        subjectName: '',
        classCode: '',
        dayOfWeek: 'THU_2',
        shift: 'SANG',
        startTime: '08:00',
        endTime: '10:30',
        room: '',
        teacherName: '',
        matchedSubjectId: null,
        hasConflict: false,
        conflictMessage: ''
      }
    ]);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    // Prepare slots for upload (assure times have seconds)
    const formattedSlots = previewSlots.map(s => ({
      ...s,
      startTime: s.startTime && s.startTime.length === 5 ? `${s.startTime}:00` : s.startTime,
      endTime: s.endTime && s.endTime.length === 5 ? `${s.endTime}:00` : s.endTime,
      isRecurring: true,
      isOnline: false
    }));

    try {
      const res = await confirmScheduleImportApi(formattedSlots);
      if (res && res.success) {
        setSuccess('Nhập thời khóa biểu thành công!');
        setTimeout(() => {
          onImportSuccess();
          onClose();
          setSelectedFile(null);
          setPreviewSlots([]);
          setSuccess('');
        }, 1500);
      } else {
        setError(res?.message || 'Lưu thời khóa biểu thất bại.');
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ khi lưu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111C32] rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white">
                Nhập thời khóa biểu bằng AI
              </h3>
              <p className="text-xs text-slate-400 font-medium">Gemini AI tự động nhận diện thông tin tiết học từ ảnh chụp</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success/Error Alerts */}
        {success && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-2xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Uploader Area */}
        {!selectedFile && !loading && (
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all ${
              dragActive 
                ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 scale-[1.01]' 
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#172136]/50 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
          >
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-['Be_Vietnam_Pro'] font-bold text-slate-900 dark:text-white text-lg">
                  Tải lên ảnh Thời khóa biểu
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Chấp nhận các định dạng PNG, JPG, JPEG. Đảm bảo ảnh rõ ràng, đủ sáng.
                </p>
              </div>
              <div>
                <label className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-['Inter'] font-bold text-sm py-3 px-6 rounded-2xl shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95">
                  <span>Chọn ảnh từ thiết bị</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 2. Loading state */}
        {loading && previewSlots.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <div className="space-y-1">
              <h4 className="font-['Be_Vietnam_Pro'] font-bold text-slate-800 dark:text-white">AI Gemini đang đọc hình ảnh...</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500">Quá trình này có thể mất vài giây để bóc tách chính xác từng môn học.</p>
            </div>
          </div>
        )}

        {/* 3. Preview Slots Table */}
        {previewSlots.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Kết quả nhận diện nháp ({previewSlots.length} lớp học)
              </span>
              <button 
                onClick={handleAddRow}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#172136] hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm dòng</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#172136] text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800/80">
                    <th className="p-3">Tên môn học *</th>
                    <th className="p-3">Mã lớp</th>
                    <th className="p-3">Thứ *</th>
                    <th className="p-3">Ca học</th>
                    <th className="p-3 w-24">Bắt đầu</th>
                    <th className="p-3 w-24">Kết thúc</th>
                    <th className="p-3 w-24">Phòng</th>
                    <th className="p-3">Giảng viên</th>
                    <th className="p-3 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {previewSlots.map((slot, idx) => (
                    <tr 
                      key={idx} 
                      className={`hover:bg-slate-50/50 dark:hover:bg-[#172136]/30 transition-colors ${
                        slot.hasConflict ? 'bg-red-50/40 dark:bg-red-950/20' : ''
                      }`}
                    >
                      {/* Subject Name / Matching selection */}
                      <td className="p-2 min-w-[150px]">
                        <input 
                          type="text" 
                          required
                          value={slot.subjectName || ''}
                          onChange={(e) => handleFieldChange(idx, 'subjectName', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#172136] border border-transparent focus:border-blue-500 rounded-lg p-2 font-semibold outline-none text-slate-800 dark:text-white"
                        />
                        {slot.hasConflict && slot.conflictMessage && (
                          <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold block mt-1">
                            ⚠️ {slot.conflictMessage}
                          </span>
                        )}
                      </td>

                      {/* Class Code */}
                      <td className="p-2 w-24">
                        <input 
                          type="text" 
                          value={slot.classCode || ''}
                          onChange={(e) => handleFieldChange(idx, 'classCode', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#172136] border border-transparent focus:border-blue-500 rounded-lg p-2 outline-none text-slate-800 dark:text-white"
                        />
                      </td>

                      {/* Day of Week */}
                      <td className="p-2 w-28">
                        <select
                          value={slot.dayOfWeek || 'THU_2'}
                          onChange={(e) => handleFieldChange(idx, 'dayOfWeek', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#172136] border border-transparent focus:border-blue-500 rounded-lg p-2 outline-none text-slate-800 dark:text-white"
                        >
                          <option value="THU_2">Thứ 2</option>
                          <option value="THU_3">Thứ 3</option>
                          <option value="THU_4">Thứ 4</option>
                          <option value="THU_5">Thứ 5</option>
                          <option value="THU_6">Thứ 6</option>
                          <option value="THU_7">Thứ 7</option>
                          <option value="CHU_NHAT">Chủ Nhật</option>
                        </select>
                      </td>

                      {/* Shift */}
                      <td className="p-2 w-28">
                        <select
                          value={slot.shift || 'SANG'}
                          onChange={(e) => handleFieldChange(idx, 'shift', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#172136] border border-transparent focus:border-blue-500 rounded-lg p-2 outline-none text-slate-800 dark:text-white"
                        >
                          <option value="SANG">Sáng</option>
                          <option value="CHIEU">Chiều</option>
                          <option value="TOI">Tối</option>
                        </select>
                      </td>

                      {/* Start Time */}
                      <td className="p-2">
                        <input 
                          type="time" 
                          required
                          value={slot.startTime ? slot.startTime.substring(0, 5) : '08:00'}
                          onChange={(e) => handleFieldChange(idx, 'startTime', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#172136] border border-transparent focus:border-blue-500 rounded-lg p-2 outline-none text-slate-800 dark:text-white"
                        />
                      </td>

                      {/* End Time */}
                      <td className="p-2">
                        <input 
                          type="time" 
                          required
                          value={slot.endTime ? slot.endTime.substring(0, 5) : '10:30'}
                          onChange={(e) => handleFieldChange(idx, 'endTime', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#172136] border border-transparent focus:border-blue-500 rounded-lg p-2 outline-none text-slate-800 dark:text-white"
                        />
                      </td>

                      {/* Room */}
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={slot.room || ''}
                          onChange={(e) => handleFieldChange(idx, 'room', e.target.value)}
                          placeholder="Phòng"
                          className="w-full bg-slate-50 dark:bg-[#172136] border border-transparent focus:border-blue-500 rounded-lg p-2 outline-none text-slate-800 dark:text-white"
                        />
                      </td>

                      {/* Teacher Name */}
                      <td className="p-2 min-w-[100px]">
                        <input 
                          type="text" 
                          value={slot.teacherName || ''}
                          onChange={(e) => handleFieldChange(idx, 'teacherName', e.target.value)}
                          placeholder="GV phụ trách"
                          className="w-full bg-slate-50 dark:bg-[#172136] border border-transparent focus:border-blue-500 rounded-lg p-2 outline-none text-slate-800 dark:text-white"
                        />
                      </td>

                      {/* Delete Action */}
                      <td className="p-2 text-center">
                        <button 
                          onClick={() => handleRemoveRow(idx)}
                          className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 flex items-center justify-center mx-auto transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          {selectedFile && !loading && (
            <button 
              onClick={() => { setSelectedFile(null); setPreviewSlots([]); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tải ảnh khác</span>
            </button>
          )}

          <div className="flex gap-3 ml-auto">
            <button 
              onClick={onClose} 
              className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>

            {previewSlots.length > 0 && (
              <button 
                onClick={handleConfirm}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Đang lưu...' : 'Xác nhận nhập'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
