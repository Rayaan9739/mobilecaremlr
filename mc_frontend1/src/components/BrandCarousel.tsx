import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPublicResources } from "@/lib/publicResources";

// Type definition for Brand
interface Brand {
  name?: string;
  slug?: string;
  logo?: string | null;
}

const defaultBrandLogos: Record<string, string> = {
  apple: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
  samsung: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg",
  xiaomi: "https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg",
  mi: "https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg",
  redmi: "https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg",
  oneplus: "https://upload.wikimedia.org/wikipedia/commons/4/48/OnePlus_logo.svg",
  realme: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Realme_logo.svg",
  vivo: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Vivo_logo_2019.svg",
  oppo: "https://upload.wikimedia.org/wikipedia/commons/8/8a/OPPO_LOGO_2019.svg",
  motorola: "https://upload.wikimedia.org/wikipedia/commons/1/16/Motorola_Icon_Logo.svg",
  google: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
  nothing: "https://upload.wikimedia.org/wikipedia/commons/6/6c/Nothing_logo.svg",
};

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

const resolveBrandLogo = (brand: Brand) => {
  const slug = (brand.slug || brand.name || "").toLowerCase().trim();
  return (
    brand.logo?.trim() ||
    defaultBrandLogos[slug] ||
    defaultBrandLogos[slug.replace(/^mi$/, "xiaomi")] ||
    null
  );
};

export function BrandCarousel() {
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
    () =>
      sanitizeBrands(
        mergeBrands(brands, savedBrands).map((brand) => ({
          ...brand,
          logo: resolveBrandLogo(brand),
        })),
      ),
    [savedBrands],
  );

  const handleBrandClick = (slug: string) => {
    navigate(`/brand/${slug}`);
  };

  return (
    <section className="py-4 px-4">
      {validBrands.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {validBrands.map((brand) => (
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
              className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col items-center p-4 h-full"
            >
              {/* Logo Container */}
              <div className="w-full h-24 flex items-center justify-center mb-3 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors overflow-hidden">
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.name || brand.slug}
                    className="max-h-20 max-w-20 object-contain"
                    style={{
                      filter: "grayscale(100%)",
                      transition: "filter 300ms ease-in-out",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLImageElement).style.filter = "grayscale(0%)";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLImageElement).style.filter = "grayscale(100%)";
                    }}
                    onError={(e) => {
                      const target = e.currentTarget;
                      const slug = (brand.slug || brand.name || "").toLowerCase().trim();
                      const fallback =
                        defaultBrandLogos[slug] ||
                        defaultBrandLogos[slug.replace(/^mi$/, "xiaomi")] ||
                        "";
                      if (fallback && target.src !== fallback) {
                        target.src = fallback;
                        return;
                      }
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector("[data-brand-fallback='true']")) {
                        const fallbackText = document.createElement("span");
                        fallbackText.dataset.brandFallback = "true";
                        fallbackText.className = "text-2xl font-bold text-primary";
                        fallbackText.textContent = String(brand.name || brand.slug || "?")
                          .slice(0, 2)
                          .toUpperCase();
                        parent.appendChild(fallbackText);
                      }
                    }}
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {String(brand.name || brand.slug || "?")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                )}
              </div>

              {/* Brand Name */}
              <h3 className="font-semibold text-sm text-center text-gray-700 line-clamp-2">
                {brand.name || brand.slug}
              </h3>
            </div>
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
