import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";
import { useRef, useState } from "react";

type CategoryCard = {
  title: string;
  description: string;
  image: string;
  link: string;
  iconImage?: string;
};

const defaultCategories: CategoryCard[] = [
  { title: "New Phones", description: "Latest flagship models", image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=400", link: "/products?category=MOBILE" },
  { title: "Used Phones", description: "Certified pre-owned", image: "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?q=80&w=400", link: "/products?category=used_phone" },
  { title: "Accessories", description: "Cases, chargers & more", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400", link: "/products?category=ACCESSORIES" },
  { title: "Repair Services", description: "Expert repair service", image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=400", link: "/services" },
];

export function Categories() {
  const navigate = useNavigate();
  const { clearFilters, categories } = useProducts();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showAll, setShowAll] = useState(false);

  const liveCategories: CategoryCard[] = categories.length
    ? categories.map((category) => ({
        title: category.displayName,
        description: "Explore products",
        image: category.image || category.icon || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop",
        link: category.name.toUpperCase() === "ACCESSORIES"
          ? "/accessories"
          : `/category/${category.name.toLowerCase().replace(/[\s-]+/g, "-")}`,
        iconImage: category.image || category.icon || undefined,
      }))
    : defaultCategories;

  const visibleCategories = showAll ? liveCategories : liveCategories.slice(0, 8);

  const goToCategory = (link: string) => { clearFilters(); navigate(link); };

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -280, behavior: "smooth" });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 280, behavior: "smooth" });

  return (
    <section className="py-10 bg-white border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-1">Browse</p>
            <h2 className="text-2xl font-bold text-foreground">Shop by Category</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={scrollLeft}
              className="w-9 h-9 rounded-full bg-white border-2 border-border hover:border-primary flex items-center justify-center text-muted-foreground hover:text-primary transition-all shadow-soft"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={scrollRight}
              className="w-9 h-9 rounded-full bg-white border-2 border-border hover:border-primary flex items-center justify-center text-muted-foreground hover:text-primary transition-all shadow-soft"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-3"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {liveCategories.map((category, index) => (
            <motion.button
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              onClick={() => goToCategory(category.link)}
              className="flex flex-col items-center gap-3 group shrink-0 min-w-[140px] bg-card rounded-2xl p-6 text-center hover:shadow-elevated transition-all cursor-pointer"
            >
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors overflow-hidden">
                {category.iconImage ? (
                  <img src={category.iconImage} alt={category.title} className="w-full h-full object-cover" />
                ) : (
                  <img src={category.image} alt={category.title} className="w-full h-full object-cover" />
                )}
              </div>
              <span className="font-semibold text-foreground text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {category.title}
              </span>
              {category.description && (
                <span className="text-muted-foreground text-xs mt-1 line-clamp-2">
                  {category.description}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}