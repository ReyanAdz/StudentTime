import React from "react";
export function Card({ children, className = '' }) {
  return <div className={`bg-white shadow rounded ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = '' }) {
  return <div className={`border-b px-4 py-2 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`font-semibold text-gray-800 ${className}`}>{children}</h3>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
