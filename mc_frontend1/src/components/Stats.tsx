import { motion } from "framer-motion";
import { Award, Wrench, Users } from "lucide-react";

const stats = [
  {
    icon: Award,
    value: "10+",
    label: "Years Experience",
  },
  {
    icon: Wrench,
    value: "5000+",
    label: "Repairs Done",
  },
  {
    icon: Users,
    value: "12K+",
    label: "Happy Customers",
  },
];

export function Stats() {
  return (
    <section className="py-24 md:py-32 bg-foreground text-primary-foreground relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pattern-dots opacity-10" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex md:flex-row items-start md:items-center justify-center gap-2 sm:gap-4 md:gap-16">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="text-center flex-1"
            >
              <div className="relative">
                {/* Circle Background */}
                <div className="w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-2 md:border-4 border-primary/30 flex items-center justify-center mx-auto mb-2 md:mb-4 relative">
                  <div className="absolute inset-1 md:inset-2 rounded-full bg-primary/10" />
                  <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full btn-gradient flex items-center justify-center">
                    <stat.icon className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary-foreground" />
                  </div>
                </div>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 + 0.2 }}
                className="text-lg sm:text-2xl md:text-4xl font-bold text-primary mb-1 md:mb-2"
              >
                {stat.value}
              </motion.p>
              <p className="text-[10px] sm:text-sm md:text-lg text-primary-foreground/80 leading-tight">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
