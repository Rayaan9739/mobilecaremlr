import { motion } from "framer-motion";
import { ArrowRight, Smartphone, RefreshCw, Headphones, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "@/contexts/ProductContext";

type CategoryCard = {
  title: string;
  description: string;
  image: string;
  link: string;
  iconImage?: string;
};

const categories = [
  {
    icon: Smartphone,
    title: "New Phones",
    description: "Latest flagship models from top brands",
    image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=400",
    link: "/products?category=MOBILE",
  },
  {
    icon: RefreshCw,
    title: "Used Phones",
    description: "Certified pre-owned devices at great prices",
    image: "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?q=80&w=400",
    link: "/products?category=used_phone",
  },
  {
    icon: Headphones,
    title: "Accessories",
    description: "Cases, chargers, earbuds & more",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400",
    link: "/products?category=ACCESSORIES",
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
  const { clearFilters, categories } = useProducts();

  const defaultCategories: CategoryCard[] = [
    {
      title: "New Phones",
      description: "Latest flagship models from top brands",
      image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=400",
      link: "/products?category=MOBILE",
    },
    {
      title: "Used Phones",
      description: "Certified pre-owned devices at great prices",
      image: "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?q=80&w=400",
      link: "/products?category=used_phone",
    },
    {
      title: "Accessories",
      description: "Cases, chargers, earbuds & more",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400",
      link: "/products?category=ACCESSORIES",
    },
    {
      title: "Repair Services",
      description: "Expert repair for all phone models",
      image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=400",
      link: "/services",
    },
  ];

  const liveCategories: CategoryCard[] = categories.length
    ? categories
        .slice(0, 4)
      .map((category) => ({
          title: category.displayName,
          description: "Explore products in this category",
          image:
            category.image ||
            category.icon ||
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop",
          link:
            category.name.toUpperCase() === "ACCESSORIES"
              ? "/accessories"
              : `/category/${category.name.toLowerCase().replace(/[\s-]+/g, "-")}`,
          iconImage: category.image || category.icon || undefined,
        }))
    : defaultCategories;

  const goToCategory = (link: string) => {
    clearFilters();
    navigate(link);
  };
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-primary font-display italic text-base md:text-lg mb-2">What We Offer</p>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">Trending Categories</h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {liveCategories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              onClick={() => goToCategory(category.link)}
              className="group cursor-pointer"
            >
              <div className="relative bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 h-full">
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent z-10" />
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-20">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl btn-gradient flex items-center justify-center mb-3 md:mb-4 shadow-lg overflow-hidden">
                    {category.iconImage ? (
                      <img src={category.iconImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Smartphone className="w-6 h-6 md:w-7 md:h-7 text-primary-foreground" />
                    )}
                  </div>
                  <h3 className="text-base md:text-xl font-bold text-white mb-2 leading-tight">
                    {category.title}
                  </h3>
                  <p className="text-white/90 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">
                    {category.description}
                  </p>
                  <div className="flex items-center gap-2 text-primary text-sm md:text-base font-medium group-hover:gap-3 transition-all">
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
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
