import { useEffect, useRef, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchPublicResources } from "@/lib/publicResources";

// Type definition for Brand
interface Brand {
  name?: string;
  slug?: string;
  logo?: string | null;
}

// Sample brand data (can be replaced with API data)
const brands: Brand[] = [
  {
    name: "Apple",
    slug: "apple",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
  },
  {
    name: "Samsung",
    slug: "samsung",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg",
  },
  {
    name: "Xiaomi",
    slug: "xiaomi",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg",
  },
  {
    name: "OnePlus",
    slug: "oneplus",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/48/OnePlus_logo.svg",
  },
  {
    name: "Realme",
    slug: "realme",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Realme_logo.svg",
  },
  {
    name: "Vivo",
    slug: "vivo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Vivo_logo_2019.svg",
  },
  {
    name: "Oppo",
    slug: "oppo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/8a/OPPO_LOGO_2019.svg",
  },
  {
    name: "Motorola",
    slug: "motorola",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/16/Motorola_Icon_Logo.svg",
  },
  {
    name: "Google",
    slug: "google",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
  },
  {
    name: "Nothing",
    slug: "nothing",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/6c/Nothing_logo.svg",
  },
];

// Validation function: Check if a brand is valid
// A brand is valid ONLY if it has a non-empty name OR has a logo
const isValidBrand = (brand: Brand | null | undefined): boolean => {
  if (!brand) return false;

  const hasValidName =
    typeof brand.name === "string" && brand.name.trim().length > 0;
  const hasValidSlug =
    typeof brand.slug === "string" && brand.slug.trim().length > 0;
  const hasValidLogo =
    typeof brand.logo === "string" && brand.logo.trim().length > 0;

  // card is valid if it has at least a logo or some text (name or slug)
  return hasValidLogo || hasValidName || hasValidSlug;
};

// Sanitization function: Filter and clean brands array
// - Remove null/undefined values
// - Remove duplicates based on slug
// - Remove invalid entries
// - Trim whitespace from strings
const sanitizeBrands = (brands: Brand[]): Brand[] => {
  const seen = new Set<string>();

  return brands
    .filter((brand): brand is Brand => isValidBrand(brand))
    .filter((brand) => {
      // Create a unique key based on slug or name
      const key = (brand.slug || brand.name || "").toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((brand) => ({
      ...brand,
      name: brand.name?.trim(),
      slug: brand.slug?.trim(),
      logo: brand.logo?.trim() || null,
    }));
};

const mergeBrands = (defaults: Brand[], saved: Brand[]) => {
  const merged = new Map<string, Brand>();

  defaults.forEach((brand) => {
    const key = (brand.slug || brand.name || "").toLowerCase().trim();
    if (key) merged.set(key, brand);
  });

  saved.forEach((brand) => {
    const key = (brand.slug || brand.name || "").toLowerCase().trim();
    if (!key) return;
    merged.set(key, { ...merged.get(key), ...brand });
  });

  return Array.from(merged.values());
};

export function BrandCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [savedBrands, setSavedBrands] = useState<Brand[]>([]);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const resources = await fetchPublicResources("brand");
        setSavedBrands(
          resources.map((brand) => ({
            name: String(brand.data?.name || brand.title || ""),
            slug: String(brand.data?.slug || brand.data?.name || brand.title || "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, ""),
            logo: String(brand.data?.logo || brand.data?.image || ""),
          })),
        );
      } catch (error) {
        console.error("Failed to load brands:", error);
      }
    };

    loadBrands();
    window.addEventListener("mc_brand_update", loadBrands);
    window.addEventListener("storage", loadBrands);

    return () => {
      window.removeEventListener("mc_brand_update", loadBrands);
      window.removeEventListener("storage", loadBrands);
    };
  }, []);

  // Filter and sanitize brands - memoized to prevent recalculation on each render
  const validBrands = useMemo(
    () => sanitizeBrands(mergeBrands(brands, savedBrands)),
    [savedBrands],
  );

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleBrandClick = (slug: string) => {
    navigate(`/brand/${slug}`);
  };

  return (
    <section className="py-2 px-4 relative group/carousel">
      <div className="relative flex items-center">
        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-gray-50 text-gray-800 p-2 rounded-full shadow-lg border border-gray-100 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center pointer-events-auto"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Scroll Container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth w-full py-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {validBrands.length > 0 ? (
            validBrands.map((brand) => (
              <div
                key={brand.slug || brand.name}
                onClick={() => brand.slug && handleBrandClick(brand.slug)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && brand.slug) {
                    handleBrandClick(brand.slug);
                  }
                }}
                role="button"
                tabIndex={0}
                className="flex-shrink-0 w-[120px] sm:w-[140px] h-[80px] sm:h-[90px] bg-white rounded-xl flex flex-col items-center justify-center p-4 shadow-sm hover:shadow-lg border border-gray-100 transition-all duration-300 group cursor-pointer"
              >
                {brand.logo ? (
                  <>
                    <img
                      src={brand.logo}
                      alt={brand.name || brand.slug}
                      className="max-h-12 max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300 mb-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.classList.remove("hidden");
                      }}
                    />
                    <span className="text-xs font-medium text-gray-600 text-center">
                      {brand.name}
                    </span>
                  </>
                ) : (
                  <span className="font-semibold text-gray-700 text-sm text-center">
                    {brand.name || brand.slug}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="flex-shrink-0 w-full h-[60px] sm:h-[70px] flex items-center justify-center text-gray-400 text-sm">
              Brands will appear here
            </div>
          )}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-gray-50 text-gray-800 p-2 rounded-full shadow-lg border border-gray-100 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center pointer-events-auto"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
