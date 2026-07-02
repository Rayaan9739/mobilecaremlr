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
      ? props.services.map((s: Service) => ({ icon: Monitor, text: s.name }))
      : defaultServices;

  return (
    <section className="py-16 bg-white border-b border-border overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 items-center">
          {/* Image side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative order-first lg:order-none"
          >
            <div className="relative mx-auto lg:mx-0 max-w-sm sm:max-w-md">
              {/* Decorative background card */}
              <div className="absolute -top-4 -left-4 w-full h-full bg-primary/8 rounded-3xl" />
              <img
                src="/about.png"
                alt="Phone Repair"
                className="relative rounded-3xl shadow-elevated w-full h-auto object-cover"
              />
              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -bottom-6 -right-2 sm:-right-6 bg-white rounded-2xl shadow-elevated p-4 border border-border z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl btn-gradient flex items-center justify-center shadow-soft">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                    <p className="text-lg font-black text-foreground">99.9%</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Content side */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-center lg:text-left flex flex-col items-center lg:items-start mt-8 lg:mt-0"
          >
            <p className="text-primary font-semibold text-xs uppercase tracking-widest mb-2">Expert Repairs</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              Fix Your Phone <br />
              <span className="text-primary">With Us</span>
            </h2>
            <p className="text-muted-foreground text-base mb-8 leading-relaxed max-w-lg">
              Our certified technicians provide fast, reliable repairs for all major phone brands.
              We use only genuine parts and offer a warranty on all repairs.
            </p>

            <div className="space-y-4 mb-8 w-full max-w-md">
              {services.map((service, index) => (
                <motion.div
                  key={service.text}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 bg-secondary/40 rounded-xl p-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <service.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{service.text}</span>
                  <Check className="w-4 h-4 text-primary ml-auto shrink-0" />
                </motion.div>
              ))}
            </div>

            <Button
              size="lg"
              className="btn-gradient text-white rounded-full px-10 shadow-soft hover:shadow-elevated transition-all"
              onClick={openModal}
            >
              Book Repair Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
