import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "../lib/api";
import { isValidPhoneNumber, normalizePhoneInput, toNormalizedPhoneNumber } from "@/lib/phone";

interface RepairNotification {
  id: string;
  createdAt: string;
  // legacy properties (used by UI)
  kind?: "repair" | "order" | "contact";
  name?: string;
  mobileNumber?: string;
  phoneBrand?: string;
  phoneModel?: string;
  issues?: string[];
  otherIssue?: string;
  visitDate?: string;
  message?: string;
  // new unified fields
  type?: "REPAIR" | "CONTACT" | "ORDER" | "CART_ORDER";
  title?: string;
  data?: any;
  expiresAt?: string;
  replied: boolean;
}

interface FormData {
  phoneBrand: string;
  phoneModel: string;
  issues: string[];
  otherIssue: string;
  visitDate: string;
  name: string;
  mobileNumber: string;
  contactConsent: boolean;
}

const initialFormData: FormData = {
  phoneBrand: "",
  phoneModel: "",
  issues: [],
  otherIssue: "",
  visitDate: "",
  name: "",
  mobileNumber: "",
  contactConsent: false,
};

interface RepairBookingContextType {
  isOpen: boolean;
  openModal: (initialIssue?: string) => void;
  closeModal: () => void;
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  resetForm: () => void;
  brands: string[];
  modelsByBrand: Record<string, string[]>;
  loadingBrands: boolean;
  handleBrandChange: (brand: string) => void;
  handleIssueToggle: (issue: string) => void;
  isFormValid: () => boolean;
  notifications: RepairNotification[];
  addNotification: (data: FormData) => Promise<boolean>;
  addOrderNotification: (
    data: { name: string; mobileNumber: string; message: string } & Record<
      string,
      any
    >,
  ) => Promise<boolean>;
  addContactNotification: (
    data: { name: string; mobileNumber: string; message: string } & Record<
      string,
      any
    >,
  ) => Promise<boolean>;
  markNotificationReplied: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearNotifications: () => void;
}

const RepairBookingContext = createContext<
  RepairBookingContextType | undefined
>(undefined);

export function RepairBookingProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [notifications, setNotifications] = useState<RepairNotification[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [modelsByBrand, setModelsByBrand] = useState<Record<string, string[]>>(
    {},
  );
  const [loadingBrands, setLoadingBrands] = useState(true);

  // notifications are now persisted in the backend; state is hydrated on mount

  const HARDCODED_DATA: Record<string, string[]> = {
    Samsung: [
      "Galaxy S24 Ultra",
      "Galaxy S23",
      "Galaxy A54",
      "Galaxy M34",
      "Galaxy Z Fold5",
    ],
    Apple: [
      "iPhone 15 Pro Max",
      "iPhone 14",
      "iPhone 13",
      "iPhone 12",
      "iPhone SE",
    ],
    Xiaomi: [
      "Redmi Note 13 Pro",
      "Xiaomi 14",
      "Poco X6 Pro",
      "Redmi 12",
      "Xiaomi 13T",
    ],
    OnePlus: [
      "OnePlus 12",
      "OnePlus 12R",
      "OnePlus Open",
      "OnePlus Nord CE 3",
      "OnePlus 11",
    ],
    Vivo: ["Vivo X100 Pro", "Vivo V30", "Vivo Y200", "Vivo T2 Pro", "Vivo X90"],
    Oppo: [
      "Oppo Reno 11 Pro",
      "Oppo Find N3 Flip",
      "Oppo F25 Pro",
      "Oppo A79",
      "Oppo A59",
    ],
    Realme: [
      "Realme 12 Pro+",
      "Realme Narzo 60",
      "Realme C67",
      "Realme 11x",
      "Realme GT 2",
    ],
    Motorola: [
      "Moto G84",
      "Motorola Edge 40 Neo",
      "Moto G54",
      "Razr 40 Ultra",
      "Moto G34",
    ],
    Google: ["Pixel 8 Pro", "Pixel 7a", "Pixel 7", "Pixel 6a", "Pixel Fold"],
    Other: ["Other Model"],
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setModelsByBrand(HARDCODED_DATA);
      setBrands(
        Object.keys(HARDCODED_DATA)
          .filter((b) => b !== "Other")
          .sort()
          .concat("Other"),
      );
      setLoadingBrands(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Load and refresh notifications for admin users.
  useEffect(() => {
    const isAdminUser =
      isAuthenticated && user?.email?.toLowerCase() === "admin@mobilecare.com";

    if (!isAdminUser) {
      setNotifications([]);
      return;
    }

    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let failureCount = 0;

    const load = async () => {
      try {
        const data = await api<RepairNotification[]>("/admin/notifications");
        if (!cancelled) {
          setNotifications(data || []);
        }
        failureCount = 0;
      } catch (e) {
        if (!cancelled) {
          setNotifications([]);
        }
        failureCount += 1;
      } finally {
        const nextDelayMs = failureCount >= 3 ? 60_000 : 15_000;
        if (!cancelled) {
          timerId = setTimeout(load, nextDelayMs);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [isAuthenticated, user?.email]);

  const openModal = (initialIssue?: string) => {
    if (initialIssue) {
      setFormData((prev) => ({
        ...prev,
        issues: [initialIssue],
      }));
    }
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const handleBrandChange = (brand: string) => {
    setFormData((prev) => ({
      ...prev,
      phoneBrand: brand,
      phoneModel: "",
    }));
  };

  const handleIssueToggle = (issue: string) => {
    setFormData((prev) => ({
      ...prev,
      issues: prev.issues.includes(issue)
        ? prev.issues.filter((i) => i !== issue)
        : [...prev.issues, issue],
    }));
  };

  const isFormValid = () => {
    const hasOtherIssue = formData.issues.includes("Something else");

    return (
      formData.phoneBrand !== "" &&
      formData.phoneModel.trim() !== "" &&
      formData.issues.length > 0 &&
      (!hasOtherIssue || formData.otherIssue.trim() !== "") &&
      formData.visitDate !== "" &&
      formData.name.trim() !== "" &&
      isValidPhoneNumber(formData.mobileNumber) &&
      formData.contactConsent
    );
  };

  const addNotification = async (data: FormData) => {
    const phoneInput = normalizePhoneInput(data.mobileNumber);
    if (!isValidPhoneNumber(phoneInput)) {
      return false;
    }
    const normalizedPhone = toNormalizedPhoneNumber(phoneInput);
    const normalizedMessage = [
      data.issues.length > 0 ? `Issues: ${data.issues.join(", ")}` : "",
      data.otherIssue.trim() ? `Other: ${data.otherIssue.trim()}` : "",
      data.visitDate ? `Visit: ${data.visitDate}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    const payload = {
      type: "REPAIR",
      title: "New Repair Booking",
      data: { ...data },
      // legacy fields for backward compatibility
      kind: "repair",
      name: data.name.trim(),
      mobileNumber: normalizedPhone,
      phoneBrand: data.phoneBrand,
      phoneModel: data.phoneModel.trim(),
      issues: data.issues,
      otherIssue: data.otherIssue,
      visitDate: data.visitDate,
      message: normalizedMessage,
    };

    try {
      const created = await api<RepairNotification>("/notifications/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (created) {
        setNotifications((prev) => [created, ...prev]);
      }
      return true;
    } catch (err) {
      console.error("failed to post notification", err);
      return false;
    }
  };

  const addOrderNotification = async (data: {
    name: string;
    mobileNumber: string;
    message: string;
    [key: string]: any;
  }) => {
    const phoneInput = normalizePhoneInput(data.mobileNumber);
    if (!isValidPhoneNumber(phoneInput)) {
      return false;
    }
    const normalizedPhone = toNormalizedPhoneNumber(phoneInput);
    const payload = {
      type: "ORDER",
      title: "New Product Order",
      data,
      kind: "order",
      name: data.name.trim(),
      mobileNumber: normalizedPhone,
      message: data.message.trim() || "Product order placed",
    };

    try {
      const created = await api<RepairNotification>("/notifications/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (created) {
        setNotifications((prev) => [created, ...prev]);
      }
      return true;
    } catch (err) {
      console.error("failed to post order notification", err);
      return false;
    }
  };

  const addContactNotification = async (data: {
    name: string;
    mobileNumber: string;
    message: string;
    [key: string]: any;
  }) => {
    const phoneInput = normalizePhoneInput(data.mobileNumber);
    if (!isValidPhoneNumber(phoneInput)) {
      return false;
    }
    const normalizedPhone = toNormalizedPhoneNumber(phoneInput);
    const payload = {
      type: "CONTACT",
      title: "New Contact Message",
      data,
      kind: "contact",
      name: data.name.trim(),
      mobileNumber: normalizedPhone,
      message: data.message.trim() || "Contact request submitted",
    };

    try {
      const created = await api<RepairNotification>("/notifications/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (created) {
        setNotifications((prev) => [created, ...prev]);
      }
      return true;
    } catch (err) {
      console.error("failed to post contact notification", err);
      return false;
    }
  };

  const markNotificationReplied = async (id: string) => {
    try {
      await api(`/admin/notifications/${id}/replied`, {
        method: "PATCH",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, replied: true } : n)),
      );
    } catch (err) {
      console.error("failed to mark replied", err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api(`/admin/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("failed to delete notification", err);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <RepairBookingContext.Provider
      value={{
        isOpen,
        openModal,
        closeModal,
        formData,
        updateFormData,
        resetForm,
        brands,
        modelsByBrand,
        loadingBrands,
        handleBrandChange,
        handleIssueToggle,
        isFormValid,
        notifications,
        addNotification,
        addOrderNotification,
        addContactNotification,
        markNotificationReplied,
        deleteNotification,
        clearNotifications,
      }}
    >
      {children}
    </RepairBookingContext.Provider>
  );
}

export function useRepairBooking() {
  const context = useContext(RepairBookingContext);
  if (context === undefined) {
    throw new Error(
      "useRepairBooking must be used within a RepairBookingProvider",
    );
  }
  return context;
}
