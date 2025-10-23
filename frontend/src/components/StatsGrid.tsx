import React from "react";
import {
  Briefcase,
  DollarSign,
  Zap,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Calendar,
  Users,
  Code,
  Star,
  Clock,
  Layers,
  LucideIcon,
} from "lucide-react";
import { StatItem } from "@/lib/statsParser";

interface StatsGridProps {
  stats: StatItem[];
  className?: string;
}

// Icon mapping for dynamic icon rendering
const iconMap: Record<string, LucideIcon> = {
  Briefcase,
  DollarSign,
  Zap,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Calendar,
  Users,
  Code,
  Star,
  Clock,
  Layers,
};

const getTrendColor = (trend?: "up" | "down" | "neutral") => {
  switch (trend) {
    case "up":
      return "text-green-600";
    case "down":
      return "text-red-600";
    default:
      return "text-muted-foreground";
  }
};

const getTrendIcon = (trend?: "up" | "down" | "neutral") => {
  switch (trend) {
    case "up":
      return "↗";
    case "down":
      return "↘";
    default:
      return null;
  }
};

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  className = "",
}) => {
  if (!stats || stats.length === 0) {
    return (
      <div className="flex items-center justify-center h-12 text-sm text-muted-foreground">
        No statistics available
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {stats.map((stat, index) => {
        const IconComponent = stat.icon ? iconMap[stat.icon] : null;

        return (
          <div
            key={`${stat.label}-${index}`}
            className="flex items-center gap-2 px-3 py-2 bg-muted/20 rounded border text-sm"
          >
            {IconComponent && (
              <IconComponent className="w-3 h-3 text-primary flex-shrink-0" />
            )}
            <span className="text-muted-foreground font-medium">
              {stat.label}:
            </span>
            <span className="font-semibold text-foreground">{stat.value}</span>
            {stat.trend && (
              <span className={`text-xs ${getTrendColor(stat.trend)}`}>
                {getTrendIcon(stat.trend)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StatsGrid;
