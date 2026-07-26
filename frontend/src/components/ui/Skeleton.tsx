import React from "react";

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3 p-4 animate-pulse">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-10 bg-slate-800/50 rounded-lg w-full flex items-center justify-between px-4">
          <div className="h-3 bg-slate-700/60 rounded w-1/6" />
          <div className="h-3 bg-slate-700/60 rounded w-1/4" />
          <div className="h-3 bg-slate-700/60 rounded w-1/6" />
          <div className="h-3 bg-slate-700/60 rounded w-1/8" />
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-4 bg-[#0b132b] border border-slate-800 rounded-xl space-y-3 animate-pulse">
      <div className="h-3 bg-slate-800 rounded w-1/3" />
      <div className="h-6 bg-slate-700 rounded w-1/2" />
    </div>
  );
};

export const DetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-slate-800 rounded w-1/4" />
      <div className="h-32 bg-[#0b132b] border border-slate-800 rounded-2xl p-6" />
      <div className="h-64 bg-[#0b132b] border border-slate-800 rounded-xl p-6" />
    </div>
  );
};
