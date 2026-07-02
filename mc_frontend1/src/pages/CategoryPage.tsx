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
import { resolveProductImage, getProductFallbackImage } from "@/utils/productImage";


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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {flatProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/product/${normalizeCategoryValue(product.category) === "mobile" ? "new" : "accessory"}/${product.id}`,
                    )
                  }
                  className="w-full bg-white rounded-2xl border border-border hover:border-primary hover:shadow-elevated transition-all duration-300 overflow-hidden group text-left"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-secondary/20 overflow-hidden">
                    {product.discount && product.originalPrice && product.originalPrice > product.minPrice && (
                      <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        -{Math.round(product.discount)}%
                      </div>
                    )}
                    {product.rating && (
                      <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur text-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-soft">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        {product.rating}
                      </div>
                    )}
                    <img
                      src={resolveProductImage(product)}
                      alt={product.name}
                      className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = getProductFallbackImage();
                      }}
                      loading="eager"
                    />
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-black text-primary">
                        ₹{product.minPrice.toLocaleString("en-IN")}
                      </span>
                      {product.discount && product.originalPrice && product.originalPrice > product.minPrice && (
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
          </div>

{/* No Results */}
           {flatProducts.length === 0 && (
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
