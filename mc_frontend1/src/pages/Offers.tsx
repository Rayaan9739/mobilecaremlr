import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAdmin } from "@/contexts/AdminContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";

export default function Offers() {
  const { offers } = useAdmin();
  const navigate = useNavigate();
  const fallbackOfferImage =
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=300&fit=crop";

  return (
    <div className="min-h-screen bg-secondary">
      <Header />

      <main className="pt-36 md:pt-44 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display">
              Offers
            </h1>
            <p className="text-muted-foreground mt-3 text-sm md:text-base">
              Grab the best deals on smartphones, accessories, and more!
            </p>
          </motion.div>

          {/* Offers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-elevated transition-all duration-300">
                  <div className="relative">
                    <img
                      src={offer.image?.trim() ? offer.image : fallbackOfferImage}
                      alt={offer.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-purple-900/60 to-green-700/80">
                      <div className="p-6 h-full flex flex-col justify-between">
                        <div>
                          <p className="text-primary-foreground text-xs md:text-sm">
                            {offer.subtitle}
                          </p>
                          <h3 className="text-primary-foreground text-xl md:text-2xl font-bold mt-1">
                            {offer.title}
                          </h3>
                          <p className="text-primary-foreground/80 text-xs md:text-sm mt-2">
                            {offer.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-4" />
                      </div>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute top-4 right-4">
                      <div className="w-12 h-12 rounded-full bg-pink-400/80 animate-pulse" />
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <div className="w-8 h-8 rounded-full bg-yellow-400/80" />
                    </div>
                  </div>
                  <CardContent className="p-6 text-center">
                    <h4 className="font-semibold text-foreground text-base md:text-lg">
                      {offer.tagline}
                    </h4>
                    <p className="text-muted-foreground text-xs md:text-sm mt-2">
                      Valid Till: {offer.endDate}
                    </p>
                    <Button
                      type="button"
                      onClick={() => navigate(`/offers/${offer.id}`)}
                      className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8"
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* No offers message */}
          {offers.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-muted-foreground text-base md:text-lg">
                No offers available at the moment.
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                Check back soon for exciting deals!
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
