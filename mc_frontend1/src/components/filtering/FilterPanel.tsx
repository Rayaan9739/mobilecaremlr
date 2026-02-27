import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { Button } from "@/components/ui/button";
import { FilterAccordion } from "./FilterAccordion";
import { FilterCheckbox } from "./FilterCheckbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FilterState, FilterOptions } from "@/utils/filterUtils";

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  options: FilterOptions;
  clearFilters: () => void;
}

export function FilterPanel({ isOpen, onClose, filters, setFilters, options, clearFilters }: FilterPanelProps) {
  const navigate = useNavigate();
  const { setHasManualFilters } = useProducts();
  const [openSection, setOpenSection] = useState<string | null>("Price");
  const [isDesktop, setIsDesktop] = useState(window.matchMedia("(min-width: 768px)").matches);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const listener = () => setIsDesktop(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleCheckboxChange = (category: keyof FilterState, value: string, checked: boolean) => {
    setFilters({
      ...filters,
      [category]: checked
        ? [...(filters[category] as string[]), value]
        : (filters[category] as string[]).filter((item) => item !== value),
    });
    
    // Mark as manual filter interaction
    setHasManualFilters(true);
  };

  const handleClearAll = () => {
    clearFilters();
    navigate('/all-products');
    onClose();
  };

  const SidebarContent = (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Filters</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4">
        {/* Price Section */}
        <FilterAccordion 
            title="Price" 
            isOpen={openSection === "Price"} 
            onToggle={() => toggleSection("Price")}
        >
            {/* Unified ranges or specific logic */}
            {["under-10000", "10000-20000", "20000-30000", "30000-50000", "above-50000"].map((range) => (
                <FilterCheckbox
                    key={range}
                    id={`price-${range}`}
                    label={range === "under-10000" ? "Under ₹10,000" :
                           range === "10000-20000" ? "₹10,000 - ₹20,000" :
                           range === "20000-30000" ? "₹20,000 - ₹30,000" : 
                           range === "30000-50000" ? "₹30,000 - ₹50,000" : "Above ₹50,000"}
                    checked={filters.price.includes(range)}
                    onCheckedChange={(c) => handleCheckboxChange("price", range, c)}
                />
            ))}
        </FilterAccordion>

        {/* Brands Section */}
        <FilterAccordion 
            title="Brands" 
            isOpen={openSection === "Brands"} 
            onToggle={() => toggleSection("Brands")}
        >
            {options.brands.map((brand) => (
                <FilterCheckbox
                    key={brand}
                    id={`brand-${brand}`}
                    label={brand}
                    checked={filters.brands.includes(brand)}
                    onCheckedChange={(c) => handleCheckboxChange("brands", brand, c)}
                />
            ))}
        </FilterAccordion>

        {/* Category Section */}
        {options.category.length > 0 && (
             <FilterAccordion 
                title="Category" 
                isOpen={openSection === "Category"} 
                onToggle={() => toggleSection("Category")}
            >
                {options.category.map((c) => (
                    <FilterCheckbox
                        key={c}
                        id={`cat-${c}`}
                        label={c}
                        checked={filters.category.includes(c)}
                        onCheckedChange={(chk) => handleCheckboxChange("category", c, chk)}
                    />
                ))}
            </FilterAccordion>
         )}


        {/* Launch Year */}
        <FilterAccordion 
            title="Launch Year" 
            isOpen={openSection === "Launch Year"} 
            onToggle={() => toggleSection("Launch Year")}
        >
            {options.launchYear.map((y) => (
                <FilterCheckbox
                    key={y}
                    id={`year-${y}`}
                    label={y}
                    checked={filters.launchYear.includes(y)}
                    onCheckedChange={(c) => handleCheckboxChange("launchYear", y, c)}
                />
            ))}
        </FilterAccordion>

         {/* Screen Size */}
        <FilterAccordion 
            title="Screen Size" 
            isOpen={openSection === "Screen Size"} 
            onToggle={() => toggleSection("Screen Size")}
        >
            {options.screenSize.map((s) => (
                <FilterCheckbox
                    key={s}
                    id={`screen-${s}`}
                    label={s}
                    checked={filters.screenSize.includes(s)}
                    onCheckedChange={(c) => handleCheckboxChange("screenSize", s, c)}
                />
            ))}
        </FilterAccordion>

         {/* OS */}
         {options.os.length > 0 && (
             <FilterAccordion 
                title="Operating System" 
                isOpen={openSection === "Operating System"} 
                onToggle={() => toggleSection("Operating System")}
            >
                {options.os.map((os) => (
                    <FilterCheckbox
                        key={os}
                        id={`os-${os}`}
                        label={os}
                        checked={filters.os.includes(os)}
                        onCheckedChange={(c) => handleCheckboxChange("os", os, c)}
                    />
                ))}
            </FilterAccordion>
         )}

         {/* RAM Section */}
         {options.ram.length > 0 && (
             <FilterAccordion 
                title="RAM" 
                isOpen={openSection === "RAM"} 
                onToggle={() => toggleSection("RAM")}
            >
                {options.ram.map((r) => (
                    <FilterCheckbox
                        key={r}
                        id={`ram-${r}`}
                        label={r}
                        checked={filters.ram.includes(r)}
                        onCheckedChange={(c) => handleCheckboxChange("ram", r, c)}
                    />
                ))}
            </FilterAccordion>
         )}

        {/* Number of Cores */}
        {options.cores.length > 0 && (
             <FilterAccordion 
                title="Number of Cores" 
                isOpen={openSection === "Number of Cores"} 
                onToggle={() => toggleSection("Number of Cores")}
            >
                {options.cores.map((c) => (
                    <FilterCheckbox
                        key={c}
                        id={`core-${c}`}
                        label={c}
                        checked={filters.cores.includes(c)}
                        onCheckedChange={(chk) => handleCheckboxChange("cores", c, chk)}
                    />
                ))}
            </FilterAccordion>
         )}

        {/* Internal Memory */}
        {options.internalMemory.length > 0 && (
             <FilterAccordion 
                title="Internal Memory" 
                isOpen={openSection === "Internal Memory"} 
                onToggle={() => toggleSection("Internal Memory")}
            >
                {options.internalMemory.map((s) => (
                    <FilterCheckbox
                        key={s}
                        id={`mem-${s}`}
                        label={s}
                        checked={filters.internalMemory.includes(s)}
                        onCheckedChange={(c) => handleCheckboxChange("internalMemory", s, c)}
                    />
                ))}
            </FilterAccordion>
         )}

        {/* Connectivity */}
        {options.connectivity.length > 0 && (
             <FilterAccordion 
                title="Connectivity" 
                isOpen={openSection === "Connectivity"} 
                onToggle={() => toggleSection("Connectivity")}
            >
                {options.connectivity.map((c) => (
                    <FilterCheckbox
                        key={c}
                        id={`conn-${c}`}
                        label={c}
                        checked={filters.connectivity.includes(c)}
                        onCheckedChange={(chk) => handleCheckboxChange("connectivity", c, chk)}
                    />
                ))}
            </FilterAccordion>
         )}

         {/* Discount */}
         <FilterAccordion 
            title="Discount" 
            isOpen={openSection === "Discount"} 
            onToggle={() => toggleSection("Discount")}
        >
            {options.discount.map((d) => (
                <FilterCheckbox
                    key={d}
                    id={`discount-${d}`}
                    label={d}
                    checked={filters.discount.includes(d)}
                    onCheckedChange={(c) => handleCheckboxChange("discount", d, c)}
                />
            ))}
        </FilterAccordion>

      </ScrollArea>

      <div className="p-4 border-t border-border bg-background">
        <Button 
            variant="outline" 
            className="w-full mb-2" 
            onClick={handleClearAll}
        >
          Clear All Filters
        </Button>
        <Button className="w-full md:hidden" onClick={onClose}>
            View Results
        </Button>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />
          
          {/* Panel */}
          {isDesktop ? (
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-[350px] z-50 shadow-2xl"
            >
                {SidebarContent}
            </motion.div>
          ) : (
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 h-[85vh] z-50 rounded-t-2xl overflow-hidden shadow-2xl"
            >
                {SidebarContent}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
