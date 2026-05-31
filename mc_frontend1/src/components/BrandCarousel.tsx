import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBrandInitials, loadBrands, type BrandViewModel } from "@/services/brandService";

export function BrandCarousel() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<BrandViewModel[]>([]);

  useEffect(() => {
    const refresh = async () => {
      try {
        setBrands(await loadBrands());
      } catch (error) {
        console.error("Failed to load brands:", error);
        setBrands([]);
      }
    };

    refresh();
    window.addEventListener("mc_brand_update", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("mc_brand_update", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const visibleBrands = useMemo(
    () => brands.filter((brand) => brand.enabled && (brand.name || brand.slug)),
    [brands],
  );

  return (
    <section className="py-4 px-4">
      {visibleBrands.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {visibleBrands.map((brand) => (
            <button
              key={brand.id}
              type="button"
              onClick={() => brand.slug && navigate(`/brand/${brand.slug}`)}
              className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col items-center p-4 h-full"
            >
              <div className="w-full h-24 flex items-center justify-center mb-3 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors overflow-hidden">
                {brand.image ? (
                  <img
                    src={brand.image}
                    alt={brand.name || brand.slug}
                    className="max-h-20 max-w-20 object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {getBrandInitials(brand.name || brand.slug)}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-sm text-center text-gray-700 line-clamp-2">
                {brand.name || brand.slug}
              </h3>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
          Brands will appear here
        </div>
      )}
    </section>
  );
}
