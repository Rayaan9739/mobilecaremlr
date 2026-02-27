import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Ananya Singh",
    role: "Business Owner",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200",
    rating: 5,
    text: "Excellent service! They fixed my iPhone screen in just 30 minutes. The quality is amazing and the price was very reasonable.",
  },
  {
    id: 2,
    name: "Vikram Mehta",
    role: "Software Engineer",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200",
    rating: 5,
    text: "I bought a used phone from MobileCare and it was in perfect condition. Great deals and trustworthy service.",
  },
  {
    id: 3,
    name: "Meera Kapoor",
    role: "Teacher",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=200",
    rating: 5,
    text: "The team is so professional and friendly. They explained everything about my phone repair and delivered on time.",
  },
];

export function Testimonials() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="py-24 md:py-32 bg-background pattern-dots">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary font-display italic text-lg mb-2">Customer Love</p>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">What People Say</h2>
        </motion.div>

        <div className="max-w-4xl mx-auto relative">
          {/* Navigation */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-12 h-12 rounded-full bg-card shadow-elevated flex items-center justify-center text-foreground hover:text-primary transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-12 h-12 rounded-full bg-card shadow-elevated flex items-center justify-center text-foreground hover:text-primary transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Testimonial Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-3xl shadow-elevated p-6 sm:p-8 md:p-12 text-center mx-auto w-[92%] sm:w-full"
            >
              {/* Quote Icon */}
              <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl btn-gradient flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Quote className="w-5 h-5 sm:w-8 sm:h-8 text-primary-foreground" />
              </div>

              {/* Text */}
              <p className="text-base sm:text-xl md:text-2xl text-foreground leading-relaxed mb-6 sm:mb-8">
                "{testimonials[current].text}"
              </p>

              {/* Rating */}
              <div className="flex items-center justify-center gap-1 mb-4 sm:mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      i < testimonials[current].rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <img
                  src={testimonials[current].image}
                  alt={testimonials[current].name}
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover border-2 sm:border-4 border-primary/20"
                />
                <div className="text-left">
                  <p className="font-bold text-sm sm:text-base text-foreground">{testimonials[current].name}</p>
                  <p className="text-primary text-xs sm:text-sm">{testimonials[current].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots - Hidden on mobile */}
          <div className="hidden md:flex items-center justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === current ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
