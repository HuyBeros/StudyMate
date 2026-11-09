import { useState } from 'react';
import { avatarInitials } from '../lib/studyMetrics';
import { avatarSrc } from '../services/api';

export default function Avatar({ src, name = 'Người dùng', className = '' }) {
  const [failedSource, setFailedSource] = useState(null);
  return (
    <span role="img" aria-label={`Ảnh đại diện của ${name}`} className={`avatar relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 font-bold ${className}`}>
      <span aria-hidden="true">{avatarInitials(name)}</span>
      {src && failedSource !== src && <img src={avatarSrc(src)} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setFailedSource(src)} />}
    </span>
  );
}
