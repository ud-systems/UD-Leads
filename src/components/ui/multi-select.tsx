import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckSquare, 
  Square, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Settings,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectProps<T> {
  items: T[];
  selectedItems: T[];
  onSelectionChange: (items: T[]) => void;
  onBulkEdit?: (items: T[], updates: any) => Promise<void>;
  onBulkDelete?: (items: T[]) => Promise<void>;
  getItemId: (item: T) => string;
  getItemName: (item: T) => string;
  getItemDescription?: (item: T) => string;
  renderItem?: (item: T, isSelected: boolean, onToggle: () => void) => React.ReactNode;
  editFields?: {
    name: string;
    label: string;
    type: 'text' | 'select' | 'textarea';
    options?: { value: string; label: string }[];
    placeholder?: string;
  }[];
  className?: string;
}

export function MultiSelect<T>({
  items,
  selectedItems,
  onSelectionChange,
  onBulkEdit,
  onBulkDelete,
  getItemId,
  getItemName,
  getItemDescription,
  renderItem,
  editFields = [],
  className
}: MultiSelectProps<T>) {
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [bulkEditData, setBulkEditData] = useState<Record<string, any>>({});
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const handleSelectAll = () => {
    if (isSelectAll) {
      onSelectionChange([]);
      setIsSelectAll(false);
    } else {
      onSelectionChange([...items]);
      setIsSelectAll(true);
    }
  };

  const handleItemToggle = (item: T) => {
    const itemId = getItemId(item);
    const isSelected = selectedItems.some(selected => getItemId(selected) === itemId);
    
    if (isSelected) {
      onSelectionChange(selectedItems.filter(selected => getItemId(selected) !== itemId));
    } else {
      onSelectionChange([...selectedItems, item]);
    }
  };

  const handleBulkEdit = async () => {
    if (onBulkEdit && selectedItems.length > 0) {
      try {
        await onBulkEdit(selectedItems, bulkEditData);
        setIsBulkEditOpen(false);
        setBulkEditData({});
        onSelectionChange([]);
      } catch (error) {
        console.error('Bulk edit failed:', error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (onBulkDelete && selectedItems.length > 0) {
      try {
        await onBulkDelete(selectedItems);
        setIsBulkDeleteOpen(false);
        onSelectionChange([]);
      } catch (error) {
        console.error('Bulk delete failed:', error);
      }
    }
  };

  const defaultRenderItem = (item: T, isSelected: boolean, onToggle: () => void) => (
    <div
      key={getItemId(item)}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
        isSelected 
          ? "bg-primary/10 border-primary/20" 
          : "bg-background border-border hover:bg-muted/50"
      )}
      onClick={onToggle}
    >
      <Checkbox
        checked={isSelected}
        onChange={onToggle}
        className="flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{getItemName(item)}</div>
        {getItemDescription && (
          <div className="text-sm text-muted-foreground truncate">
            {getItemDescription(item)}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Selection Controls */}
      {items.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex items-center gap-2"
            >
              {isSelectAll ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              {isSelectAll ? 'Deselect All' : 'Select All'}
            </Button>
            
            {selectedItems.length > 0 && (
              <Badge variant="secondary">
                {selectedItems.length} selected
              </Badge>
            )}
          </div>

          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              {onBulkEdit && (
                <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Bulk Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Bulk Edit {selectedItems.length} Items</DialogTitle>
                      <DialogDescription>
                        Update the selected items with new values. Leave fields empty to keep current values.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {editFields.map((field) => (
                        <div key={field.name} className="space-y-2">
                          <Label htmlFor={field.name}>{field.label}</Label>
                          {field.type === 'select' ? (
                            <Select
                              value={bulkEditData[field.name] || ''}
                              onValueChange={(value) => 
                                setBulkEditData(prev => ({ ...prev, [field.name]: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.type === 'textarea' ? (
                            <Textarea
                              id={field.name}
                              placeholder={field.placeholder}
                              value={bulkEditData[field.name] || ''}
                              onChange={(e) => 
                                setBulkEditData(prev => ({ ...prev, [field.name]: e.target.value }))
                              }
                            />
                          ) : (
                            <Input
                              id={field.name}
                              type="text"
                              placeholder={field.placeholder}
                              value={bulkEditData[field.name] || ''}
                              onChange={(e) => 
                                setBulkEditData(prev => ({ ...prev, [field.name]: e.target.value }))
                              }
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsBulkEditOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleBulkEdit}>
                        Update {selectedItems.length} Items
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {onBulkDelete && (
                <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Bulk Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Confirm Bulk Delete
                      </DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete {selectedItems.length} items? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Items to be deleted:</p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {selectedItems.slice(0, 5).map((item) => (
                          <div key={getItemId(item)} className="text-sm">
                            • {getItemName(item)}
                          </div>
                        ))}
                        {selectedItems.length > 5 && (
                          <div className="text-sm text-muted-foreground">
                            ... and {selectedItems.length - 5} more
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setIsBulkDeleteOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleBulkDelete}>
                        Delete {selectedItems.length} Items
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </div>
      )}

      {/* Items List */}
      <div className="space-y-2">
        {items.map((item) => {
          const isSelected = selectedItems.some(selected => getItemId(selected) === getItemId(item));
          return renderItem 
            ? renderItem(item, isSelected, () => handleItemToggle(item))
            : defaultRenderItem(item, isSelected, () => handleItemToggle(item));
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No items available
        </div>
      )}
    </div>
  );
} 