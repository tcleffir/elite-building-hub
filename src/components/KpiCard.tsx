import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: string; positive: boolean };
  className?: string;
  href?: string;
  tooltip?: string;
  onClick?: () => void;
}

const KpiCard = ({ title, value, subtitle, icon, trend, className = "", href, tooltip, onClick }: KpiCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) onClick();
    else if (href) navigate(href);
  };

  const isClickable = !!(href || onClick);

  const card = (
    <div
      className={`bg-card rounded-2xl p-4 md:p-5 premium-shadow animate-fade-in ${isClickable ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all' : ''} ${className}`}
      onClick={isClickable ? handleClick : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-interactive shrink-0">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
            trend.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
      <p className="text-xl md:text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm font-medium text-foreground/80 mt-0.5 truncate">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{subtitle}</p>}
    </div>
  );

  if (tooltip && isClickable) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{card}</TooltipTrigger>
        <TooltipContent><p>{tooltip}</p></TooltipContent>
      </Tooltip>
    );
  }

  return card;
};

export default KpiCard;
