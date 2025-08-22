import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  Users, 
  Building, 
  Calendar, 
  Map, 
  MessageCircle, 
  BarChart3,
  Target,
  FileText,
  Upload,
  Download,
  Settings,
  HelpCircle,
  X
} from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
  };
  variant?: "default" | "compact" | "card";
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  secondaryAction,
  variant = "default",
  className
}: EmptyStateProps) {
  const content = (
    <div className={cn("text-center", className)}>
      {Icon && (
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{description}</p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {action && (
          <Button onClick={action.onClick} className="w-full sm:w-auto">
            {action.icon && <action.icon className="h-4 w-4 mr-2" />}
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick} className="w-full sm:w-auto">
            {secondaryAction.icon && <secondaryAction.icon className="h-4 w-4 mr-2" />}
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );

  if (variant === "card") {
    return (
      <Card>
        <CardContent className="p-8">
          {content}
        </CardContent>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <div className="py-8">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      {content}
    </div>
  );
}

// Specialized empty state components
export function LeadsEmptyState({ onCreateLead }: { onCreateLead: () => void }) {
  return (
    <EmptyState
      title="No leads yet"
      description="Start building your lead database by adding your first lead. Track prospects, manage relationships, and grow your business."
      icon={Building}
      action={{
        label: "Add First Lead",
        onClick: onCreateLead,
        icon: Plus
      }}
      secondaryAction={{
        label: "Import from CSV",
        onClick: () => window.location.href = '/settings?tab=data',
        icon: Upload
      }}
    />
  );
}

export function VisitsEmptyState({ onScheduleVisit }: { onScheduleVisit: () => void }) {
  return (
    <EmptyState
      title="No visits scheduled"
      description="Start planning your field visits to connect with leads and prospects. Schedule appointments and track your progress."
      icon={Calendar}
      action={{
        label: "Schedule Visit",
        onClick: onScheduleVisit,
        icon: Plus
      }}
      secondaryAction={{
        label: "View Leads",
        onClick: () => window.location.href = '/leads',
        icon: Building
      }}
    />
  );
}

export function MessagesEmptyState() {
  return (
    <EmptyState
      title="No messages yet"
      description="Start conversations with your team members. Share updates, coordinate visits, and stay connected."
      icon={MessageCircle}
      action={{
        label: "Start Conversation",
        onClick: () => window.location.href = '/messages',
        icon: Plus
      }}
    />
  );
}

export function AnalyticsEmptyState() {
  return (
    <EmptyState
      title="No analytics data"
      description="Analytics will appear here once you start adding leads and visits. Track your performance and insights."
      icon={BarChart3}
      action={{
        label: "Add Leads",
        onClick: () => window.location.href = '/leads',
        icon: Building
      }}
      secondaryAction={{
        label: "Schedule Visits",
        onClick: () => window.location.href = '/visits',
        icon: Calendar
      }}
    />
  );
}

export function TerritoriesEmptyState({ onCreateTerritory }: { onCreateTerritory: () => void }) {
  return (
    <EmptyState
      title="No territories defined"
      description="Create territories to organize your leads geographically and assign salespeople to specific areas."
      icon={Map}
      action={{
        label: "Create Territory",
        onClick: onCreateTerritory,
        icon: Plus
      }}
      secondaryAction={{
        label: "Import Territories",
        onClick: () => window.location.href = '/settings?tab=data',
        icon: Upload
      }}
    />
  );
}

export function PerformanceEmptyState() {
  return (
    <EmptyState
      title="No performance data"
      description="Performance metrics will appear here once you start tracking visits and activities."
      icon={Target}
      action={{
        label: "Schedule Visits",
        onClick: () => window.location.href = '/visits',
        icon: Calendar
      }}
      secondaryAction={{
        label: "View Analytics",
        onClick: () => window.location.href = '/analytics',
        icon: BarChart3
      }}
    />
  );
}

export function SearchEmptyState({ query }: { query: string }) {
  return (
    <EmptyState
      title="No results found"
      description={`No results found for "${query}". Try adjusting your search terms or filters.`}
      icon={Search}
      action={{
        label: "Clear Search",
        onClick: () => window.location.reload(),
        icon: X
      }}
      variant="compact"
    />
  );
}

export function DataEmptyState({ onImport }: { onImport: () => void }) {
  return (
    <EmptyState
      title="No data to export"
      description="Add some leads, visits, or other data before exporting. You can also import data from CSV files."
      icon={FileText}
      action={{
        label: "Import Data",
        onClick: onImport,
        icon: Upload
      }}
      secondaryAction={{
        label: "Add Leads",
        onClick: () => window.location.href = '/leads',
        icon: Plus
      }}
    />
  );
}

export function SettingsEmptyState() {
  return (
    <EmptyState
      title="Settings configured"
      description="Your system settings are properly configured. You can customize themes, notifications, and other preferences here."
      icon={Settings}
      action={{
        label: "View Documentation",
        onClick: () => window.open('/help', '_blank'),
        icon: HelpCircle
      }}
      variant="compact"
    />
  );
}

export function UsersEmptyState({ onInviteUser }: { onInviteUser: () => void }) {
  return (
    <EmptyState
      title="No team members"
      description="Invite your team members to collaborate on leads, visits, and analytics."
      icon={Users}
      action={{
        label: "Invite User",
        onClick: onInviteUser,
        icon: Plus
      }}
      secondaryAction={{
        label: "View Settings",
        onClick: () => window.location.href = '/settings',
        icon: Settings
      }}
    />
  );
}

// Loading empty state
export function LoadingEmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted animate-pulse">
          <div className="h-8 w-8 bg-muted-foreground/20 rounded" />
        </div>
        <div className="h-6 w-48 bg-muted rounded mb-2 mx-auto animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded mx-auto animate-pulse" />
      </div>
    </div>
  );
}

// Error empty state
export function ErrorEmptyState({ 
  title = "Something went wrong",
  description = "There was an error loading the data. Please try again.",
  onRetry 
}: { 
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={HelpCircle}
      action={onRetry ? {
        label: "Try Again",
        onClick: onRetry
      } : undefined}
      secondaryAction={{
        label: "Contact Support",
        onClick: () => window.open('mailto:support@example.com', '_blank')
      }}
    />
  );
} 