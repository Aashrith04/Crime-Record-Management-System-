"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export const Breadcrumb: React.FC = () => {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400">
      <Link href="/dashboard" className="hover:text-cyan-400 flex items-center gap-1 transition">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {segments.map((seg, idx) => {
        const url = `/${segments.slice(0, idx + 1).join("/")}`;
        const isLast = idx === segments.length - 1;
        const formatted = seg.replace("-", " ").toUpperCase();

        return (
          <React.Fragment key={url}>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            {isLast ? (
              <span className="font-semibold text-cyan-400 font-mono text-[11px]">{formatted}</span>
            ) : (
              <Link href={url} className="hover:text-slate-200 transition">
                {formatted}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
