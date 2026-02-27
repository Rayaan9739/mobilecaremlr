import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useProducts } from "@/contexts/ProductContext";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export const UsedPhones = () => {
  const { products, incrementSales } = useProducts();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const [visibleCount, setVisibleCount] = useState(8);

  // Filter only used phones by category and sort by sales count
  const sortedUsedPhones = [...products]
    .filter(
      (product) =>
        product.category?.toUpperCase() === "USED_PHONE" ||
        product.category?.toUpperCase() === "USED-PHONE" ||
        product.category?.toUpperCase() === "USED_PHONES" ||
        product.category?.toLowerCase() === "used phones",
    )
    .sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));

  const usedPhones = sortedUsedPhones.slice(0, visibleCount);

  return (
    <section ref={ref} className="py-20 bg-secondary/30" id="used-phones">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600"
          >
            Premium Used Phones
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Certified pre-owned devices with warranty. Quality checked and
            approved.
          </motion.p>
        </div>

        <div
          className={
            usedPhones.length > 0
              ? "grid grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-2"
              : "flex justify-center items-center py-12"
          }
        >
          {usedPhones.length > 0 ? (
            usedPhones.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={
                  isInView
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.9 }
                }
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative w-full group"
              >
                <button
                  type="button"
                  onClick={() => {
                    incrementSales(product.id);
                  }}
                  className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-elevated transition-all p-2 sm:p-3 cursor-pointer border border-border/50 flex flex-col w-full h-[220px] sm:h-[240px]"
                >
                  <div
                    className="flex items-center justify-center overflow-hidden relative bg-secondary/30 rounded-xl w-full h-[120px] sm:h-[130px]"
                  >
                    {product.rating ? (
                      <div className="absolute top-2 left-2 z-30 bg-black/60 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex items-center gap-0.5 sm:gap-1">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-400 text-yellow-400" />
                        {product.rating}
                      </div>
                    ) : null}
                    <img
                      src={product.image || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"}
                      alt={product.name}
                      className="w-full h-full object-contain transition-all duration-200"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400";
                      }}
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between mt-3 sm:mt-4">
                    <div>
                      <h3 className="text-xs sm:text-base font-bold text-foreground mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2">
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
                        ₹{product.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))
          ) : (
            <div className="text-muted-foreground italic">
              No used phones available right now
            </div>
          )}
        </div>

        {sortedUsedPhones.length > visibleCount && (
          <div className="mt-8 text-center">
            <Button
              type="button"
              onClick={() =>
                setVisibleCount((prev) =>
                  Math.min(sortedUsedPhones.length, prev + 8),
                )
              }
              className="btn-gradient text-primary-foreground rounded-full px-8 py-2 text-sm"
            >
              See All
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
