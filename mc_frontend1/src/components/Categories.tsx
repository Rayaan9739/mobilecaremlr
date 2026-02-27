import { motion } from "framer-motion";
import { ArrowRight, Smartphone, RefreshCw, Headphones, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";

const categories = [
  {
    icon: Smartphone,
    title: "New Phones",
    description: "Latest flagship models from top brands",
    image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=400",
    link: "/category/mobile",
  },
  {
    icon: RefreshCw,
    title: "Used Phones",
    description: "Certified pre-owned devices at great prices",
    image: "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?q=80&w=400",
    link: "/category/used_phone",
  },
  {
    icon: Headphones,
    title: "Accessories",
    description: "Cases, chargers, earbuds & more",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400",
    link: "/accessories",
  },
  {
    icon: Wrench,
    title: "Repair Services",
    description: "Expert repair for all phone models",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=400",
    link: "/services",
  },
];

export function Categories() {
  const navigate = useNavigate();
  return (
    <section className="py-24 md:py-32 bg-background pattern-dots">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary font-display italic text-lg mb-2">What We Offer</p>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">Shop Categories</h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6 w-full">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="relative bg-card rounded-xl sm:rounded-3xl overflow-hidden shadow-card card-hover cursor-pointer" onClick={() => navigate(category.link)}>
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent z-10" />
                <div className="aspect-[4/5] sm:aspect-[4/3] overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 md:p-6 z-20">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-2xl btn-gradient flex items-center justify-center mb-1 sm:mb-2 md:mb-4">
                    <category.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-[10px] sm:text-base md:text-xl font-bold text-primary-foreground mb-0.5 sm:mb-1 md:mb-2 leading-tight">
                    {category.title}
                  </h3>
                  <p className="hidden sm:block text-primary-foreground/80 text-[10px] sm:text-xs md:text-sm mb-2 md:mb-4 line-clamp-2">
                    {category.description}
                  </p>
                  <button className="flex items-center gap-1 sm:gap-2 text-primary text-[10px] sm:text-sm md:text-base font-medium group-hover:gap-1.5 sm:group-hover:gap-3 transition-all">
                    <span className="hidden sm:inline">Explore</span> <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
