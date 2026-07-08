import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ProductListHeaderProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onFilterClick: () => void;
  placeholder?: string;
  className?: string;
  showSearch?: boolean;
  children?: React.ReactNode; // For extra actions like Sort By
}

export function ProductListHeader({
  searchQuery,
  setSearchQuery,
  onFilterClick,
  placeholder = "Search products...",
  className,
  showSearch = false,
  children
}: ProductListHeaderProps) {
  return (
    <div className={cn("mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-end", className)}>
      {showSearch && setSearchQuery && (
        <div className="relative w-full md:max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={placeholder}
            value={searchQuery ?? ""}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>
      )}

      <div className="flex items-center gap-3 w-full md:w-auto">
        {children}
        
        <Button 
          variant="outline" // Changed to match "Rounded button" requirement visually usually implies outline or ghost + rounded-full, but user said "Rounded button". Default shadcn button is rounded-md, user context suggests rounded-full from previous files.
          onClick={onFilterClick}
          className="flex items-center gap-2 rounded-full px-6 min-w-[100px]"
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>
    </div>
  );
}
