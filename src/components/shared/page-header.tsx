import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  iconColor = "text-primary",
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4 mb-6", className)}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="rounded-lg border border-border bg-card p-2 shrink-0">
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground truncate">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
