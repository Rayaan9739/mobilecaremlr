import { useState, useEffect, useMemo } from "react";
import {
  useSearchParams,
  useLocation,
  Link,
  useNavigate,
} from "react-router-dom";
import {
  matchesCategory,
  SPECIAL_CATEGORY_TITLES,
} from "@/utils/categoryUtils";
import { motion } from "framer-motion";
import { ChevronRight, ArrowLeft, Star } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useProducts, Product } from "@/contexts/ProductContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ProductListHeader } from "@/components/ProductListHeader";
import { FilterPanel } from "@/components/filtering/FilterPanel";
import { extractFilterOptions, filterProducts } from "@/utils/filterUtils";
import { groupProductsByName } from "@/utils/productVariants";
import { resolveProductImage, getProductFallbackImage } from "@/utils/productImage";

interface ProductsApiResponse {
  products: Product[];
}

const categoryTitles = {
  MOBILE: "All Phones",
  USED_PHONES: "Used Phones",
  HEADPHONES: "Audio Products",
  SPEAKERS: "Audio Products",
  SMART_WATCH: "Smart Accessories",
  CHARGERS: "Chargers & Adapters",
  STORAGE: "Storage Devices",
  CABLES: "Cables & Connectors",
  CAMERA: "Camera Accessories",
  GAMING: "Gaming Accessories",
  ACCESSORIES: "Accessories",
  all: "All Products",
};

const getBudgetTitle = (minPrice: number, maxPrice: number) => {
  if (maxPrice <= 10000) return "Phones Under ₹10,000";
  if (minPrice === 10000 && maxPrice === 20000)
    return "Phones ₹10,000 - ₹20,000";
  if (minPrice === 20000 && maxPrice === 30000)
    return "Phones ₹20,000 - ₹30,000";
  if (minPrice === 30000 && maxPrice === 50000)
    return "Phones ₹30,000 - ₹50,000";
  if (minPrice === 50000 && maxPrice === 70000)
    return "Phones ₹50,000 - ₹70,000";
  if (minPrice >= 70000) return "Premium Phones Above ₹70,000";
  return "Phones";
};

const normalizeCategoryValue = (value?: string) =>
  value
    ? value
        .toString()
        .trim()
        .toLowerCase()
        .replaceAll(/[\s-]+/g, "_")
    : "";

export default function Products() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("popular");
  // Use global products, filters, search, and context
  const {
    products: globalProducts,
    loading: globalLoading,
    filters,
    setFilters,
    clearFilters,
    searchQuery,
    setSearchQuery,
    activeContext,
    setActiveContext,
    hasManualFilters,
    setHasManualFilters,
  } = useProducts();

  // Local derived products for display (since Products page might do existing API fetch, but now we should prefer global filtering if possible or sync them)
  // Requirement: "No page is allowed to override Clear All Filters"
  // "All pages must call the same clear function"
  // "Page content must be derived ONLY from filter state"

  // So we should rely on 'globalProducts' (which is now 1000 items) and filter CLIENT SIDE.
  // The existing logic fetches from API based on params. We should probably stick to that for *initial* load if we want specific SEO/performance,
  // BUT the requirement says "content must be derived ONLY from filter state".
  // So if we browse /products?minPrice=1000, we should set filters.price and let global filtering happen.

  const category = searchParams.get("category") || "all";
  const specialCategory = searchParams.get("specialCategory");
  const excludeCategoryParam = searchParams.get("excludeCategory") || "";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const urlSearchQuery = searchParams.get("search") || "";
  const minPriceNum = minPrice ? Number.parseInt(minPrice) : null;
  const maxPriceNum = maxPrice ? Number.parseInt(maxPrice) : null;
  const excludedCategories = excludeCategoryParam
    .split(",")
    .map((value) => normalizeCategoryValue(value))
    .filter(Boolean);

  // Use activeContext for page title, but override with "All Products" if manual filters applied
  const pageTitle = urlSearchQuery
    ? `Search results for "${urlSearchQuery}"`
    : hasManualFilters ? "All Products" : activeContext.label;

  // Extract filter options dynamically
  const filterOptions = extractFilterOptions(globalProducts);

  // Set context based on URL params - DO NOT touch filters
  useEffect(() => {
    const isAllProductsRoute = location.pathname === "/all-products";

    // Check for category in URL params (e.g., /products?category=used_phones)
    const urlCategory = searchParams.get("category");

    // Set active context based on URL params
    if (isAllProductsRoute) {
      setActiveContext({ type: "all", label: "All Products" });
      setHasManualFilters(false);
      return;
    }

    // Set active context for category in URL params
    if (urlCategory === "used_phones") {
      setActiveContext({
        type: "specialCategory",
        label: "Used Phones",
        value: "USED_PHONES",
      });
      setHasManualFilters(false);
      return;
    }

    // Set context based on URL params and reset manual filter flag
    if (specialCategory) {
      const label =
        SPECIAL_CATEGORY_TITLES[
          specialCategory as keyof typeof SPECIAL_CATEGORY_TITLES
        ];
      if (label) {
        setActiveContext({
          type: "specialCategory",
          label,
          value: specialCategory,
        });
        setHasManualFilters(false); // Reset on navigation
      }
    } else if (excludedCategories.length > 0) {
      setActiveContext({
        type: "category",
        label: "Accessories",
        value: excludeCategoryParam,
      });
      setHasManualFilters(false); // Reset on navigation
    } else if (
      minPriceNum !== null &&
      maxPriceNum !== null &&
      category === "MOBILE"
    ) {
      const label = getBudgetTitle(minPriceNum, maxPriceNum);
      setActiveContext({
        type: "budget",
        label,
      });
      setHasManualFilters(false); // Reset on navigation
    } else if (category && category !== "all") {
      const label =
        categoryTitles[category as keyof typeof categoryTitles] || category;
      setActiveContext({
        type: "category",
        label,
        value: category,
      });
      setHasManualFilters(false); // Reset on navigation
    } else {
      setActiveContext({ type: "all", label: "All Products" });
      setHasManualFilters(false); // Reset on navigation
    }

    // DO NOT touch filters - let them persist across navigation!
  }, [
    category,
    specialCategory,
    excludeCategoryParam,
    excludedCategories.length,
    minPriceNum,
    maxPriceNum,
    location.pathname,
    searchParams,
    setActiveContext,
    setHasManualFilters,
  ]);

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery, setSearchQuery]);

  // Apply special category filtering first, then global filters
  const filteredProducts = useMemo(() => {
    let baseProducts = globalProducts;

    // Debug: Log first product to see available fields
    if (baseProducts.length > 0) {
      console.log("Sample product fields:", Object.keys(baseProducts[0]));
      console.log("Sample product:", baseProducts[0]);
    }

    // Check if we're on the used-phones route or have category in URL
    const urlCategory = searchParams.get("category");
    const isUsedPhonesRoute = urlCategory === "used_phones";

    // Apply URL category filtering
    if (urlCategory && urlCategory !== "all") {
      const normalizedCategory = urlCategory.toUpperCase();

      if (isUsedPhonesRoute) {
        // Special handling for used phones
        baseProducts = baseProducts.filter((p) => {
          const category = p.category?.toUpperCase();
          return (
            category === "USED_PHONE" ||
            category === "USED-PHONE" ||
            category === "USED_PHONES" ||
            p.category?.toLowerCase() === "used phones" ||
            p.condition?.toLowerCase() === "used"
          );
        });
      } else if (normalizedCategory === "ACCESSORIES") {
        // Accessories: exclude MOBILE and USED_PHONES
        baseProducts = baseProducts.filter((p) => {
          const category = p.category?.toUpperCase();
          return (
            category !== "MOBILE" &&
            category !== "USED_PHONE" &&
            category !== "USED-PHONE" &&
            category !== "USED_PHONES" &&
            p.condition?.toLowerCase() !== "used"
          );
        });
      } else {
        // Regular category matching
        baseProducts = baseProducts.filter((p) => {
          return p.category?.toUpperCase() === normalizedCategory;
        });
      }
    }

    // Apply special category filtering if param exists
    if (specialCategory) {
      baseProducts = baseProducts.filter((p) =>
        matchesCategory(p, specialCategory),
      );
    }

    // Apply used phones route filtering
    if (isUsedPhonesRoute) {
      console.log(
        "Filtering for used phones, total products:",
        baseProducts.length,
      );
      baseProducts = baseProducts.filter((p) => {
        const category = p.category?.toUpperCase();
        return (
          category === "USED_PHONE" ||
          category === "USED-PHONE" ||
          category === "USED_PHONES" ||
          p.category?.toLowerCase() === "used phones" ||
          p.condition?.toLowerCase() === "used"
        );
      });
      console.log("Filtered used phones count:", baseProducts.length);
    }

    if (excludedCategories.length > 0) {
      baseProducts = baseProducts.filter((product) => {
        const productCategory = normalizeCategoryValue(product.category);
        return !excludedCategories.includes(productCategory);
      });
    }

    // Apply URL-based category filtering if exists and isn't 'all'
    if (category && category !== "all" && normalizeCategoryValue(category) !== "accessories") {
      baseProducts = baseProducts.filter((p) => {
        const productCategory = normalizeCategoryValue(p.category);
        const targetCategory = normalizeCategoryValue(category);
        return productCategory === targetCategory;
      });
    }

    // Apply URL-based price filtering if exists
    if (minPriceNum !== null || maxPriceNum !== null) {
      baseProducts = baseProducts.filter((p) => {
        const price = p.price;
        const min = minPriceNum ?? 0;
        const max = maxPriceNum ?? Infinity;
        return price >= min && price <= max;
      });
    }

    // Apply global filters on top
    let result = filterProducts(baseProducts, filters);

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
  }, [
    globalProducts,
    specialCategory,
    excludedCategories,
    filters,
    searchQuery,
  ]);

  const groupedProducts = useMemo(() => {
    const grouped = groupProductsByName(filteredProducts);
    return grouped.sort((a, b) => {
      if (sortBy === "price-low") return a.minPrice - b.minPrice;
      if (sortBy === "price-high") return b.minPrice - a.minPrice;
      return 0;
    });
  }, [filteredProducts, sortBy]);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  };

  return (
    <div className="min-h-screen bg-secondary">
      <Header />

      <main className="pt-48 md:pt-40 pb-16">
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
            <span className="text-foreground">{pageTitle}</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1.5 md:mb-2 leading-tight">
              {pageTitle}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {groupedProducts.length} products available
            </p>
          </motion.div>

          {/* Filters */}
          <ProductListHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onFilterClick={() => setIsFilterOpen(true)}
            placeholder={`Search ${pageTitle.toLowerCase()}...`}
          >
            {/* Sort By Dropdown - Preserved as per user request to keep filters near search, but Sort is a View option */}
            <div className="flex flex-wrap items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </ProductListHeader>

          {globalLoading ? (
            <div className="grid grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-2">
              {Array.from({ length: 8 }, (_, i) => i + 1).map((id) => (
                <Card
                  key={`skeleton-${id}`}
                  className="border-border w-full aspect-square overflow-hidden"
                >
                  <CardContent className="p-0 flex flex-col h-full">
                    <div className="w-full aspect-square bg-secondary rounded-t-xl animate-pulse"></div>
                    <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between">
                      <div className="h-4 bg-secondary rounded mb-1 animate-pulse"></div>
                      <div className="h-3 bg-secondary rounded mb-1 animate-pulse"></div>
                      <div className="h-5 bg-secondary rounded animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-4">
              {groupedProducts.map((product, index) => (
                <motion.div
                  key={product.groupId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="h-full"
                >
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/product/${normalizeCategoryValue(product.category) === "mobile" ? "new" : "accessory"}/${product.groupId}`,
                      )
                    }
                    className="w-full h-full flex flex-col bg-white rounded-lg sm:rounded-2xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300 overflow-hidden group text-left cursor-pointer"
                  >
                    {/* Image Area */}
                    <div className="relative w-full bg-white overflow-hidden shrink-0" style={{ paddingBottom: "75%" }}>
                      <div className="absolute inset-0 flex items-center justify-center p-1.5 sm:p-5">
                        {product.discount && product.originalPrice && product.originalPrice > product.minPrice && (
                          <div className="absolute top-1 right-1 z-30 bg-red-500 text-white text-[8px] sm:text-[10px] font-bold px-1 sm:px-2 py-0.5 rounded-sm sm:rounded-full">
                            -{Math.round(product.discount)}%
                          </div>
                        )}
                        {product.rating ? (
                          <div className="absolute bottom-1 left-1 z-30 bg-white/95 backdrop-blur text-foreground text-[8px] sm:text-[10px] font-bold px-1 sm:px-2 py-0.5 rounded-sm sm:rounded-full flex items-center gap-0.5 shadow-sm border border-neutral-100">
                            <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-amber-400 text-amber-400" />
                            {product.rating}
                          </div>
                        ) : null}
                        <img
                          src={resolveProductImage(product)}
                          alt={product.name}
                          className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.src = getProductFallbackImage();
                          }}
                          loading="eager"
                        />
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-1.5 sm:p-4 flex flex-col flex-1 border-t border-gray-100 justify-between">
                      <h3 className="text-[8.5px] min-[360px]:text-[9.5px] sm:text-xs md:text-sm font-semibold sm:font-bold text-gray-800 mb-1 line-clamp-2 leading-snug uppercase">
                        {product.name}
                      </h3>
                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 flex-wrap">
                          <span className="text-primary font-bold sm:font-black text-[10px] sm:text-base">
                            ₹{product.minPrice.toLocaleString()}
                          </span>
                          {product.discount &&
                            product.originalPrice &&
                            product.originalPrice > product.minPrice && (
                              <span className="text-muted-foreground text-[8px] sm:text-xs line-through">
                                ₹{Math.round(product.originalPrice).toLocaleString("en-IN")}
                              </span>
                            )}
                        </div>
                        {product.colorOptions?.length > 0 && (
                          <span className="text-[8px] sm:text-[10px] text-muted-foreground mt-1 block">
                            {product.colorOptions
                              .slice(0, 3)
                              .map((option: any) =>
                                typeof option === "string"
                                  ? option
                                  : String(option?.name || option?.color || ""),
                              )
                              .filter(Boolean)
                              .join(" • ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* No Results */}
          {groupedProducts.length === 0 && !globalLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No products found
              </h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters.
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
                    setActiveContext({
                      type: "all",
                      label: "Mobiles & Accessories",
                    });
                    setHasManualFilters(false);
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
