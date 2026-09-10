"use client";

import { cn } from "@/shared/utils/cn";

const variants = {
  primary: "bg-black text-white hover:bg-brand-500 hover:text-black border-2 border-black",
  secondary: "bg-white text-black border-2 border-black hover:bg-brand-500/20",
  outline: "border-2 border-black text-black dark:text-white hover:bg-black hover:text-white",
  ghost: "text-black dark:text-white hover:bg-brand-500/20 border-2 border-transparent hover:border-black",
  danger: "bg-red-600 text-white border-2 border-black hover:bg-red-700",
  success: "bg-brand-500 text-black border-2 border-black hover:bg-brand-400",
};

const sizes = {
  sm: "h-8 px-3 text-[10px] font-black uppercase tracking-widest rounded-none",
  md: "h-10 px-5 text-[11px] font-black uppercase tracking-widest rounded-none",
  lg: "h-12 px-8 text-xs font-black uppercase tracking-widest rounded-none",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  disabled = false,
  loading = false,
  fullWidth = false,
  className,
  ...props
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:shadow-none",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span className="material-symbols-outlined text-[18px]">{iconRight}</span>
      )}
    </button>
  );
}
