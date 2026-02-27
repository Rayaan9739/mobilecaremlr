import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Search,
  Filter,
  SlidersHorizontal,
  Grid3X3,
  List,
  Heart,
  ShoppingCart,
  ArrowLeft,
  Star,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock product data for accessories
interface AccessoryProduct {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  rating?: number;
}

const mockAccessoryProducts: Record<string, AccessoryProduct[]> = {
  chargers: [
    {
      id: 101,
      name: "Fast Wireless Charger 15W",
      price: 2499,
      originalPrice: 2999,
      discount: 17,
      image:
        "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop",
      rating: 4.5,
    },
    {
      id: 102,
      name: "USB-C Fast Charger 65W",
      price: 1899,
      originalPrice: 2299,
      discount: 17,
      image:
        "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&h=400&fit=crop",
      rating: 4.3,
    },
    {
      id: 103,
      name: "Car Charger Dual Port",
      price: 899,
      originalPrice: 1199,
      discount: 25,
      image:
        "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=400&fit=crop",
      rating: 4.2,
    },
  ],
  cables: [
    {
      id: 201,
      name: "USB-C to Lightning Cable",
      price: 799,
      originalPrice: 999,
      discount: 20,
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
      rating: 4.4,
    },
    {
      id: 202,
      name: "Magnetic Charging Cable",
      price: 1299,
      originalPrice: 1599,
      discount: 19,
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
      rating: 4.1,
    },
  ],
  headphones: [
    {
      id: 301,
      name: "Wireless Noise Cancelling",
      price: 8999,
      originalPrice: 12999,
      discount: 31,
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      rating: 4.6,
    },
    {
      id: 302,
      name: "Gaming Headset RGB",
      price: 3499,
      originalPrice: 4499,
      discount: 22,
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      rating: 4.3,
    },
  ],
};

const categoryNames = {
  chargers: "Chargers",
  cables: "Cables",
  headphones: "Headphones",
  earphones: "Earphones",
  "car-chargers": "Car Chargers",
  "power-banks": "Power Banks",
  "screen-guards": "Screen Guards",
  "mobile-covers": "Mobile Covers",
  adapters: "Adapters",
  "memory-cards": "Memory Cards",
};

export default function AccessoryCategory() {
  const { category } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [priceRange, setPriceRange] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const categoryName =
    categoryNames[category as keyof typeof categoryNames] || "Accessories";
  const products =
    mockAccessoryProducts[category as keyof typeof mockAccessoryProducts] || [];

  const handleAddToCart = (product: AccessoryProduct) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    navigate("/cart");
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
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link
              to="/accessories"
              className="hover:text-primary transition-colors"
            >
              Accessories
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{categoryName}</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {categoryName}
            </h1>
            <p className="text-muted-foreground">
              {products.length} products available
            </p>
          </motion.div>

          {/* Filters & Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 space-y-4"
          >
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={`Search ${categoryName.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Customer Rating</SelectItem>
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

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Products Grid */}
          <div
            className={`grid gap-1 sm:gap-2 ${viewMode === "grid" ? "grid-cols-3 lg:grid-cols-5" : "grid-cols-1"}`}
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="h-full"
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
                        <h3 className="font-bold text-foreground text-[8px] sm:text-sm mb-1 line-clamp-2 min-h-[20px] sm:min-h-0">
                          {product.name}
                        </h3>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-2">
                        {product.discount &&
                          product.originalPrice &&
                          product.originalPrice > product.price && (
                            <span className="text-muted-foreground text-[6px] sm:text-xs line-through">
                              ₹
                              {Math.round(product.originalPrice).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          )}
                        <span className="text-foreground font-black text-[9px] sm:text-sm">
                          ₹{product.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {products.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No products found
              </h3>
              <p className="text-muted-foreground mb-6">
                We're working on adding more {categoryName.toLowerCase()} to our
                collection.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => navigate("/all-products")}
                  variant="outline"
                >
                  Clear All Filters
                </Button>
                <Button onClick={() => navigate("/mobiles-accessories")}>
                  Browse All Products
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
