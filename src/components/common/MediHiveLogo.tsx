import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
}

export const MediHiveLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textColor = 'text-white',
}) => {
  const sizeMap = {
    sm: { icon: 'w-6 h-6', text: 'text-lg' },
    md: { icon: 'w-8 h-8', text: 'text-xl' },
    lg: { icon: 'w-10 h-10', text: 'text-2xl' },
    xl: { icon: 'w-14 h-14', text: 'text-3xl' },
  };

  return (
    <div className={`flex items-center gap-2.5 font-bold select-none ${className}`}>
      <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size].icon}`}>
        {/* Hexagonal Hive + Medical Cross / Stethoscope emblem */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon
            points="50,4 92,27 92,73 50,96 8,73 8,27"
            className="fill-medihive-500/20 stroke-medihive-400"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <polygon
            points="50,15 82,33 82,67 50,85 18,67 18,33"
            className="fill-medihive-600"
            strokeLinejoin="round"
          />
          {/* Medical Cross / Plus */}
          <path
            d="M44 32 H56 V44 H68 V56 H56 V68 H44 V56 H32 V44 H44 Z"
            fill="#ffffff"
            className="drop-shadow"
          />
          {/* Small leaf/hive accent */}
          <circle cx="50" cy="50" r="4" fill="#38bdf8" />
        </svg>
      </div>

      {showText && (
        <span className={`tracking-tight font-extrabold ${sizeMap[size].text} ${textColor}`}>
          Medi<span className="text-sky-400">Hive</span>
        </span>
      )}
    </div>
  );
};

