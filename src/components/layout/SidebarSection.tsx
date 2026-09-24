
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown, LucideIcon } from "lucide-react";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link, useLocation } from "react-router-dom";
import * as React from "react";

export interface SidebarSectionProps {
  icon: LucideIcon;
  label: string;
  path?: string;
  subItems?: { label: string; path: string; icon?: any }[];
  collapsed: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  isActive: boolean;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({ 
  icon: Icon, 
  label, 
  path, 
  subItems, 
  collapsed, 
  isOpen, 
  onToggle,
  isActive 
}) => {
  const location = useLocation();

  if (subItems) {
    return (
      <Collapsible
        open={!collapsed && isOpen}
        onOpenChange={onToggle}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 px-2 mb-1 transition-all duration-200",
              collapsed && "justify-center px-0",
              isActive && !isOpen && "bg-primary/10 text-primary",
              isOpen && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
            )}
          >
            <Icon className={cn(
              "h-5 w-5 shrink-0",
              !isOpen && !isActive && "text-zinc-500",
              (isOpen || isActive) && "text-current"
            )} />
            {!collapsed && (
              <>
                <span className={cn(
                  "flex-1 text-left truncate font-bold uppercase text-[11px] tracking-wider",
                  "text-current"
                )}>{label}</span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOpen ? "rotate-180 text-current" : "text-zinc-400"
                )} />
              </>
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 px-4 py-1">
          {!collapsed && subItems.map((subItem) => (
            <Link key={subItem.path} to={subItem.path}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 px-2 h-8 text-xs mb-1",
                  location.pathname === subItem.path 
                    ? "bg-zinc-100 dark:bg-zinc-800 text-primary font-medium" 
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                {subItem.icon && <subItem.icon className={cn(
                  "h-3 w-3 shrink-0",
                  location.pathname === subItem.path ? "text-primary" : "text-zinc-500"
                )} />}
                <span className="truncate">{subItem.label}</span>
              </Button>
            </Link>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Link to={path!}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 px-2 mb-1",
          collapsed && "justify-center px-0",
          isActive && "bg-primary/10 text-primary"
        )}
      >
        <Icon className={cn(
          "h-5 w-5 shrink-0",
          isActive ? "text-primary" : "text-zinc-500"
        )} />
        {!collapsed && <span className="truncate">{label}</span>}
      </Button>
    </Link>
  );
}
