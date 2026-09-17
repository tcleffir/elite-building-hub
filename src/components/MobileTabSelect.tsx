import { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TabOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface MobileTabSelectProps {
  tabs: TabOption[];
  value: string;
  onValueChange: (value: string) => void;
  children?: ReactNode;
}

export function MobileTabSelect({ tabs, value, onValueChange, children }: MobileTabSelectProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return <>{children}</>;
  }

  const activeTab = tabs.find(t => t.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between h-11 text-sm font-medium gap-2">
          <span className="flex items-center gap-2">
            {activeTab?.icon}
            {activeTab?.label || "Selecionar"}
          </span>
          <ChevronDown size={16} className="text-muted-foreground shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
        {tabs.map(tab => (
          <DropdownMenuItem
            key={tab.value}
            onClick={() => onValueChange(tab.value)}
            className={`cursor-pointer gap-2 ${tab.value === value ? "bg-muted font-semibold" : ""}`}
          >
            {tab.icon}
            {tab.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
