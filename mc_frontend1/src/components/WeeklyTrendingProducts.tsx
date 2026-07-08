import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, ChevronRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { resolveProductImage, getProductFallbackImage } from "@/utils/productImage";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  ratingsCount?: number;
  reviewsCount?: number;
  reviewCount?: number;
  image?: string;
  images?: string[];
  category?: string;
  stock?: number;
  isWeeklyTrending?: boolean;
}

export function WeeklyTrendingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrendingProducts = async () => {
      try {
        const response = (await api("/products?isWeeklyTrending=true&limit=10")) as { products: Product[] };
        const inStock = (response.products || []).filter(
          (p) => p.isWeeklyTrending === true && Number(p.stock || 0) > 0,
        );
        setProducts(inStock);
      } catch (error) {
        console.error("Failed to fetch weekly trending products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTrendingProducts();
  }, []);

  const getProductType = (product: Product) =>
    String(product.category || "").toLowerCase() === "mobile" ? "new" : "accessory";

  if (loading) {
    return (
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-1">This Week</p>
              <h2 className="text-2xl font-bold text-foreground">Weekly Trending</h2>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg sm:rounded-2xl border border-border animate-pulse overflow-hidden">
                <div className="aspect-square bg-secondary/50" />
                <div className="p-1.5 sm:p-3 space-y-2">
                  <div className="h-3 bg-secondary/50 rounded" />
                  <div className="h-4 bg-secondary/50 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center shadow-soft">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-primary text-xs font-semibold uppercase tracking-widest">This Week</p>
              <h2 className="text-2xl font-bold text-foreground">Weekly Trending</h2>
            </div>
          </div>
          {products.length > 5 && (
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-primary text-primary hover:bg-primary hover:text-white transition-all"
              onClick={() => navigate("/products?isWeeklyTrending=true")}
            >
              See All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-4">
          {products.slice(0, 10).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.07 }}
              className="h-full"
            >
              <button
                type="button"
                onClick={() => navigate(`/product/${getProductType(product)}/${product.id}`)}
                className="w-full h-full flex flex-col bg-white rounded-lg sm:rounded-2xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300 overflow-hidden group text-left"
              >
                {/* Image Area */}
                <div className="relative w-full bg-white overflow-hidden shrink-0" style={{ paddingBottom: "75%" }}>
                  <div className="absolute inset-0 flex items-center justify-center p-1.5 sm:p-5">
                    {product.discount && product.originalPrice && product.originalPrice > product.price && (
                      <div className="absolute top-1 right-1 z-10 bg-red-500 text-white text-[8px] sm:text-[10px] font-bold px-1 sm:px-2 py-0.5 rounded-sm sm:rounded-full">
                        -{Math.round(product.discount)}%
                      </div>
                    )}
                    {product.rating && (
                      <div className="absolute bottom-1 left-1 z-10 bg-white/95 backdrop-blur text-foreground text-[8px] sm:text-[10px] font-bold px-1 sm:px-2 py-0.5 rounded-sm sm:rounded-full flex items-center gap-0.5 shadow-sm border border-neutral-100">
                        <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-amber-400 text-amber-400" />
                        {product.rating}
                      </div>
                    )}
                    <img
                      src={resolveProductImage(product)}
                      alt={product.name}
                      className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { e.currentTarget.src = getProductFallbackImage(); }}
                    />
                  </div>
                </div>
                {/* Info */}
                <div className="p-1.5 sm:p-4 flex flex-col flex-1 border-t border-gray-100 justify-between">
                  <h3 className="text-[10px] sm:text-xs md:text-sm font-medium sm:font-bold text-gray-800 mb-1 line-clamp-2 leading-snug uppercase tracking-wide">
                    {product.name}
                  </h3>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 flex-wrap">
                      <span className="text-xs sm:text-base font-bold sm:font-black text-primary">
                        ₹{product.price.toLocaleString("en-IN")}
                      </span>
                      {product.discount && product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-[9px] sm:text-xs text-muted-foreground line-through">
                          ₹{Math.round(product.originalPrice).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                    {(product.ratingsCount || product.reviewCount) && (
                      <p className="text-[8px] sm:text-[11px] text-muted-foreground mt-0.5">
                        ({product.ratingsCount || product.reviewCount} reviews)
                      </p>
                    )}
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
