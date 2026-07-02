import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Search,
  Heart,
  ShoppingCart,
  Filter,
  Star,
  ArrowLeft,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useCart } from "@/contexts/CartContext";
import { useProducts, Product } from "@/contexts/ProductContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilterPanel } from "@/components/filtering/FilterPanel";
import { extractFilterOptions, filterProducts } from "@/utils/filterUtils";
import { ProductListHeader } from "@/components/ProductListHeader";
import { findBrandBySlug, getBrandInitials } from "@/services/brandService";

// Brand aliases for matching
const brandAliases = {
  mi: ["mi", "xiaomi", "redmi"],
  xiaomi: ["mi", "xiaomi", "redmi"],
  redmi: ["mi", "xiaomi", "redmi"],
  samsung: ["samsung"],
  apple: ["apple"],
  oneplus: ["oneplus", "1+"],
  vivo: ["vivo"],
  oppo: ["oppo"],
  realme: ["realme"],
  nothing: ["nothing"],
};

const getSafeProductBrand = (product: Product) => {
  const name = String(product.name || "").trim();
  const brand = String(product.brand || "").trim();
  return (brand || name.split(/\s+/)[0] || "").toLowerCase();
};

const getProductMinPrice = (product: Product): number => {
  // If minPrice is already set, use it
  if (product.minPrice !== undefined && product.minPrice > 0) {
    return product.minPrice;
  }
  
  // Try to extract from color variants
  if (product.colorVariants && product.colorVariants.length > 0) {
    const prices: number[] = [];
    product.colorVariants.forEach((color) => {
      if (color.storageVariants && color.storageVariants.length > 0) {
        color.storageVariants.forEach((storage) => {
          const price = Number(storage.price ?? storage.sellingPrice ?? 0);
          if (price > 0) prices.push(price);
        });
      }
    });
    if (prices.length > 0) {
      return Math.min(...prices);
    }
  }
  
  // Fallback to product.price
  return Number(product.price) || 0;
};

function BrandPage() {
  const { brandName } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products, loading, filters, setFilters, clearFilters } =
    useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [savedBrandName, setSavedBrandName] = useState("");
  const [savedBrandLogo, setSavedBrandLogo] = useState("");
  const [logoBroken, setLogoBroken] = useState(false);

  const normalizedBrandName = brandName?.toLowerCase() || "";
  const brandDisplayName =
    savedBrandName || (brandName?.charAt(0).toUpperCase() + brandName?.slice(1)) || "";
  const displayLogo = savedBrandLogo;

  // Brand aliases for matching
  const aliases = useMemo(
    () =>
      brandAliases[normalizedBrandName as keyof typeof brandAliases] || [
        normalizedBrandName,
      ],
    [normalizedBrandName],
  );

  // Initialize filters based on URL brand, but allow changes
  useEffect(() => {
    setLogoBroken(false);
  }, [normalizedBrandName, displayLogo]);

  useEffect(() => {
    const loadBrand = async () => {
      if (!normalizedBrandName) return;
      try {
        const brand = await findBrandBySlug(normalizedBrandName);
        setSavedBrandName(brand?.name || "");
        setSavedBrandLogo(brand?.image || "");
      } catch (error) {
        console.error("Failed to load brand logo:", error);
      }
    };

    loadBrand();
    window.addEventListener("mc_brand_update", loadBrand);
    window.addEventListener("storage", loadBrand);
    return () => {
      window.removeEventListener("mc_brand_update", loadBrand);
      window.removeEventListener("storage", loadBrand);
    };
  }, [normalizedBrandName]);

  useEffect(() => {
    if (products.length > 0 && normalizedBrandName) {
      // Find all actual brand names in the products that match our aliases
      const matchingBrands = Array.from(
        new Set(
          products
            .map((p) => getSafeProductBrand(p))
            .filter(
              (brand) =>
                Boolean(brand) &&
                aliases.some(
                  (alias) => brand.toLowerCase() === alias.toLowerCase(),
                ) || brand.toLowerCase().startsWith(normalizedBrandName),
            ),
        ),
      );

      const brandsToSelect =
        matchingBrands.length > 0 ? matchingBrands : [brandDisplayName];

      // Set global filters
      setFilters((prev) => ({
        // Reset all other filters
        price: [],
        category: [],
        launchYear: [],
        screenSize: [],
        os: [],
        ram: [],
        cores: [],
        internalMemory: [],
        connectivity: [],
        discount: [],
        brands: brandsToSelect,
      }));
    } else if (!normalizedBrandName) {
      clearFilters();
    }
  }, [
    normalizedBrandName,
    products.length,
    aliases,
    brandDisplayName,
    setFilters,
  ]);

  const brandBaseProducts = useMemo(() => {
    if (!normalizedBrandName) return products;

    return products.filter((p) => {
      const brandValue = getSafeProductBrand(p);
      return (
        aliases.some((alias) => brandValue === alias.toLowerCase()) ||
        brandValue.startsWith(normalizedBrandName)
      );
    });
  }, [aliases, normalizedBrandName, products]);

  // Extract options from BRAND-scoped products (no mixed products in this view)
  const filterOptions = useMemo(
    () => extractFilterOptions(brandBaseProducts),
    [brandBaseProducts],
  );

  // Apply filters to BRAND-scoped products (brand is enforced by URL)
  const filteredProducts = useMemo(() => {
    // Ignore any manual brand selection while on /brand/:brandName
    const { brands, ...filtersWithoutBrands } = filters;
    let result = filterProducts(brandBaseProducts, {
      ...filtersWithoutBrands,
      brands: [],
    });

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((product) =>
        [
          product.name,
          product.brand,
          product.category,
          product.colorName,
          product.storageOption,
          ...(product.colorVariants || []).map((color) =>
            [
              color.name,
              color.hex,
              color.dotImage,
              ...(color.storageVariants || []).map((storage) =>
                [storage.storage, storage.price, storage.originalPrice].join(" "),
              ),
            ].join(" "),
          ),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query),
      );
    }

    return result;
  }, [brandBaseProducts, filters, searchQuery]);

  // Show all generated variant products (do not group by family)
  const flatProducts = useMemo(() => filteredProducts, [filteredProducts]);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary">
        <Header />
        <main className="pt-32 md:pt-40 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading products...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Check if brandName is provided
  if (!brandName) {
    return (
      <div className="min-h-screen bg-secondary">
        <Header />
        <main className="pt-32 md:pt-40 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold text-foreground mb-4">
                Brand not found
              </h1>
              <p className="text-muted-foreground mb-6">
                The brand you're looking for doesn't exist.
              </p>
              <Button onClick={() => navigate("/mobiles-accessories")}>
                Browse All Brands
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <Header />

      <main className="pt-32 md:pt-40 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="hover:text-primary transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            {filters.brands.length === 0 ? (
              <span className="text-foreground">Products</span>
            ) : (
              <>
                <Link
                  to="/mobiles-accessories"
                  className="hover:text-primary transition-colors"
                >
                  Brands
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground">
                  {filters.brands.length === 1
                    ? filters.brands[0]
                    : "Selected Brands"}
                </span>
              </>
            )}
          </motion.div>

          {/* Brand/Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            {filters.brands.length === 1 && displayLogo && !logoBroken ? (
                <img
                  src={displayLogo}
                  alt={`${filters.brands[0]} logo`}
                  onError={(e) => {
                    const target = e.currentTarget;
                    setLogoBroken(true);
                  }}
                  className="w-16 h-16 object-contain bg-white rounded-xl p-2"
                />
              ) : filters.brands.length === 1 ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white p-2 text-lg font-bold text-primary">
                  {getBrandInitials(filters.brands[0])}
                </div>
              ) : null}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {filters.brands.length === 0
                  ? "All Products"
                  : filters.brands.length === 1
                    ? `${filters.brands[0]} Products`
                    : "Selected Brand Products"}
              </h1>
              <p className="text-muted-foreground">
                {flatProducts.length} products available
              </p>
            </div>
          </motion.div>

          {/* Filter Toolbar */}
          <ProductListHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onFilterClick={() => setIsFilterOpen(true)}
            placeholder={`Search ${brandDisplayName} products...`}
          />

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {flatProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="h-full"
              >
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/product/${String(product.category).toLowerCase() === "mobile" ? "new" : "accessory"}/${product.id}`,
                    )
                  }
                  className="w-full h-full flex flex-col bg-white rounded-2xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300 overflow-hidden group text-left"
                >
                  {/* Image Area */}
                  <div className="relative w-full bg-white overflow-hidden shrink-0" style={{ paddingBottom: "75%" }}>
                    <div className="absolute inset-0 flex items-center justify-center p-5">
                      {product.discount && product.originalPrice && product.originalPrice > getProductMinPrice(product) && (
                        <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          -{Math.round(product.discount)}%
                        </div>
                      )}
                      {product.rating && (
                        <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur text-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          {product.rating}
                        </div>
                      )}
                      <img
                        src={product.image || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop"}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1 border-t border-gray-100">
                    <h3 className="text-xs font-bold text-gray-800 mb-2 line-clamp-2 leading-snug uppercase tracking-wide flex-1">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      <span className="text-base font-black text-primary">
                        ₹{getProductMinPrice(product).toLocaleString("en-IN")}
                      </span>
                      {product.discount && product.originalPrice && product.originalPrice > getProductMinPrice(product) && (
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{Math.round(product.originalPrice).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>

          {/* No Results */}
          {flatProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No products found for this brand
              </h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters, or browse other brands.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    clearFilters();
                    navigate("/all-products");
                  }}
                  variant="outline"
                >
                  Clear All Filters
                </Button>
                <Button
                  onClick={() => {
                    setSearchQuery("");
                    clearFilters();
                    navigate("/mobiles-accessories");
                  }}
                >
                  Browse All Products
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />

      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
        options={filterOptions}
        clearFilters={clearFilters}
      />
    </div>
  );
}

// Export with ErrorBoundary wrapping
const BrandPageWithErrorBoundary = () => (
  <ErrorBoundary>
    <BrandPage />
  </ErrorBoundary>
);

export default BrandPageWithErrorBoundary;
