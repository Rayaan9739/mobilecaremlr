import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, ChevronRight } from "lucide-react";
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

const fallbackProductImage =
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400";

export function WeeklyTrendingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrendingProducts = async () => {
      try {
        const response = (await api(
          "/products?isWeeklyTrending=true&limit=10",
        )) as { products: Product[] };
        const inStockTrendingProducts = (response.products || []).filter(
          (product) =>
            product.isWeeklyTrending === true && Number(product.stock || 0) > 0,
        );
        setProducts(inStockTrendingProducts);
      } catch (error) {
        console.error("Failed to fetch weekly trending products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingProducts();
  }, []);

  const getProductImage = (product: Product) =>
    resolveProductImage(product);
  const getProductType = (product: Product) =>
    String(product.category || "").toLowerCase() === "mobile"
      ? "new"
      : "accessory";

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary font-display italic text-lg mb-2">
            This Week
          </p>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">
            Weekly Trending Products
          </h2>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="w-full aspect-square animate-pulse">
                <div className="bg-card rounded-2xl overflow-hidden shadow-sm p-2 sm:p-3 border border-border/50 flex flex-col h-full">
                  <div className="w-full aspect-square bg-secondary/50 rounded-xl mb-2"></div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="h-4 bg-secondary/50 rounded mb-1"></div>
                    <div className="h-3 bg-secondary/50 rounded mb-1"></div>
                    <div className="h-5 bg-secondary/50 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No trending products available
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-2">
            {products.slice(0, 10).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="relative w-full group aspect-square"
              >
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/product/${getProductType(product)}/${product.id}`)
                  }
                  className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-elevated transition-all p-2 sm:p-3 cursor-pointer border border-border/50 flex flex-col w-full h-full"
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden relative bg-secondary/30">
                    {product.discount && product.originalPrice && product.originalPrice > product.price && (
                      <div className="absolute top-2 right-2 z-30 bg-emerald-600/90 text-white text-[9px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded">
                        {Math.round((product.discount))}% OFF
                      </div>
                    )}
                    {product.rating ? (
                      <div className="absolute top-2 left-2 z-30 bg-black/60 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex items-center gap-0.5 sm:gap-1">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-400 text-yellow-400" />
                        {product.rating}
                      </div>
                    ) : null}
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = getProductFallbackImage();
                      }}
                      loading="eager"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between mt-2 sm:mt-3">
                    <h3 className="text-xs sm:text-base font-bold text-foreground mb-1 line-clamp-2 text-left">
                      {product.name}
                    </h3>
                    <div className="flex flex-col gap-0.5 sm:gap-1">
                      <div className="flex items-center gap-1 sm:gap-2">
                        {product.discount &&
                          product.originalPrice &&
                          product.originalPrice > product.price && (
                            <span className="text-xs sm:text-sm text-muted-foreground line-through">
                              ₹
                              {Math.round(product.originalPrice).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          )}
                        <span className="text-sm sm:text-lg font-black text-primary">
                          ₹{product.price.toLocaleString("en-IN")}
                        </span>
                      </div>
                      {product.ratingsCount ? (
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          ({product.ratingsCount} reviews)
                        </span>
                      ) : product.reviewCount ? (
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          ({product.reviewCount} reviews)
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}
        {products.length > 10 && (
          <div className="mt-8 text-center">
            <Button
              type="button"
              onClick={() => navigate("/products?isWeeklyTrending=true")}
              className="text-primary hover:text-primary/80"
              variant="link"
            >
              See All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
