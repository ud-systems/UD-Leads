
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  color?: string;
  trend?: "up" | "down" | "stable";
  badge?: React.ReactNode;
  onClick?: () => void;
  clickable?: boolean;
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  iconBg, 
  color,
  trend,
  badge,
  onClick,
  clickable = false
}: StatsCardProps) {
  return (
    <Card 
      className={cn(
        clickable && "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
        clickable && onClick && "hover:bg-muted/50"
      )}
      onClick={clickable ? onClick : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg bg-gradient-primary ${iconBg}`}>
          <Icon className="h-4 w-4 text-primary-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {badge && badge}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
