
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { LucideIcon } from "lucide-react";
import * as React from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, description, icon: Icon, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6", className)}>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-6 w-6 text-primary" />}
          <h2 className="text-2xl font-bold tracking-tight text-primary-theme">{title}</h2>
        </div>
        {description && <p className="text-muted-foreground text-secondary-theme">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
