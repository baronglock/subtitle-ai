import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const Logo: React.FC<LogoProps> = ({ className = "", size = "md" }) => {
  const sizes = {
    sm: { text: "text-xl", icon: "w-6 h-6" },
    md: { text: "text-2xl", icon: "w-8 h-8" },
    lg: { text: "text-4xl", icon: "w-12 h-12" },
  };

  const { text, icon } = sizes[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Minimalist icon - abstract waves representing subtitles/sound */}
      <svg
        className={`${icon} text-blue-500`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 12C3 12 5 8 12 8C19 8 21 12 21 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M3 16C3 16 5 12 12 12C19 12 21 16 21 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M3 20C3 20 5 16 12 16C19 16 21 20 21 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>
      <span className={`${text} font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent`}>
        SubtleAI
      </span>
    </div>
  );
};

export default Logo;