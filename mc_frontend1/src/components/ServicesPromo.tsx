import { motion } from "framer-motion";
import { Check, ArrowRight, Monitor, Battery, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRepairBooking } from "@/contexts/RepairBookingContext";

interface Service {
  id: number;
  name: string;
  description: string;
  price: string;
  duration: string;
  icon: string;
}

interface ServicesPromoProps {
  services?: Service[];
}

const defaultServices = [
  { icon: Monitor, text: "Fast Screen Replacement" },
  { icon: Battery, text: "Battery & Charging Fix" },
  { icon: Settings, text: "Software & Unlock Services" },
];

export function ServicesPromo(props: ServicesPromoProps) {
  const { openModal } = useRepairBooking();
  const services =
    props.services && props.services.length > 0
      ? props.services.map((s: Service) => ({
          icon: Monitor, // Using Monitor as default icon
          text: s.name,
        }))
      : defaultServices;

  return (
    <section className="py-24 md:py-32 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 items-center">
          {/* Images - Using order-first on mobile to place on top */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative order-first lg:order-none"
          >
            <div className="relative mx-auto lg:mx-0 max-w-sm sm:max-w-md">
              <div className="absolute -top-4 -left-4 w-full h-full bg-primary/10 rounded-3xl" />
              <img
                src="/about.png"
                alt="Phone Repair"
                className="relative rounded-3xl shadow-elevated w-full h-auto object-cover"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute -bottom-6 -right-2 sm:-right-6 w-32 h-32 sm:w-48 sm:h-48"
              >
                <img
                  src="/hero.jpg"
                  alt="Technician"
                  className="w-full h-full object-cover rounded-3xl shadow-elevated border-4 border-card"
                />
              </motion.div>
            </div>

            {/* Floating Badge */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-4 sm:top-8 -right-2 sm:-right-4 bg-card rounded-2xl shadow-elevated p-3 sm:p-4 z-20"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl btn-gradient flex items-center justify-center">
                  <Check className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-sm text-muted-foreground whitespace-nowrap">
                    Success Rate
                  </p>
                  <p className="text-sm sm:text-lg font-bold text-foreground">
                    99.9%
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Content - Center aligned on mobile */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-center lg:text-left flex flex-col items-center lg:items-start mt-8 lg:mt-0"
          >
            <p className="text-primary font-display italic text-lg mb-2">
              Expert Repairs
            </p>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-6">
              Fix Your Phone With Us
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-lg">
              Our certified technicians provide fast, reliable repairs for all
              major phone brands. We use only genuine parts and offer a warranty
              on all repairs.
            </p>

            <div className="space-y-4 mb-8 w-full max-w-md">
              {services.map((service, index) => (
                <motion.div
                  key={service.text}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 bg-secondary/20 p-3 rounded-2xl lg:bg-transparent lg:p-0"
                >
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <service.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <span className="text-base sm:text-lg font-medium text-foreground">
                    {service.text}
                  </span>
                </motion.div>
              ))}
            </div>

            <Button
              size="lg"
              className="btn-gradient text-primary-foreground rounded-full px-12 sm:px-8 shadow-soft hover:shadow-elevated transition-all w-full sm:w-auto"
              onClick={openModal}
            >
              Book Repair
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
