import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useRepairBooking } from "@/contexts/RepairBookingContext";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: "Repairs & Services",
    items: [
      {
        question: "How long does a typical phone repair take?",
        answer: "Most common repairs like screen replacement or battery change are completed within 30-60 minutes. More complex repairs may take 2-4 hours. We'll provide you with an estimated time when you drop off your device."
      },
      {
        question: "What types of phone repairs do you offer?",
        answer: "We offer comprehensive repair services including screen replacement, battery replacement, charging port repair, camera repair, water damage repair, software troubleshooting, speaker/microphone repair, and more. We service all major brands including Samsung, Apple, OnePlus, Xiaomi, and others."
      },
      {
        question: "Do you use genuine parts for repairs?",
        answer: "Yes, we use only genuine OEM (Original Equipment Manufacturer) parts or high-quality certified alternatives. All parts come with a warranty and are tested before installation to ensure optimal performance."
      },
      {
        question: "Can you repair water-damaged phones?",
        answer: "Yes, we specialize in water damage repair. We'll perform a thorough diagnostic to assess the extent of damage and provide you with repair options. Success depends on how quickly you bring in the device and the severity of the damage."
      }
    ]
  },
  {
    title: "Warranty & Quality",
    items: [
      {
        question: "Do you provide warranty on repairs?",
        answer: "Yes, all our repairs come with a 90-day warranty on parts and labor. If you experience any issues related to the repair within this period, we'll fix it free of charge. The warranty covers manufacturing defects and workmanship, but not accidental damage."
      },
      {
        question: "What if my phone has the same problem after repair?",
        answer: "If the same issue occurs within the warranty period, bring your phone back to us immediately. We'll diagnose the problem and repair it at no additional cost. Your satisfaction is our priority."
      },
      {
        question: "How do I know my data is safe during repair?",
        answer: "We take data privacy seriously. Our technicians are trained to handle devices without accessing personal data. However, we always recommend backing up your data before any repair. We are not responsible for data loss, so please ensure you have a backup."
      }
    ]
  },
  {
    title: "Pricing & Payment",
    items: [
      {
        question: "How much does a screen replacement cost?",
        answer: "Screen replacement costs vary by phone model and screen type. Prices typically range from ₹2,000 to ₹15,000. We provide a free diagnostic and quote before starting any repair. Contact us with your phone model for an accurate estimate."
      },
      {
        question: "Do you offer free diagnostics?",
        answer: "Yes, we provide free diagnostics for all devices. Our technicians will examine your phone, identify the issue, and provide a detailed quote before proceeding with any repair. There's no obligation to proceed after the diagnostic."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept cash, all major credit/debit cards, UPI payments (Google Pay, PhonePe, Paytm), and digital wallets. Payment is required upon completion of the repair."
      },
      {
        question: "Do you offer any discounts or promotions?",
        answer: "Yes, we regularly offer seasonal discounts and special promotions. Check our Offers page or follow us on social media for current deals. We also provide student discounts with valid ID."
      }
    ]
  },
  {
    title: "Service Area & Availability",
    items: [
      {
        question: "Do you offer doorstep repair service?",
        answer: "Currently, we operate from our service center at Kodialbail, Mangaluru. We do not offer doorstep repair services at this time. However, our convenient location and fast turnaround times make it easy for you to get your device repaired quickly."
      },
      {
        question: "What are your operating hours?",
        answer: "We're open Monday to Saturday from 9:00 AM to 8:30 PM. We're closed on Sundays and public holidays. You can drop off your device anytime during business hours, and we'll provide you with an estimated completion time."
      },
      {
        question: "Do I need to book an appointment?",
        answer: "While walk-ins are welcome, we recommend booking an appointment through our website to avoid waiting times. Appointments ensure that a technician is ready to assist you immediately upon arrival."
      },
      {
        question: "Which phone brands do you repair?",
        answer: "We repair all major smartphone brands including Samsung, Apple (iPhone), Xiaomi (Redmi, Mi), OnePlus, Vivo, Oppo, Realme, Motorola, Nokia, and more. If you have a specific model, feel free to contact us to confirm."
      }
    ]
  },
  {
    title: "Process & Policies",
    items: [
      {
        question: "What should I bring when I come for a repair?",
        answer: "Please bring your phone, charger (if the issue is charging-related), and a valid ID. If your phone is under manufacturer warranty, bring the warranty card and purchase receipt. Make sure to back up your data before visiting."
      },
      {
        question: "Can I wait while my phone is being repaired?",
        answer: "Yes, for quick repairs (30-60 minutes), you're welcome to wait in our comfortable waiting area. For longer repairs, we'll call you when your device is ready for pickup."
      },
      {
        question: "What if you can't fix my phone?",
        answer: "If we determine that your phone cannot be repaired or the repair cost exceeds the device value, we'll inform you immediately. There's no charge for the diagnostic, and we'll discuss alternative options with you."
      },
      {
        question: "Do you buy old or damaged phones?",
        answer: "Yes, we accept old and damaged phones for recycling or buyback. The value depends on the model, condition, and market demand. Contact us for a quote on your specific device."
      }
    ]
  }
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const { openModal } = useRepairBooking();

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    const newOpenItems = new Set(openItems);
    
    if (newOpenItems.has(key)) {
      newOpenItems.delete(key);
    } else {
      newOpenItems.add(key);
    }
    
    setOpenItems(newOpenItems);
  };

  const isOpen = (categoryIndex: number, itemIndex: number) => {
    return openItems.has(`${categoryIndex}-${itemIndex}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 md:pt-40 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <HelpCircle className="w-10 h-10 text-primary" />
              <h1 className="text-3xl md:text-5xl font-bold text-foreground">
                Frequently Asked Questions
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find answers to common questions about our mobile phone repair services, warranty, pricing, and more.
            </p>
          </motion.div>

          {/* FAQ Categories */}
          <div className="max-w-4xl mx-auto space-y-8">
            {faqData.map((category, categoryIndex) => (
              <motion.div
                key={categoryIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-1 h-8 bg-primary rounded-full"></span>
                  {category.title}
                </h2>
                
                <div className="space-y-3">
                  {category.items.map((item, itemIndex) => {
                    const open = isOpen(categoryIndex, itemIndex);
                    
                    return (
                      <div
                        key={itemIndex}
                        className="bg-card rounded-xl shadow-card overflow-hidden border border-border"
                      >
                        <button
                          onClick={() => toggleItem(categoryIndex, itemIndex)}
                          className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-secondary/50 transition-colors"
                        >
                          <span className="font-semibold text-foreground text-lg">
                            {item.question}
                          </span>
                          <motion.div
                            animate={{ rotate: open ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
                          </motion.div>
                        </button>
                        
                        <AnimatePresence>
                          {open && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="px-6 pb-4 pt-2 text-muted-foreground leading-relaxed">
                                {item.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-center bg-secondary/30 rounded-2xl p-8"
          >
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-6">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors"
              >
                Contact Support
              </a>
              <button
                onClick={() => openModal()}
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-primary text-primary rounded-full font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Book a Repair
              </button>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
