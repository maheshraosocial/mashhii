import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  href?: string;
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down" | "neutral";
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  href,
  trend,
  className,
}: StatsCardProps) {
  const content = (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 flex flex-col gap-3",
        href && "cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={cn("rounded-md p-1.5 bg-primary/10", iconColor)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl font-semibold text-foreground tabular-nums">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "text-xs font-medium",
              trend.direction === "up" && "text-green-400",
              trend.direction === "down" && "text-red-400",
              trend.direction === "neutral" && "text-muted-foreground"
            )}
          >
            {trend.direction === "up" && "↑"}
            {trend.direction === "down" && "↓"}
            {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href as Route} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
