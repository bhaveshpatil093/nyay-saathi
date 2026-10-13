import React from 'react';

export interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  layout?: 'horizontal' | 'vertical';
}

export const Logo: React.FC<LogoProps> = ({
  size = 48,
  withWordmark = false,
  className = '',
  layout = 'horizontal',
}) => {
  const icon = (
    <svg
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-label="Nyay Saathi Logo"
    >
      {/* Rounded square background */}
      <rect x="0" y="0" width="1024" height="1024" rx="180" ry="180" fill="#0B2545" />

      {/* Shield path */}
      <path
        d="M512 130 L765 222 V410 C765 515 655 585 512 648 C369 585 259 515 259 410 V222 Z"
        fill="#13315C"
        stroke="#FF9933"
        strokeWidth="14"
      />

      {/* White strokes (scales of justice) */}
      <line x1="512" y1="235" x2="512" y2="500" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" />
      <line x1="400" y1="290" x2="624" y2="290" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" />
      <line x1="400" y1="290" x2="352" y2="385" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" />
      <line x1="400" y1="290" x2="448" y2="385" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" />
      <line x1="624" y1="290" x2="576" y2="385" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" />
      <line x1="624" y1="290" x2="672" y2="385" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" />
      <line x1="440" y1="505" x2="584" y2="505" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" />

      {/* Saffron circle at fulcrum */}
      <circle cx="512" cy="225" r="16" fill="#FF9933" />

      {/* Saffron scale pans */}
      <path d="M340 385 H460 A60 48 0 0 1 340 385 Z" fill="#FF9933" />
      <path d="M564 385 H684 A60 48 0 0 1 564 385 Z" fill="#FF9933" />
    </svg>
  );

  if (!withWordmark) {
    return <div className={`inline-flex items-center justify-center ${className}`}>{icon}</div>;
  }

  return (
    <div
      className={`inline-flex ${
        layout === 'vertical' ? 'flex-col items-center text-center gap-2' : 'flex-row items-center gap-3'
      } ${className}`}
    >
      {icon}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-bold text-white tracking-normal text-lg">NYAY</span>
          <span className="font-bold text-saffron tracking-widest text-lg">SAATHI</span>
        </div>
        <div className="h-[2.5px] w-full bg-india-green rounded-full mt-1" />
        <span className="text-[10px] tracking-wider text-muted font-medium uppercase mt-0.5">
          Procedure • Evidence • Justice
        </span>
      </div>
    </div>
  );
};
