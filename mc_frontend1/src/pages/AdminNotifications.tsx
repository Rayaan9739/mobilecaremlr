import { motion } from "framer-motion";
import { ArrowLeft, Bell, MessageCircle, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useRepairBooking } from "@/contexts/RepairBookingContext";

export default function AdminNotifications() {
  const navigate = useNavigate();
  const { notifications, deleteNotification, markNotificationReplied } =
    useRepairBooking();

  const normalizeType = (n: any) => {
    const raw = String(n?.type || n?.kind || "").trim().toUpperCase();
    if (raw === "REPAIR") return "REPAIR";
    if (raw === "CONTACT") return "CONTACT";
    if (raw === "CART_ORDER" || raw === "CARTORDER") return "CART_ORDER";
    if (raw === "ORDER") return "ORDER";
    return "REPAIR";
  };

  const parseMessagePayload = (message: unknown) => {
    if (typeof message !== "string") return {};
    const trimmed = message.trim();
    if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return {};
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        if (parsed.data && typeof parsed.data === "object") return parsed.data;
        return parsed;
      }
    } catch {
      return {};
    }
    return {};
  };

  const getData = (n: any) => {
    const fromMessage = parseMessagePayload(n?.message);
    const fromData =
      n?.data && typeof n.data === "object" && !Array.isArray(n.data)
        ? n.data
        : {};
    return { ...fromMessage, ...fromData };
  };

  const getDisplayTitle = (n: any) => {
    const type = normalizeType(n);
    if (type === "REPAIR") return "New Repair Booking";
    if (type === "CONTACT") return "New Contact Message";
    if (type === "CART_ORDER") return "New Cart Order";
    return "New Product Order";
  };

  const normalizeWhatsAppNumber = (raw: string) => {
    const digits = (raw || "")
      .replace(/\s+/g, "")
      .replace(/\+/g, "")
      .replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length === 10) return `91${digits}`;
    if (digits.length > 10 && digits.startsWith("91")) return digits;
    if (digits.length > 10) return digits;
    return "";
  };

  const formatCurrency = (value: unknown) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "";
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const getNotificationMeta = (n: any) => {
    const data = getData(n);
    const type = normalizeType(n);
    const name = n?.name || data?.name || data?.fullName || "Customer";
    const mobileNumber =
      n?.mobileNumber || data?.mobileNumber || data?.phone || "";
    const email = data?.email || "";
    return { data, type, name, mobileNumber, email };
  };

  const buildWhatsAppTemplate = (n: any) => {
    const { data, type, name } = getNotificationMeta(n);
    if (type === "REPAIR") {
      const phoneModel =
        n?.phoneModel || data?.phoneModel || data?.model || "your device";
      return `Hi ${name}, this is MobileCare regarding your repair request for ${phoneModel}. We'll assist you shortly.`;
    }
    if (type === "ORDER") {
      const productName =
        data?.productName || data?.itemName || data?.product?.name || "your product";
      const color = data?.color || data?.variant || "selected color";
      const storage = data?.storage || "selected storage";
      const price =
        formatCurrency(data?.price || data?.offerPrice) || "the shared amount";
      return `Hi ${name}, your order for ${productName} (${color}, ${storage}) worth ${price} is received. We'll confirm shortly.`;
    }
    if (type === "CART_ORDER") {
      const total =
        formatCurrency(data?.total || data?.totalPrice) || "the shared amount";
      return `Hi ${name}, we received your order. Total amount ${total}. We'll contact you soon.`;
    }
    return `Hi ${name}, thanks for reaching out to MobileCare. How can we help you further?`;
  };

  const openWhatsApp = (n: any) => {
    const { mobileNumber } = getNotificationMeta(n);
    const waNumber = normalizeWhatsAppNumber(String(mobileNumber || ""));
    if (!waNumber) return;
    const text = encodeURIComponent(buildWhatsAppTemplate(n));
    markNotificationReplied(n.id);
    window.open(
      `https://wa.me/${waNumber}?text=${text}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const renderTypeDetails = (n: any) => {
    const { data, type, name, mobileNumber, email } = getNotificationMeta(n);

    if (type === "REPAIR") {
      const issues =
        (Array.isArray(n?.issues) && n.issues.length > 0
          ? n.issues
          : Array.isArray(data?.issues)
            ? data.issues
            : [])
          .map((issue: unknown) => String(issue))
          .filter(Boolean);

      return (
        <div className="text-[11px] sm:text-xs text-gray-700 mt-2 space-y-2">
          <div className="font-semibold text-foreground">Customer Details</div>
          <div>Name: {name || "-"}</div>
          <div>Phone: {mobileNumber || "-"}</div>
          <div className="font-semibold text-foreground pt-1">Device Details</div>
          <div>Brand: {n?.phoneBrand || data?.phoneBrand || "-"}</div>
          <div>Model: {n?.phoneModel || data?.phoneModel || "-"}</div>
          <div>Issues: {issues.length > 0 ? issues.join(", ") : "-"}</div>
        </div>
      );
    }

    if (type === "ORDER") {
      return (
        <div className="text-[11px] sm:text-xs text-gray-700 mt-2 space-y-2">
          <div className="font-semibold text-foreground">Customer</div>
          <div>Name: {name || "-"}</div>
          <div>Phone: {mobileNumber || "-"}</div>
          <div className="font-semibold text-foreground pt-1">Product</div>
          <div>
            Product Name: {data?.productName || data?.itemName || data?.product?.name || "-"}
          </div>
          <div>Color: {data?.color || data?.variant || "-"}</div>
          <div>Storage: {data?.storage || "-"}</div>
          <div>Price: {formatCurrency(data?.price || data?.offerPrice) || "-"}</div>
        </div>
      );
    }

    if (type === "CART_ORDER") {
      const items = Array.isArray(data?.items) ? data.items : [];
      return (
        <div className="text-[11px] sm:text-xs text-gray-700 mt-2 space-y-2">
          <div className="font-semibold text-foreground">Customer</div>
          <div>Name: {name || "-"}</div>
          <div>Phone: {mobileNumber || "-"}</div>
          <div className="font-semibold text-foreground pt-1">Order Items</div>
          {items.length === 0 ? (
            <div>-</div>
          ) : (
            <div className="space-y-1">
              {items.map((item: any, idx: number) => (
                <div key={idx}>
                  • {item?.productName || item?.name || "Product"} —{" "}
                  {item?.color || "-"} — {item?.storage || "-"} — {formatCurrency(item?.price) || "-"}
                </div>
              ))}
            </div>
          )}
          <div className="pt-1">
            Total: {formatCurrency(data?.total || data?.totalPrice) || "-"}
          </div>
        </div>
      );
    }

    return (
      <div className="text-[11px] sm:text-xs text-gray-700 mt-2 space-y-2">
        <div className="font-semibold text-foreground">Contact</div>
        <div>Name: {name || "-"}</div>
        <div>Phone / Email: {mobileNumber || email || "-"}</div>
        <div>
          Message:{" "}
          {data?.message ||
            (typeof n?.message === "string" && !n.message.trim().startsWith("{")
              ? n.message
              : "-")}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-secondary">
      <Header />

      <main className="pt-36 md:pt-44 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-foreground" />
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                Notifications
              </h1>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm md:text-base">
                No notifications yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n, index) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 sm:p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-extrabold text-foreground">
                        {getDisplayTitle(n)}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                          {getNotificationMeta(n).name || "Customer"}
                        </div>
                        {n.replied ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            Replied
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            New
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground">
                          {normalizeType(n) === "CART_ORDER"
                            ? "Cart Order"
                            : normalizeType(n) === "ORDER"
                              ? "Book a Product"
                              : normalizeType(n) === "CONTACT"
                                ? "Contact Us"
                                : "Book a Repair"}
                        </span>
                      </div>

                      <div className="text-[11px] sm:text-xs text-gray-600 mt-1 truncate">
                        {getNotificationMeta(n).mobileNumber || "-"}
                      </div>

                      {renderTypeDetails(n)}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <Button
                        type="button"
                        onClick={() => openWhatsApp(n)}
                        className="h-8 px-3 text-[11px] sm:text-xs rounded-md bg-green-600 hover:bg-green-700 text-white"
                      >
                        <MessageCircle className="w-4 h-4 mr-1.5" />
                        Reply
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => deleteNotification(n.id)}
                        className="h-8 px-3 text-[11px] sm:text-xs rounded-md"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin")}
            >
              Back to Admin
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
