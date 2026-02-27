import { useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/23/Xiaomi_logo_%28white%29.svg",
  },
  { name: "Vivo", slug: "vivo", logo: null },
  { name: "Oppo", slug: "oppo", logo: null },
  { name: "Realme", slug: "realme", logo: null },
  {
    name: "OnePlus",
    slug: "oneplus",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/48/OnePlus_logo.svg",
  },
  { name: "Motorola", slug: "motorola", logo: null },
  {
    name: "Lenovo",
    slug: "lenovo",
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/63/Lenovo_logo.svg",
  },
  {
    name: "Asus",
    slug: "asus",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/00/Asus_ROG_logo.svg",
  },
  {
    name: "Huawei",
    slug: "huawei",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Huawei_Logo.svg",
  },
  { name: "Nothing", slug: "nothing", logo: null },
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

export function BrandCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter and sanitize brands - memoized to prevent recalculation on each render
  const validBrands = useMemo(() => sanitizeBrands(brands), []);

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
                className="flex-shrink-0 w-[100px] sm:w-[120px] h-[60px] sm:h-[70px] bg-white rounded-xl flex items-center justify-center p-3 shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 group cursor-pointer"
              >
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.name || brand.slug}
                    className="max-h-full max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (
                        e.target as HTMLImageElement
                      ).nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : (
                  <span className="font-semibold text-gray-600 text-sm">
                    {brand.name || brand.slug}
                  </span>
                )}
                {brand.logo && brand.name && (
                  <span className="hidden group-hover:block absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-1 text-[10px] font-medium text-gray-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {brand.name}
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
