import React from "react";
export function Avatar({ children, className = '' }) {
  return (
    <div
      className={`w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center ${className}`}
    >
      {children}
    </div>
  );
}

export const AvatarImage = (props) => <img alt="" {...props} />;
export const AvatarFallback = ({ children }) => (
  <span className="text-xs text-gray-700">{children}</span>
);
