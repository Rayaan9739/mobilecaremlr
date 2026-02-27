import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BrandDropdownProps {
  brands: string[];
  selectedBrand: string | null;
  onSelectBrand: (brand: string) => void;
  className?: string; // Allow external styling
}

export function BrandDropdown({ brands, selectedBrand, onSelectBrand, className }: BrandDropdownProps) {
  return (
    <Select 
      value={selectedBrand || "all"} 
      onValueChange={(val) => onSelectBrand(val === "all" ? "" : val)}
    >
      <SelectTrigger className={`w-[180px] ${className}`}>
        <SelectValue placeholder="Brand" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Brands</SelectItem>
        {brands.map((brand) => (
          <SelectItem key={brand} value={brand}>
            {brand}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
