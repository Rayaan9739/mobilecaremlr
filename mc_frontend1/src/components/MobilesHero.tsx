import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { fetchPublicResources } from "@/lib/publicResources";

const slides: Array<{
  id: number;
  heading: string;
  subtext: string;
  image: string;
  cta: string;
  link?: string;
}> = [
  {
    id: 1,
    heading: "Latest Smartphones & Accessories",
    subtext: "Power, performance, and style in one place",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=600&fit=crop",
    cta: "Explore Mobiles",
  },
  {
    id: 2,
    heading: "Hearables",
    subtext: "Experience immersive sound with premium audio devices",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=600&fit=crop",
    cta: "Explore Audio",
  },
  {
    id: 3,
    heading: "Upgrade Your Mobile Experience",
    subtext: "Smart devices built for everyday life",
    image:
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1200&h=600&fit=crop",
    cta: "Shop Now",
  },
  {
    id: 4,
    heading: "Premium Tech Essentials",
    subtext: "Discover cutting-edge technology for modern living",
    image:
      "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200&h=600&fit=crop",
    cta: "Explore Service",
  },
];

export function MobilesHero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [savedSlides, setSavedSlides] = useState(slides);
  const navigate = useNavigate();
  const { clearFilters } = useProducts();
  const activeSlides = savedSlides.length > 0 ? savedSlides : slides;

  useEffect(() => {
    const loadSavedBanners = async () => {
      try {
        const resources = await fetchPublicResources("banner");
        const banners = resources
          .filter((item) => item.data?.bannerType !== "hero")
          .map((item, index) => ({
            id: index + 1,
            heading: String(item.title || item.data?.title || "Mobile Care"),
            subtext: String(item.data?.subtitle || ""),
            image: String(item.data?.image || slides[index % slides.length].image),
            cta: String(item.data?.buttonText || "Shop Now"),
            link: String(item.data?.buttonLink || "/all-products"),
          }));

        if (banners.length > 0) {
          setSavedSlides(banners);
          setCurrentSlide(0);
        }
      } catch (error) {
        console.error("Failed to load mobile banners:", error);
      }
    };

    loadSavedBanners();
  }, []);

  useEffect(() => {
    if (!isHovered) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [activeSlides.length, isHovered]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCtaClick = () => {
    clearFilters();
    const link = activeSlides[currentSlide].link || "";
    if (link) {
      navigate(link);
      return;
    }
    switch (currentSlide) {
      case 0:
        navigate("/category/mobile");
        break;
      case 1:
        navigate("/all-products");
        break;
      case 2:
        navigate("/all-products");
        break;
      case 3:
        navigate("/services");
        break;
      default:
        navigate("/all-products");
    }
  };

  return (
    <section
      className="relative h-[60vh] md:h-[70vh] overflow-hidden mt-28 md:mt-32"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={activeSlides[currentSlide].image}
            alt={activeSlides[currentSlide].heading}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            key={`heading-${currentSlide}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
          >
            {activeSlides[currentSlide].heading}
          </motion.h1>

          <motion.p
            key={`subtext-${currentSlide}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-base md:text-lg text-white/90 mb-8 max-w-2xl mx-auto"
          >
            {activeSlides[currentSlide].subtext}
          </motion.p>

          <motion.div
            key={`cta-${currentSlide}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              className="btn-gradient text-primary-foreground rounded-full px-8 shadow-lg hover:shadow-xl transition-all"
              onClick={handleCtaClick}
            >
              {activeSlides[currentSlide].cta}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            {currentSlide === 0 && (
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 rounded-full px-8 shadow-lg transition-all"
                onClick={() => {
                  clearFilters();
                  navigate("/accessories");
                }}
              >
                Explore Accessories
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {activeSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? "bg-white scale-110"
                : "bg-white/50 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
