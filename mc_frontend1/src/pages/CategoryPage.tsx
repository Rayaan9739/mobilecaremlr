import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useProducts, Product } from "@/contexts/ProductContext";
import { motion } from "framer-motion";
import {
  Search,
  Heart,
  ShoppingCart,
  Filter,
  ArrowLeft,
  Star,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilterPanel } from "@/components/filtering/FilterPanel";
import { extractFilterOptions, filterProducts } from "@/utils/filterUtils";
import { ProductListHeader } from "@/components/ProductListHeader";


export default function CategoryPage() {
  const { categoryName } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const {
    products,
    categories,
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const previousCategoryRef = useRef<string | undefined>(undefined);

  const normalizeCategoryValue = (value?: string) =>
    value
      ? value
          .toString()
          .trim()
          .toLowerCase()
          .replace(/[\s-]+/g, "_")
      : "";

  // Helper to get display name from dynamic categories
  const getCategoryDisplayName = (catCode: string) => {
    // Safety check: ensure categories is an array
    if (!Array.isArray(categories)) return catCode;

    const found = categories.find(
      (c) => c.name === catCode || c.name === catCode?.toUpperCase(),
    );
    return found ? found.displayName : catCode;
  };

  // Set context when navigating to category
  useEffect(() => {
    if (!categoryName) return;

    const normalizedParam = normalizeCategoryValue(categoryName);

    const foundCategory = categories.find(
      (c) => normalizeCategoryValue(c.name) === normalizedParam,
    );

    const foundProductCategory = products.find(
      (p) => normalizeCategoryValue(p.category) === normalizedParam,
    );

    const resolvedCategory =
      foundCategory?.name || foundProductCategory?.category || categoryName;

    // Only update context when the resolved category changes
    if (resolvedCategory !== previousCategoryRef.current) {
      previousCategoryRef.current = resolvedCategory;

      // Set active context (navigation context only)
      const displayName = getCategoryDisplayName(resolvedCategory);
      setActiveContext({
        type: "category",
        label: displayName,
        value: resolvedCategory,
      });

      // Enforce the category filter based on the URL
      // This ensures "New Phones" -> /category/mobile shows ONLY mobile products
      setFilters((prev) => ({
        ...prev,
        category: [resolvedCategory],
      }));

      // Reset manual filter flag on navigation
      setHasManualFilters(false);
    }
  }, [
    categoryName,
    categories,
    products,
    setActiveContext,
    setHasManualFilters,
    setFilters,
  ]);

  // Apply filters to CATEGORY-scoped products (category is enforced by URL)
  const filteredProducts = useMemo(() => {
    const enforcedCategoryValue =
      activeContext?.type === "category" ? activeContext.value : undefined;

    const categoryBaseProducts = enforcedCategoryValue
      ? products.filter(
          (p) =>
            normalizeCategoryValue(p.category) ===
            normalizeCategoryValue(enforcedCategoryValue),
        )
      : products;

    // Ignore any manual category selection while on /category/:categoryName
    const { category, ...filtersWithoutCategory } = filters;
    let result = filterProducts(categoryBaseProducts, {
      ...filtersWithoutCategory,
      category: [],
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
  }, [activeContext, filters, products, searchQuery]);

  // Show all generated variant products (do not group by family)
  const flatProducts = useMemo(() => filteredProducts, [filteredProducts]);

  const filterOptions = useMemo(() => {
    const enforcedCategoryValue =
      activeContext?.type === "category" ? activeContext.value : undefined;

    const categoryBaseProducts = enforcedCategoryValue
      ? products.filter(
          (p) =>
            normalizeCategoryValue(p.category) ===
            normalizeCategoryValue(enforcedCategoryValue),
        )
      : products;

    return extractFilterOptions(categoryBaseProducts);
  }, [activeContext, products]);

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
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {hasManualFilters ? "All Products" : activeContext.label}
            </h1>
            <p className="text-muted-foreground">
              {flatProducts.length} products available
            </p>
          </motion.div>

          {/* New Filter Toolbar */}
          <ProductListHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onFilterClick={() => setIsFilterOpen(true)}
            placeholder={`Search ${activeContext.label.toLowerCase()}...`}
          />

          <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="grid grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-2">
            {flatProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() =>
                  navigate(
                    `/product/${normalizeCategoryValue(product.category) === "mobile" ? "new" : "accessory"}/${product.id}`,
                  )
                }
                className="cursor-pointer group h-full"
              >
                <Card className="border-border hover:border-primary/50 transition-all duration-200 hover:shadow-md h-[220px] sm:h-[240px] flex flex-col w-full overflow-hidden">
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
                              ₹
                              {Math.round(product.originalPrice).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          )}
                        <span className="text-foreground font-black text-[9px] sm:text-sm">
                          ₹{product.minPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          </div>

          {/* No Results */}
          {groupedProducts.length === 0 && (
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
