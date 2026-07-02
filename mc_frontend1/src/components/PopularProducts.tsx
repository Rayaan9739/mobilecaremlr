import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, ChevronRight, Flame } from "lucide-react";
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
  image: string;
  category?: string;
}

export function PopularProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const visibleProducts = isMobile ? products.slice(0, 4) : products.slice(0, 5);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = (await api("/products?category=MOBILE&isFeatured=true&limit=50")) as { products: Product[] };
        const featured = (response.products || [])
          .filter((p: Product) => p.category?.toUpperCase() === "MOBILE" && Boolean((p as Product & { isFeatured?: boolean }).isFeatured))
          .slice(0, 50);
        setProducts(featured);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-secondary/40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-1">Best Sellers</p>
              <h2 className="text-2xl font-bold text-foreground">Most Popular Products</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((id) => (
              <div key={id} className="bg-white rounded-2xl border border-border animate-pulse overflow-hidden">
                <div className="aspect-square bg-secondary/50" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-secondary/50 rounded" />
                  <div className="h-5 bg-secondary/50 rounded w-2/3" />
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
    <section className="py-12 bg-secondary/40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-primary text-xs font-semibold uppercase tracking-widest">Best Sellers</p>
              <h2 className="text-2xl font-bold text-foreground">Most Popular Products</h2>
            </div>
          </div>
          {products.length > (isMobile ? 4 : 5) && (
            <Button
              variant="outline"
              className="rounded-full border-primary text-primary hover:bg-primary hover:text-white transition-all"
              type="button"
              onClick={() => navigate("/products")}
            >
              See All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {visibleProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <button
                type="button"
                onClick={() => navigate(`/product/new/${product.id}`)}
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
                    src={resolveProductImage(product)}
                    alt={product.name}
                    className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => { e.currentTarget.src = getProductFallbackImage(); }}
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
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                    {product.discount && product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-xs text-muted-foreground line-through">
                        ₹{Math.round(product.originalPrice).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  {(product.ratingsCount || product.reviewCount) && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      ({product.ratingsCount || product.reviewCount} reviews)
                    </p>
                  )}
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
