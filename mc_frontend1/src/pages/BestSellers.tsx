import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, ShoppingCart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { resolveProductImage, getProductFallbackImage } from "@/utils/productImage";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  image: string;
  category?: string;
  salesCount?: number;
  bookingsCount?: number;
  bookingCount?: number;
}

export default function BestSellers() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sortByBooking = searchParams.get("sort") === "bookingCount";

  useEffect(() => {
    const fetchBestSellingMobiles = async () => {
      try {
        const sortParam = sortByBooking ? "&sortBy=bookingCount" : "&sortBy=salesCount";
        const response = (await api(
          `/products?category=mobile${sortParam}`,
        )) as { products: Product[] };

        const sortedProducts = (response.products || []).sort(
          (a: Product, b: Product) => {
            if (sortByBooking) {
              return (b.bookingCount || 0) - (a.bookingCount || 0);
            }
            const aSales = (a.salesCount || 0) + (a.bookingsCount || 0);
            const bSales = (b.salesCount || 0) + (b.bookingsCount || 0);
            return bSales - aSales;
          },
        );

        setProducts(sortedProducts);
      } catch (error) {
        console.error("Failed to fetch mobiles:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellingMobiles();
  }, [sortByBooking]);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    navigate("/cart");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary">
        <Header />
        <main className="pt-32 md:pt-40 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                Best Selling Mobile Phones
              </h1>
              <p className="text-muted-foreground text-lg">
                Top 10 most popular mobile phones based on sales data
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(10)].map((_, index) => (
                <div
                  key={index}
                  className="bg-card rounded-3xl overflow-hidden shadow-card p-4 animate-pulse"
                >
                  <div className="aspect-[4/5] mb-4 bg-secondary/50 rounded-2xl"></div>
                  <div className="h-4 bg-secondary/50 rounded mb-2"></div>
                  <div className="h-6 bg-secondary/50 rounded mb-4"></div>
                  <div className="h-8 bg-secondary/50 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-secondary">
        <Header />
        <main className="pt-32 md:pt-40 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Best Selling Mobile Phones
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              No sales data available at the moment.
            </p>
            <Button onClick={() => navigate("/")} className="btn-gradient">
              Back to Home
            </Button>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
              <h1 className="text-3xl md:text-5xl font-bold text-foreground">
                Best Selling Mobile Phones
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Top {products.length} most popular mobile phones based on actual
              sales and bookings data
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <div className="absolute top-2 left-2 z-20 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                  #{index + 1}
                </div>

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
                      <div className="absolute bottom-2 left-2 z-10 bg-white/90 backdrop-blur text-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-soft">
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
                    />
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                    {(product.salesCount || product.bookingsCount) && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {product.salesCount && `${product.salesCount} sold`}
                        {product.salesCount && product.bookingsCount && " • "}
                        {product.bookingsCount && `${product.bookingsCount} booked`}
                      </p>
                    )}
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
