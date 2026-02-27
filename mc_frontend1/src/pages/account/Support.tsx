import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Mail, Phone, MessageCircle, ChevronDown, ChevronUp, Send } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What types of phone repairs do you offer?",
    answer: "We offer comprehensive repair services including screen replacement, battery replacement, charging port repair, camera repair, water damage repair, software troubleshooting, speaker/microphone repair, and more. We service all major brands including Samsung, Apple, OnePlus, Xiaomi, and others."
  },
  {
    question: "How long does a typical repair take?",
    answer: "Most common repairs like screen replacement or battery replacement are completed within 1-2 hours. Complex repairs may take 24-48 hours depending on parts availability."
  },
  {
    question: "Do you provide warranty on repairs?",
    answer: "Yes! We provide a 90-day warranty on all our repairs. If you experience any issues with the repaired component within the warranty period, we'll fix it for free."
  },
  {
    question: "What brands do you service?",
    answer: "We service all major smartphone brands including Apple, Samsung, Xiaomi, OnePlus, Vivo, Oppo, Realme, Motorola, Huawei, Nokia, and more."
  },
  {
    question: "Do you buy old phones?",
    answer: "Yes, we buy old and damaged phones. The value depends on the model, condition, and market demand. Visit our store or contact us for a quote."
  },
  {
    question: "How can I track my repair status?",
    answer: "You can track your repair status by calling our service center or visiting in person. We'll also send you updates via SMS when your phone is ready."
  }
];

export default function Support() {
  const { toast } = useToast();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await api("/support/ticket", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      toast({ title: "Success", description: "Your support request has been submitted. We'll get back to you soon!" });
      setFormData({ name: "", email: "", message: "" });
    } catch {
      toast({ title: "Error", description: "Failed to submit support request. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Help & Support</h1>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
          <Phone className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium">Phone</p>
            <p className="text-sm text-gray-600">0824 - 2448899</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
          <Mail className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium">Email</p>
            <p className="text-sm text-gray-600">info@mobilecaremlr.com</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium">WhatsApp</p>
            <p className="text-sm text-gray-600">+91 9845145662</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-gray-50"
              >
                <span className="font-medium">{faq.question}</span>
                {openFAQ === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {openFAQ === index && (
                <div className="p-4 bg-gray-50 text-gray-600 border-t border-gray-200">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Submit a Support Request</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <Input
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg h-32"
              placeholder="Describe your issue..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? "Sending..." : "Submit Request"}
          </Button>
        </form>
      </div>
    </div>
  );
}
