import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { useRepairBooking } from "@/contexts/RepairBookingContext";
import {
  isValidPhoneNumber,
  normalizePhoneInput,
  toNormalizedPhoneNumber,
} from "@/lib/phone";

export default function Contact() {
  const { addContactNotification } = useRepairBooking();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (e.target.name === "phone") {
      const value = normalizePhoneInput(e.target.value);
      setFormData({ ...formData, phone: value });
      if (value && !isValidPhoneNumber(value)) {
        setPhoneError("Please enter a valid phone number");
      } else {
        setPhoneError("");
      }
      return;
    }
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.message.trim() ||
      !formData.phone.trim()
    ) {
      toast.error("Please fill in required fields");
      return;
    }
    if (!isValidPhoneNumber(formData.phone)) {
      setPhoneError("Please enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      const ok = await addContactNotification({
        name: formData.name,
        mobileNumber: toNormalizedPhoneNumber(formData.phone),
        message: `Contact Us: ${formData.message}`,
        email: formData.email,
        address: formData.address,
      });
      if (!ok) {
        toast.error("Failed to send message. Please try again.");
        return;
      }
      toast.success("Message sent. We'll contact you soon.");
      setFormData({ name: "", email: "", phone: "", address: "", message: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <Header />

      <main className="pt-32 md:pt-40 pb-16">
        <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10">
          {/* LEFT — CONTACT INFO */}
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              Contact Information
            </h2>

            <p className="text-gray-600 mb-6 text-sm md:text-base">
              Have you got a query, comment to pass on to us? If so, please fill
              in the form, send us an email or give us a call.
            </p>

            <p className="mb-2 text-sm md:text-base">
              <span className="font-semibold">Phone:</span> 0824 – 2448899,
              9845145662
            </p>

            <p className="mt-4 font-semibold">Address:</p>
            <p className="text-gray-600 mb-6 text-sm md:text-base">
              Prakash Beedi Building,
              <br />
              K.S. Rao Road, Near Passport Office,
              <br />
              Kodialbail, Mangaluru, Karnataka 575003.
            </p>

            {/* MAP */}
            <div className="w-full h-[260px] rounded-xl overflow-hidden border">
              <iframe
                title="Location Map"
                src="https://www.google.com/maps?q=Prakash%20Beedi%20Building%2C%20KS%20Rao%20Road%2C%20Mangaluru&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </div>

          {/* RIGHT — FORM */}
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold mb-6">
              Contact Form
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="text-xs md:text-sm font-medium"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 mt-1"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="text-xs md:text-sm font-medium"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 mt-1"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="text-xs md:text-sm font-medium"
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 mt-1"
                  placeholder="Enter your phone number"
                />
                {phoneError && (
                  <p className="text-xs text-red-500 mt-1">
                    Please enter a valid phone number
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="text-xs md:text-sm font-medium"
                >
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 mt-1"
                  placeholder="Enter your address"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="text-xs md:text-sm font-medium"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 mt-1 h-32"
                  placeholder="Enter Your Message"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
