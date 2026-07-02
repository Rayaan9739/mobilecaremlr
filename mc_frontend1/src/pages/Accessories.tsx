import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Search,
  Filter,
  Star,
  Heart,
  ShoppingCart,
  ArrowLeft,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  category?: string;
  image: string;
}

const toCategoryLabel = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function Accessories() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categoryOptions, setCategoryOptions] = useState<
    { value: string; label: string }[]
  >([{ value: "all", label: "All Categories" }]);
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Fetch all products to perform client-side filtering for "Everything except phones"
        // This ensures we catch items categorised as "Cables", "Chargers" etc. not just "Accessories"
        const response = await api<{ products: Product[] }>(
          `/products?limit=1000`,
        );
        const allProducts = response.products || [];

        // Filter out phones strictly with normalization
        const accessoriesOnly = allProducts.filter((p: Product) => {
          const cat = (p.category || "").toUpperCase().replace(/[\s-]+/g, '_');
          return (
            cat !== "MOBILE" &&
            cat !== "USED_PHONE" &&
            cat !== "USED_PHONES"
          );
        });

        const dynamicCategories = Array.from(
          new Set(
            accessoriesOnly
              .map((p) => (p.category || "").toUpperCase())
              .filter((c) => c.trim() !== ""),
          ),
        )
          .sort((a, b) => a.localeCompare(b))
          .map((value) => ({ value, label: toCategoryLabel(value) }));

        setCategoryOptions([{ value: "all", label: "All Categories" }, ...dynamicCategories]);

        // If a specific sub-category is selected in dropdown (e.g. Chargers), filter further
        if (selectedCategory !== "all") {
          setProducts(
            accessoriesOnly.filter(
              (p: Product) =>
                (p.category || "").toLowerCase() ===
                selectedCategory.toLowerCase(),
            ),
          );
        } else {
          setProducts(accessoriesOnly);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesPrice =
        priceRange === "all" ||
        (priceRange === "under-1000" && product.price < 1000) ||
        (priceRange === "1000-3000" &&
          product.price >= 1000 &&
          product.price <= 3000) ||
        (priceRange === "3000-5000" &&
          product.price >= 3000 &&
          product.price <= 5000) ||
        (priceRange === "above-5000" && product.price > 5000);

      return matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return 0; // popular (default order)
    });

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
            className="flex items-center gap-2 text-sm text-muted-foreground mb-8"
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
            <span className="text-foreground">Accessories</span>
          </motion.div>

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Mobile Accessories
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Enhance your mobile experience with our premium collection of
              accessories
            </p>
          </motion.div>

          {/* Quick category selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {categoryOptions.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full border transition-colors whitespace-nowrap 
                    ${selectedCategory === cat.value ? "bg-primary text-white" : "bg-card text-foreground"}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 space-y-4"
          >
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search accessories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
              <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="under-1000">Under ₹1,000</SelectItem>
                  <SelectItem value="1000-3000">₹1,000 - ₹3,000</SelectItem>
                  <SelectItem value="3000-5000">₹3,000 - ₹5,000</SelectItem>
                  <SelectItem value="above-5000">Above ₹5,000</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Customer Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-12">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="bg-card rounded-2xl p-4 animate-pulse"
                >
                  <div className="aspect-square bg-secondary rounded-xl mb-4"></div>
                  <div className="h-4 bg-secondary rounded mb-2"></div>
                  <div className="h-6 bg-secondary rounded mb-3"></div>
                  <div className="h-8 bg-secondary rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No products available at the moment.
              </h3>
              <p className="text-muted-foreground mb-6">
                Check back soon for new accessories!
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setPriceRange("all");
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-12">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/product/accessory/${product.id}`)}
                    className="w-full bg-white rounded-2xl border border-border hover:border-primary hover:shadow-elevated transition-all duration-300 overflow-hidden group text-left"
                  >
                    {/* Image */}
                    <div className="relative aspect-square bg-secondary/20 overflow-hidden">
                      {product.discount && product.originalPrice && product.originalPrice > product.price && (
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
                        src={product.image || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop"}
                        alt={product.name}
                        className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-2 leading-tight">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-primary">
                          ₹{product.price.toLocaleString("en-IN")}
                        </span>
                        {product.discount && product.originalPrice && product.originalPrice > product.price && (
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
          )}

          {/* Featured Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-16"
          >
            <Card className="bg-gradient-to-r from-primary/10 to-accent overflow-hidden">
              <CardContent className="p-8 md:p-12 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Complete Your Mobile Setup
                </h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  From essential chargers to premium audio accessories, find
                  everything you need
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <span className="px-4 py-2 bg-card rounded-full text-sm font-medium text-foreground">
                    ✓ Premium Quality
                  </span>
                  <span className="px-4 py-2 bg-card rounded-full text-sm font-medium text-foreground">
                    ✓ Fast Delivery
                  </span>
                  <span className="px-4 py-2 bg-card rounded-full text-sm font-medium text-foreground">
                    ✓ Warranty Included
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
