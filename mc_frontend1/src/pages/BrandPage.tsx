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

export default function BrandPage() {
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
            .map((p) => p.brand || p.name.split(" ")[0])
            .filter(
              (brand) =>
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
      const brandValue = (p.brand || p.name.split(" ")[0] || "").toLowerCase();
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
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-2">
            {flatProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() =>
                  navigate(
                    `/product/${String(product.category).toLowerCase() === "mobile" ? "new" : "accessory"}/${product.id}`,
                  )
                }
                className="cursor-pointer group h-full"
              >
                <Card className="border-border hover:border-primary/50 transition-all duration-300 hover:shadow-elevated h-[220px] sm:h-[240px] flex flex-col w-full overflow-hidden">
                  <CardContent className="p-0 flex flex-col h-full">
                    <div className="relative overflow-hidden bg-secondary rounded-t-sm sm:rounded-t-xl h-[120px] sm:h-[130px]">
                      {product.rating && (
                        <div className="absolute top-0.5 left-0.5 sm:top-3 sm:left-3 z-30 bg-black/60 backdrop-blur-sm text-white text-[6px] sm:text-xs font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                          <Star className="w-1.5 h-1.5 sm:w-3 sm:h-3 fill-yellow-400 text-yellow-400" />
                          {product.rating}
                        </div>
                      )}

                      <img
                        src={product.image || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop"}
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-foreground text-[8px] sm:text-sm line-clamp-2 mb-1 min-h-[20px] sm:min-h-0">
                          {product.name}
                        </h3>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-2">
                        {product.discount &&
                          product.originalPrice &&
                          product.originalPrice > product.minPrice && (
                            <span className="text-muted-foreground text-[6px] sm:text-xs line-through">
                              ?
                              {Math.round(product.originalPrice).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          )}
                        <span className="text-foreground font-black text-[9px] sm:text-sm">
                          ?{product.minPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
