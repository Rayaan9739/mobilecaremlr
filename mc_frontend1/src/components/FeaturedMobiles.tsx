import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
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
  reviewCount?: number;
  reviewsCount?: number;
  image: string;
  category?: string;
}

export function FeaturedMobiles() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [phones, setPhones] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhones = async () => {
      try {
        const response = await api("/products?isFeatured=true&limit=8");
        setPhones(response.products || []);
      } catch (error) {
        // Silently handle error
        setPhones([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPhones();
  }, []);

  if (loading) {
    return (
      <section className="py-24 md:py-32 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-primary font-display italic text-lg mb-2">
              Featured Collection
            </p>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              Top Mobiles
            </h2>
          </div>
          <div className="flex flex-row lg:flex-row items-stretch lg:items-center justify-start lg:justify-center gap-0 lg:gap-0 w-full max-w-full overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="w-[100px] sm:w-[120px] md:w-[140px] lg:w-[160px] flex-shrink-0 animate-pulse"
              >
                <div className="bg-card rounded-xl sm:rounded-3xl overflow-hidden shadow-elevated p-3 sm:p-6">
                  <div className="aspect-square sm:aspect-[4/5] mb-4 sm:mb-6 bg-secondary/50 rounded-2xl"></div>
                  <div className="h-6 bg-secondary/50 rounded mb-2"></div>
                  <div className="h-8 bg-secondary/50 rounded mb-4"></div>
                  <div className="h-10 bg-secondary/50 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (phones.length === 0) {
    return (
      <section className="py-24 md:py-32 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-primary font-display italic text-lg mb-2">
              Featured Collection
            </p>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              Top Mobiles
            </h2>
          </motion.div>
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No featured mobiles available at the moment.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const handleAddToCart = (phone: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: phone.id,
      name: phone.name,
      price: phone.price,
      image: phone.image,
    });
  };
  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary font-display italic text-lg mb-2">
            Featured Collection
          </p>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">
            Top Mobiles
          </h2>
        </motion.div>

        <div className="flex flex-row lg:flex-row items-stretch lg:items-center justify-start lg:justify-center gap-0 lg:gap-0 w-full max-w-full overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {phones.map((phone, index) => (
            <motion.div
              key={phone.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className={`relative w-[80px] sm:w-[100px] md:w-[120px] lg:w-[140px] flex-shrink-0 ${
                index === 1
                  ? "z-20 lg:scale-105"
                  : "z-10 lg:opacity-90 hover:opacity-100"
              }`}
            >
              <div
                onClick={() => navigate(`/product/new/${phone.id}`)}
                className="bg-card rounded-md sm:rounded-xl overflow-hidden border border-border/50 shadow-sm hover:shadow-elevated transition-all duration-300 flex flex-col h-full cursor-pointer max-w-xs mx-auto w-full"
              >
                <div className="aspect-square relative overflow-hidden bg-secondary/30 rounded-sm sm:rounded-lg mb-3 sm:mb-6 flex items-center justify-center">
                  {phone.discount && phone.originalPrice && phone.originalPrice > phone.price ? (
                    <div className="absolute top-2 right-2 z-20 bg-emerald-600/90 text-white text-[9px] sm:text-xs font-bold px-2 py-1 rounded">
                      {Math.round(phone.discount)}% OFF
                    </div>
                  ) : null}
                  <img
                    src={resolveProductImage(phone)}
                    alt={phone.name}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                    loading="eager"
                    onError={(e) => {
                      e.currentTarget.src = getProductFallbackImage();
                    }}
                  />
                </div>
                <div className="p-1 sm:p-4 flex-1 flex flex-col justify-between text-center">
                  <div>
                    <h3 className="font-bold text-[7px] sm:text-[8px] md:text-base mb-2 line-clamp-2 min-h-[20px] sm:min-h-0">
                      {phone.name}
                    </h3>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {phone.discount && phone.originalPrice && phone.originalPrice > phone.price ? (
                        <span className="text-[10px] sm:text-sm text-muted-foreground line-through">
                          ₹{Math.round(phone.originalPrice).toLocaleString()}
                        </span>
                      ) : null}
                      <span className="text-[10px] sm:text-lg font-black text-primary">
                        ₹{phone.price.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-[9px] sm:text-xs text-muted-foreground">
                      {phone.rating ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {phone.rating}
                        </span>
                      ) : null}
                      {(phone.ratingsCount || phone.reviewCount || phone.reviewsCount) ? (
                        <span>
                          ({phone.ratingsCount || phone.reviewCount || phone.reviewsCount} reviews)
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
