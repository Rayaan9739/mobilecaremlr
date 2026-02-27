import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Cross-tab sync event name
const SYNC_EVENT_NAME = "mc-data-sync";

export interface HeroSettings {
  tagline: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  backgroundImage: string;
}

export interface GalleryImage {
  id: number;
  url: string;
  alt: string;
}

export interface Offer {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  tagline: string;
  image: string;
  endDate: string; // YYYY-MM-DD
  products: { productId: string; offerPrice: number }[];
}

export interface Service {
  id: number;
  title: string;
  description: string;
  price: string;
  duration: string;
  icon: string;
}

export interface Phone {
  id: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  discount?: number | null;
  image: string;
  rating?: number;
}

interface AdminContextType {
  heroSettings: HeroSettings;
  galleryImages: GalleryImage[];
  offers: Offer[];
  services: Service[];
  newPhones: Phone[];
  usedPhones: Phone[];
  updateHeroSettings: (settings: Partial<HeroSettings>) => void;
  addGalleryImage: (image: Omit<GalleryImage, "id">) => void;
  updateGalleryImage: (id: number, image: Partial<GalleryImage>) => void;
  removeGalleryImage: (id: number) => void;
  addOffer: (offer: Omit<Offer, "id">) => void;
  updateOffer: (id: number, offer: Partial<Offer>) => void;
  removeOffer: (id: number) => void;
  addService: (service: Omit<Service, "id">) => void;
  updateService: (id: number, service: Partial<Service>) => void;
  removeService: (id: number) => void;
  addPhone: (type: "new" | "used", phone: Omit<Phone, "id">) => void;
  updatePhone: (
    type: "new" | "used",
    id: number,
    phone: Partial<Phone>,
  ) => void;
  removePhone: (type: "new" | "used", id: number) => void;
}

const defaultHeroSettings: HeroSettings = {
  tagline: "Get best mobile experience with us",
  title: "Premium Mobiles &",
  titleHighlight: "Accessories",
  subtitle: "Upgrade Your Lifestyle Today",
  backgroundImage: "",
};

const defaultGalleryImages: GalleryImage[] = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400",
    alt: "Phone display 1",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?q=80&w=400",
    alt: "Phone display 2",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1556656793-08538906a9f8?q=80&w=400",
    alt: "Phone display 3",
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?q=80&w=400",
    alt: "Phone display 4",
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?q=80&w=400",
    alt: "Phone display 5",
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?q=80&w=400",
    alt: "Phone display 6",
  },
];

const defaultOffers: Offer[] = [
  {
    id: 1,
    title: "Cashback up to ₹10,000",
    subtitle: "Buy Now & Get",
    description: "On Smartphones",
    tagline: "End is No End",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=300&fit=crop",
    endDate: "2026-01-31",
    products: [],
  },
  {
    id: 2,
    title: "Cashback up to ₹4,000",
    subtitle: "Buy Now & Get",
    description: "On Realme Smartphones",
    tagline: "End is No End",
    image:
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=300&fit=crop",
    endDate: "2026-01-31",
    products: [],
  },
  {
    id: 3,
    title: "Cashback up to ₹3,000",
    subtitle: "Buy Now & Get",
    description: "On OnePlus Smartphones",
    tagline: "End is No End",
    image:
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&h=300&fit=crop",
    endDate: "2026-01-31",
    products: [],
  },
  {
    id: 4,
    title: "Benefits up to ₹5,000 + ₹6,000",
    subtitle: "Buy Now & Get",
    description: "On Apple Smartphones",
    tagline: "End is No End",
    image:
      "https://images.unsplash.com/photo-1632661674596-df8be59a8fb7?w=600&h=300&fit=crop",
    endDate: "2026-01-31",
    products: [],
  },
  {
    id: 5,
    title: "Cashback up to ₹3,000",
    subtitle: "Buy Now & Get",
    description: "On TV",
    tagline: "End is No End",
    image:
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=300&fit=crop",
    endDate: "2026-01-31",
    products: [],
  },
  {
    id: 6,
    title: "Benefits up to ₹17,000 + ₹17,000",
    subtitle: "Buy Now & Get",
    description: "On Samsung Smartwatches",
    tagline: "End is No End",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=300&fit=crop",
    endDate: "2026-01-31",
    products: [],
  },
];

const defaultServices: Service[] = [
  {
    id: 1,
    title: "Screen Replacement",
    description:
      "Cracked or broken screen? We replace screens for all major brands with OEM quality parts.",
    price: "Starting from ₹1,999",
    duration: "1-2 hours",
    icon: "monitor",
  },
  {
    id: 2,
    title: "Battery Replacement",
    description:
      "Phone not holding charge? Get a brand new battery with 6-month warranty.",
    price: "Starting from ₹999",
    duration: "30-45 mins",
    icon: "battery",
  },
  {
    id: 3,
    title: "Software & OS Repair",
    description:
      "Fix software issues, update OS, remove viruses, and optimize performance.",
    price: "Starting from ₹499",
    duration: "1-2 hours",
    icon: "wifi",
  },
  {
    id: 4,
    title: "Camera Repair",
    description:
      "Front or back camera issues? We repair and replace camera modules.",
    price: "Starting from ₹1,499",
    duration: "1-2 hours",
    icon: "camera",
  },
  {
    id: 5,
    title: "Speaker & Mic Fix",
    description: "Can't hear or be heard? We fix all audio-related issues.",
    price: "Starting from ₹799",
    duration: "45 mins - 1 hour",
    icon: "mic",
  },
  {
    id: 6,
    title: "Data Recovery",
    description:
      "Lost important data? Our experts can recover data from damaged devices.",
    price: "Starting from ₹1,999",
    duration: "2-24 hours",
    icon: "hard-drive",
  },
  {
    id: 7,
    title: "Water Damage Repair",
    description: "Phone fell in water? Quick treatment can save your device.",
    price: "Starting from ₹1,499",
    duration: "2-4 hours",
    icon: "smartphone",
  },
  {
    id: 8,
    title: "General Diagnostics",
    description:
      "Not sure what's wrong? We'll diagnose and provide a detailed report.",
    price: "Free",
    duration: "15-30 mins",
    icon: "wrench",
  },
];

const defaultNewPhones: Phone[] = [
  {
    id: 1,
    name: "iPhone 15 Pro Max",
    price: 159900,
    originalPrice: 169900,
    discount: 6,
    image:
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=500&fit=crop",
  },
  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra",
    price: 129999,
    originalPrice: 139999,
    discount: 7,
    image:
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=500&fit=crop",
  },
  {
    id: 3,
    name: "Google Pixel 8 Pro",
    price: 99999,
    originalPrice: 109999,
    discount: 9,
    image:
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=500&fit=crop",
  },
  {
    id: 4,
    name: "OnePlus 12",
    price: 69999,
    originalPrice: 74999,
    discount: 7,
    image:
      "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400&h=500&fit=crop",
  },
];

const defaultUsedPhones: Phone[] = [
  {
    id: 1,
    name: "iPhone 14 Pro",
    price: 89900,
    originalPrice: 119900,
    discount: 25,
    image:
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=500&fit=crop",
  },
  {
    id: 2,
    name: "Samsung Galaxy S23",
    price: 59999,
    originalPrice: 79999,
    discount: 25,
    image:
      "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=400&h=500&fit=crop",
  },
  {
    id: 3,
    name: "Google Pixel 7",
    price: 39999,
    originalPrice: 59999,
    discount: 33,
    image:
      "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&h=500&fit=crop",
  },
  {
    id: 4,
    name: "OnePlus 11",
    price: 44999,
    originalPrice: 64999,
    discount: 31,
    image:
      "https://images.unsplash.com/photo-1632661674596-df8be59a8fb7?w=400&h=500&fit=crop",
  },
];

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [heroSettings, setHeroSettings] = useState<HeroSettings>(() => {
    const stored = localStorage.getItem("admin_heroSettings");
    return stored ? JSON.parse(stored) : defaultHeroSettings;
  });

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(() => {
    const stored = localStorage.getItem("admin_galleryImages");
    return stored ? JSON.parse(stored) : defaultGalleryImages;
  });

  const [offers, setOffers] = useState<Offer[]>(() => {
    const stored = localStorage.getItem("admin_offers");
    return stored ? JSON.parse(stored) : defaultOffers;
  });

  const [services, setServices] = useState<Service[]>(() => {
    const stored = localStorage.getItem("admin_services");
    return stored ? JSON.parse(stored) : defaultServices;
  });

  const [newPhones, setNewPhones] = useState<Phone[]>(() => {
    const stored = localStorage.getItem("admin_newPhones");
    return stored ? JSON.parse(stored) : defaultNewPhones;
  });

  const [usedPhones, setUsedPhones] = useState<Phone[]>(() => {
    const stored = localStorage.getItem("admin_usedPhones");
    return stored ? JSON.parse(stored) : defaultUsedPhones;
  });

  useEffect(() => {
    localStorage.setItem("admin_heroSettings", JSON.stringify(heroSettings));
  }, [heroSettings]);

  useEffect(() => {
    localStorage.setItem("admin_galleryImages", JSON.stringify(galleryImages));
  }, [galleryImages]);

  useEffect(() => {
    localStorage.setItem("admin_offers", JSON.stringify(offers));
  }, [offers]);

  useEffect(() => {
    const toDateOnly = (value: string) => {
      if (!value) return null;
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return null;
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };

    const pruneExpiredOffers = () => {
      const today = new Date();
      const todayDateOnly = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );

      setOffers((prev) =>
        prev.filter((o) => {
          const end = toDateOnly(o.endDate);
          if (!end) return true;
          return end >= todayDateOnly;
        }),
      );
    };

    pruneExpiredOffers();
    const interval = setInterval(pruneExpiredOffers, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem("admin_services", JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem("admin_newPhones", JSON.stringify(newPhones));
  }, [newPhones]);

  useEffect(() => {
    localStorage.setItem("admin_usedPhones", JSON.stringify(usedPhones));
  }, [usedPhones]);

  // Cross-tab synchronization: listen for storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      
      // Sync hero settings
      if (e.key === "admin_heroSettings") {
        try {
          setHeroSettings(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to sync heroSettings:", err);
        }
      }
      // Sync gallery images
      if (e.key === "admin_galleryImages") {
        try {
          setGalleryImages(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to sync galleryImages:", err);
        }
      }
      // Sync offers
      if (e.key === "admin_offers") {
        try {
          setOffers(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to sync offers:", err);
        }
      }
      // Sync services
      if (e.key === "admin_services") {
        try {
          setServices(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to sync services:", err);
        }
      }
      // Sync new phones
      if (e.key === "admin_newPhones") {
        try {
          setNewPhones(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to sync newPhones:", err);
        }
      }
      // Sync used phones
      if (e.key === "admin_usedPhones") {
        try {
          setUsedPhones(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Failed to sync usedPhones:", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const updateHeroSettings = (settings: Partial<HeroSettings>) => {
    setHeroSettings((prev) => ({ ...prev, ...settings }));
  };

  const addGalleryImage = (image: Omit<GalleryImage, "id">) => {
    const newId = Math.max(...galleryImages.map((g) => g.id), 0) + 1;
    setGalleryImages([...galleryImages, { ...image, id: newId }]);
  };

  const updateGalleryImage = (id: number, image: Partial<GalleryImage>) => {
    setGalleryImages((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...image } : g)),
    );
  };

  const removeGalleryImage = (id: number) => {
    setGalleryImages((prev) => prev.filter((g) => g.id !== id));
  };

  const addOffer = (offer: Omit<Offer, "id">) => {
    const newId = Math.max(...offers.map((o) => o.id), 0) + 1;
    setOffers([...offers, { ...offer, id: newId }]);
  };

  const updateOffer = (id: number, offer: Partial<Offer>) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...offer } : o)),
    );
  };

  const removeOffer = (id: number) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };

  const addService = (service: Omit<Service, "id">) => {
    const newId = Math.max(...services.map((s) => s.id), 0) + 1;
    setServices([...services, { ...service, id: newId }]);
  };

  const updateService = (id: number, service: Partial<Service>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...service } : s)),
    );
  };

  const removeService = (id: number) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const addPhone = (type: "new" | "used", phone: Omit<Phone, "id">) => {
    const setter = type === "new" ? setNewPhones : setUsedPhones;
    const phones = type === "new" ? newPhones : usedPhones;
    const newId = Math.max(...phones.map((p) => p.id), 0) + 1;
    setter([...phones, { ...phone, id: newId }]);
  };

  const updatePhone = (
    type: "new" | "used",
    id: number,
    phone: Partial<Phone>,
  ) => {
    const setter = type === "new" ? setNewPhones : setUsedPhones;
    setter((prev) => prev.map((p) => (p.id === id ? { ...p, ...phone } : p)));
  };

  const removePhone = (type: "new" | "used", id: number) => {
    const setter = type === "new" ? setNewPhones : setUsedPhones;
    setter((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <AdminContext.Provider
      value={{
        heroSettings,
        galleryImages,
        offers,
        services,
        updateHeroSettings,
        addGalleryImage,
        updateGalleryImage,
        removeGalleryImage,
        addOffer,
        updateOffer,
        removeOffer,
        addService,
        updateService,
        removeService,
        newPhones,
        usedPhones,
        addPhone,
        updatePhone,
        removePhone,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}
