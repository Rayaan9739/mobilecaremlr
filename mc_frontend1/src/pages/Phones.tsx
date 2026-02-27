import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useParams, useSearchParams } from "react-router-dom";
import { useAdmin } from "@/contexts/AdminContext";
import { BrandCarousel } from "@/components/BrandCarousel";

export default function Phones() {
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const { newPhones, usedPhones } = useAdmin();
  const isNew = type === "new";
  const rawPhones = isNew ? newPhones : usedPhones;
  const sortByBooking = searchParams.get("sort") === "bookingCount";
  const phones = sortByBooking
    ? [...rawPhones].sort((a, b) => ((b as any).bookingCount || 0) - ((a as any).bookingCount || 0))
    : rawPhones;
  const title = isNew ? "New Phones" : "Used Phones";

  return (
    <div className="min-h-screen bg-secondary">
      <Header />

      {/* Page Content */}
      <main className="pt-32 md:pt-40 pb-16">
        <div className="container mx-auto px-4">
          {/* Brand Carousel */}
          <BrandCarousel />

          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {title}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isNew
                ? "Explore our latest collection of brand new smartphones"
                : "Quality checked pre-owned phones at great prices"}
            </p>
          </motion.div>

          {/* Phone Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {phones.map((phone, index) => (
              <motion.div
                key={phone.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-accent/50 rounded-2xl overflow-hidden hover:shadow-elevated transition-all duration-300"
              >
                {/* Discount Badge */}
                {phone.discount && (
                  <div className="absolute top-3 left-3 z-10 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                    {phone.discount}% OFF
                  </div>
                )}

                {/* Wishlist Button */}
                <button className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-white transition-all opacity-0 group-hover:opacity-100">
                  <Heart className="w-4 h-4" />
                </button>

                {/* Phone Image */}
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={phone.image}
                    alt={phone.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Phone Info */}
                <div className="p-4 bg-card">
                  <h3 className="font-semibold text-foreground text-sm md:text-base truncate">
                    {phone.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {phone.discount &&
                      phone.originalPrice &&
                      phone.originalPrice > phone.price && (
                        <span className="text-muted-foreground text-xs line-through">
                          ₹
                          {Math.round(phone.originalPrice).toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      )}
                    <span className="text-foreground font-bold text-sm md:text-base">
                      ₹{phone.price.toLocaleString()}
                    </span>
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
