import { motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

const team = [
  {
    name: "Rajesh Kumar",
    role: "Senior Technician",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=300",
    rating: 4.9,
  },
  {
    name: "Priya Sharma",
    role: "Software Specialist",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300",
    rating: 4.8,
  },
  {
    name: "Amit Patel",
    role: "Hardware Expert",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300",
    rating: 4.9,
  },
  {
    name: "Sneha Reddy",
    role: "Customer Support",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=300",
    rating: 5.0,
  },
];

export function Team() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-24 md:py-32 bg-secondary/30 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary font-display italic text-lg mb-2">Meet The Experts</p>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">Our Technicians</h2>
        </motion.div>

        <div className="relative group">
          {/* Navigation Arrows for Mobile (if > 4 members or on small screens) */}
          <button
            onClick={() => scroll("left")}
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-card shadow-lg flex items-center justify-center text-primary md:hidden"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => scroll("right")}
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-card shadow-lg flex items-center justify-center text-primary md:hidden"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div 
            ref={scrollRef}
            className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto md:overflow-visible pb-8 md:pb-0 snap-x snap-mandatory scrollbar-hide scroll-smooth"
          >
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group flex-shrink-0 w-[280px] sm:w-[calc(50%-12px)] md:w-auto snap-start"
              >
                <div className="bg-card rounded-3xl overflow-hidden shadow-card card-hover text-center h-full">
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-6 -mt-8 relative">
                    <div className="bg-card rounded-2xl shadow-soft p-4">
                      <h3 className="text-lg font-bold text-foreground mb-1">{member.name}</h3>
                      <p className="text-primary text-sm mb-3">{member.role}</p>

                      {/* Rating */}

                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
