import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { getBrandInitials, loadBrands, type BrandViewModel } from "@/services/brandService";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function BrandCarousel() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<BrandViewModel[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const refresh = async () => {
      try { setBrands(await loadBrands()); }
      catch (error) { console.error("Failed to load brands:", error); setBrands([]); }
    };
    refresh();
    window.addEventListener("mc_brand_update", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("mc_brand_update", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const visibleBrands = useMemo(() => brands.filter((b) => b.name || b.slug), [brands]);
  const shownBrands = showAll ? visibleBrands : visibleBrands.slice(0, 8);

  if (visibleBrands.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
        Brands will appear here
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-3">
        {shownBrands.map((brand, index) => (
          <motion.button
            key={brand.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.04 }}
            type="button"
            onClick={() => brand.enabled && brand.slug && navigate(`/brand/${brand.slug}`)}
            disabled={!brand.enabled}
            className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col items-center p-3 ${
              brand.enabled
                ? "border-border hover:border-primary hover:shadow-elevated cursor-pointer group"
                : "border-border/50 opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="w-full h-14 flex items-center justify-center mb-2 overflow-hidden">
              {brand.image ? (
                <img
                  src={brand.image}
                  alt={brand.name || brand.slug}
                  className="max-h-12 max-w-full object-contain group-hover:scale-105 transition-transform"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : (
                <span className="text-xl font-bold text-primary group-hover:text-primary/80 transition-colors">
                  {getBrandInitials(brand.name || brand.slug)}
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-foreground text-center line-clamp-1">
              {brand.name || brand.slug}
            </p>
          </motion.button>
        ))}
      </div>
      {!showAll && visibleBrands.length > 8 && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="rounded-full px-8 border-primary text-primary hover:bg-primary hover:text-white transition-all"
            onClick={() => setShowAll(true)}
          >
            View more <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
