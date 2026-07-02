import { motion } from "framer-motion";
import { Truck, ShieldCheck, Award, Headphones } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Free Delivery",
    subtitle: "On orders over ₹999",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    subtitle: "100% safe transactions",
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    icon: Award,
    title: "1 Year Warranty",
    subtitle: "On all repairs & products",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    icon: Headphones,
    title: "Support 24/7",
    subtitle: "Always here to help",
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

export function TrustBar() {
  return (
    <section className="bg-white border-y border-border py-5">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="flex items-center gap-3"
            >
              <div className={`w-11 h-11 rounded-full ${feature.bg} flex items-center justify-center shrink-0`}>
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm leading-tight">{feature.title}</p>
                <p className="text-muted-foreground text-xs leading-tight mt-0.5">{feature.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
