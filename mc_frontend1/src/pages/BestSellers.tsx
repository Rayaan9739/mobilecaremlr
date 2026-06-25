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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-sm font-bold px-2 py-1 rounded-full">
                  #{index + 1}
                </div>

                <div className="bg-card rounded-3xl overflow-hidden shadow-card card-hover p-4 h-full">
                  <div className="aspect-[4/5] mb-4 flex items-center justify-center bg-secondary/50 rounded-2xl overflow-hidden">
                    <img
                      src={resolveProductImage(product)}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = getProductFallbackImage();
                      }}
                    />
                  </div>

                  <div className="flex flex-col h-full">
                    {product.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(product.rating || 0)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-muted"
                            }`}
                          />
                        ))}
                        <span className="text-sm text-muted-foreground ml-1">
                          ({product.rating})
                        </span>
                      </div>
                    )}

                    <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    {(product.salesCount || product.bookingsCount) && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {product.salesCount && `${product.salesCount} sold`}
                        {product.salesCount && product.bookingsCount && " • "}
                        {product.bookingsCount &&
                          `${product.bookingsCount} booked`}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mb-4 mt-auto">
                      <span className="text-xl font-bold text-primary">
                        ₹{product.price.toLocaleString()}
                      </span>
                      {product.discount &&
                        product.originalPrice &&
                        product.originalPrice > product.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            ₹
                            {Math.round(product.originalPrice).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        )}
                    </div>

                    <Button
                      onClick={() => handleAddToCart(product)}
                      className="w-full btn-gradient text-primary-foreground rounded-xl"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
