import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/contexts/AdminContext";

export function Hero() {
  const navigate = useNavigate();
  const { heroSettings } = useAdmin();

  // Use hero settings from AdminContext, fallback to defaults if not set
  const tagline = heroSettings?.tagline || "Get best mobile experience with us";
  const title = heroSettings?.title || "Premium Mobiles &";
  const titleHighlight = heroSettings?.titleHighlight || "Accessories";
  const subtitle = heroSettings?.subtitle || "Upgrade Your Lifestyle Today";
  const backgroundImage = heroSettings?.backgroundImage;

  return (
    <section className="relative min-h-[70vh] sm:min-h-[80vh] flex items-center pt-32 md:pt-40 pb-32 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {backgroundImage && backgroundImage.trim() !== "" ? (
          <img
            src={backgroundImage}
            alt="Hero Background"
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <img
            src="/herobg.png"
            alt="Hero Background"
            className="w-full h-full object-cover object-center"
          />
        )}
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Pattern Overlay */}
      <div className="absolute inset-0 pattern-dots opacity-30" />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 w-full max-w-full overflow-x-hidden">
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-primary font-display italic text-sm sm:text-base md:text-lg mb-4"
          >
            {tagline}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4 leading-tight"
          >
            {title}<br />
            <span className="text-gradient">{titleHighlight}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-base sm:text-lg md:text-xl text-primary-foreground/80 mb-8"
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row flex-wrap gap-4"
          >
            <Button
              size="lg"
              className="btn-gradient text-primary-foreground rounded-full px-8 shadow-soft hover:shadow-elevated transition-all text-lg"
              onClick={() => navigate('/mobiles-accessories')}
            >
              Explore Collection
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/services')}
              className="bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-foreground rounded-full px-8 text-lg cursor-pointer transition-all"
            >
              Our Services
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
