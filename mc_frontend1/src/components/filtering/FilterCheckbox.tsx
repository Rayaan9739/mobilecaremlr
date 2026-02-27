import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface FilterCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  count?: number;
}

export function FilterCheckbox({ id, label, checked, onCheckedChange, count }: FilterCheckboxProps) {
  return (
    <div className="flex items-center space-x-2 py-1">
      <Checkbox 
        id={id} 
        checked={checked} 
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <Label 
        htmlFor={id} 
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
      >
        {label}
      </Label>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  );
}
