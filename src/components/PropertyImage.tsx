import { Building2 } from 'lucide-react';
import { useState } from 'react';

interface PropertyImageProps {
  src?: string;
  alt: string;
  className?: string;
}

export function PropertyImage({ src, alt, className = '' }: PropertyImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0B1528] via-[#13223D] to-[#1E3358] text-slate-300 p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Building2 className="w-8 h-8 text-[#C9A254] mb-2" strokeWidth={1.5} />
        <span className="text-xs font-medium tracking-wide text-slate-200 line-clamp-2 max-w-[200px]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
