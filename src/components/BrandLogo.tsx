import React from 'react';

interface BrandLogoProps {
  size?: number;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ size = 44 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="云桥 CloudLink"
    >
      <rect x="2.5" y="2.5" width="59" height="59" rx="18" fill="url(#bg)" />
      <path
        d="M12 37C16.4 30 21.8 26.5 28.2 26.5C33.1 26.5 36.8 28.6 41 32.2C45.5 36 49.1 38 52 38"
        stroke="#FFFDF7"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M19.5 41.5C23.8 45.5 28 47.5 32 47.5C37.1 47.5 40.8 44.4 44.7 39"
        stroke="#E9F8E3"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M25.2 18.2C31.4 14.7 38.2 15.4 43.3 20.2C45.2 22 46.7 24.4 47.7 27.3C44.9 27.1 42.5 26.4 40.4 25.2C34.7 22.1 31.3 24 28.5 27.5C27.2 25.3 26.1 22.2 25.2 18.2Z"
        fill="#D6F4C7"
      />
      <circle cx="18.8" cy="22.6" r="2.5" fill="#FFF2CB" />
      <rect x="2.5" y="2.5" width="59" height="59" rx="18" stroke="url(#ring)" strokeWidth="1" />
      <defs>
        <linearGradient id="bg" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6E9E70" />
          <stop offset="1" stopColor="#9CC08A" />
        </linearGradient>
        <linearGradient id="ring" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.6" />
          <stop offset="1" stopColor="#DDEECE" stopOpacity="0.35" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default BrandLogo;

