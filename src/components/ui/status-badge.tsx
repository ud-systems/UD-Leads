import { Badge } from "@/components/ui/badge";
import { useStatusColors, getStatusColor } from "@/hooks/useStatusColors";

interface StatusBadgeProps {
  status: string | null;
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function StatusBadge({ status, className, variant = "outline" }: StatusBadgeProps) {
  const { data: statusColors = [] } = useStatusColors();
  
  const statusColor = getStatusColor(statusColors, status);

  return (
    <Badge
      variant={variant}
      className={className}
      style={{
        backgroundColor: statusColor.background_color,
        color: statusColor.text_color,
        borderColor: statusColor.color_code,
      }}
    >
      {status || 'No Status'}
    </Badge>
  );
}
