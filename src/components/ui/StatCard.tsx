
import { Card } from "./card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import * as React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon: Icon, description, trend, className }: StatCardProps) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
          {title}
        </h3>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground">
            {trend && (
              <span className={cn(
                "font-medium mr-1",
                trend.positive ? "text-emerald-500" : "text-rose-500"
              )}>
                {trend.positive ? "+" : ""}{trend.value}%
              </span>
            )}
            {description}
          </p>
        )}
      </div>
    </Card>
  );
}
