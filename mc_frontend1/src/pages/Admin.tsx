import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ProductVariantForm } from "@/components/ProductVariantForm";
import { BannerHeroManager, DealsManager, PopupManager } from "@/components/AdminManagers";
import AdminAddProduct from "./AdminAddProduct";
import {
  useAdmin,
  Phone,
  GalleryImage,
  Offer,
  Service,
  Technician,
} from "@/contexts/AdminContext";
import { useProducts, ProductProvider } from "@/contexts/ProductContext";
import api from "@/lib/api";
import { invalidateCategoryCache } from "@/utils/imageSync";
import {
  Plus,
  Pencil,
  Trash2,
  Smartphone,
  Image as ImageIcon,
  Settings,
  Images,
  Tag,
  Wrench,
  Package,
  Search,
  Users as UsersIcon,
  Star,
  ChevronDown,
  Menu,
  PanelLeftClose,
  Flame,
  Megaphone,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

// Product type definition
type AdminProduct = {
  id: string;
  familyId?: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  status: "In Stock" | "Out of Stock";
  image: string;
  highlights: string[] | Record<string, string>;
  colors?: {
    name: string;
    hex?: string;
    image?: string;
    images?: string[];
  }[];
  colorVariants: {
    name: string;
    hex?: string;
    image?: string;
    images?: string[];
  }[];
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  isNewArrival?: boolean;
  isWeeklyTrending?: boolean;
  isUsed?: boolean;
  description?: string;
  images: string[];
  rating?: number;
  ratingsCount?: number;
  reviewsCount?: number;
  specs?: Record<string, unknown>;
  colorName?: string;
  colorHex?: string;
  storageOption?: string;
};

type ProductFormData = Omit<AdminProduct, "id"> & {
  familyId?: string;
  colorName?: string;
  colorHex?: string;
  storageOption?: string;
};

type VariantColorDraft = {
  name: string;
  hex: string;
  dotImage: string;
  image: string;
  images: string[];
  modelUrl: string;
  inStock: boolean;
};

type StorageVariantDraft = {
  id: string;
  storage: string;
  price: string;
  originalPrice: string;
  stock: string;
  inStock: boolean;
  expanded: boolean;
  colors: VariantColorDraft[];
};

function ProductFormSectionTitle({ children }: Readonly<{ children: string }>) {
  return (
    <h3 className="rounded-lg border border-border/50 bg-card px-4 py-3 text-sm font-semibold text-foreground">
      {children}
    </h3>
  );
}

// Product Form Component
function ProductForm({
  product,
  onSubmit,
  onCancel,
  isUsedMode = false,
}: Readonly<{
  product?: AdminProduct;
  onSubmit: (data: ProductFormData | ProductFormData[]) => void;
  onCancel: () => void;
  isUsedMode?: boolean;
}>) {
  const { uploadImage, categories } = useProducts();
  // Default to "used-phone" if in used mode, otherwise product category or empty
  const [name, setName] = useState(product?.name || "");
  const [brand, setBrand] = useState(product?.brand || "");
  const [category, setCategory] = useState(
    product?.category || (isUsedMode ? "used-phone" : ""),
  );
  // ...
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [originalPrice, setOriginalPrice] = useState(
    product?.originalPrice?.toString() || "",
  );
  const [discount, setDiscount] = useState(product?.discount?.toString() || "");
  const [rating, setRating] = useState(product?.rating?.toString() || "");
  const [ratingsCount, setRatingsCount] = useState(
    product?.ratingsCount?.toString() || "",
  );
  const [reviewsCount, setReviewsCount] = useState(
    product?.reviewsCount?.toString() || "",
  );
  const [stock, setStock] = useState(product?.stock?.toString() || "");

  // Initialize 4 image slots
  const [imageSlots, setImageSlots] = useState<
    { url: string; enabled: boolean }[]
  >(() => {
    const slots = new Array(4)
      .fill(null)
      .map(() => ({ url: "", enabled: false }));

    // Fill slots from existing product images
    if (product) {
      const existingImages =
        product.images || (product.image ? [product.image] : []);
      existingImages.slice(0, 4).forEach((url, i) => {
        slots[i] = { url, enabled: true };
      });
      // Ensure at least the first slot is enabled if it's a new product or no images exist
    } else {
      slots[0].enabled = true;
    }
    return slots;
  });

  const [description, setDescription] = useState(product?.description || "");
  // Highlights can be either legacy string[] (for older products) or a keyed object for MOBILE details
  const [highlights, setHighlights] = useState<string[]>(
    Array.isArray(product?.highlights) ? product?.highlights : [],
  );

  // Mobile-specific highlights stored as a controlled object
  const mobileKeyMap: Record<string, string> = {
    "Processor details": "processor",
    "Rear Camera specs": "rearCamera",
    "Front Camera": "frontCamera",
    "Display type & size": "display",
    "Battery capacity": "battery",
  };

  const defaultMobileHighlights = {
    processor: "",
    rearCamera: "",
    frontCamera: "",
    display: "",
    battery: "",
  };

  const [mobileHighlights, setMobileHighlights] = useState<
    Record<string, string>
  >(() => {
    if (
      product?.highlights &&
      typeof product.highlights === "object" &&
      !Array.isArray(product.highlights)
    ) {
      return { ...defaultMobileHighlights, ...product.highlights };
    }
    return { ...defaultMobileHighlights };
  });

  const [mobileChecked, setMobileChecked] = useState<Record<string, boolean>>(
    () => {
      const init: Record<string, boolean> = {
        processor: false,
        rearCamera: false,
        frontCamera: false,
        display: false,
        battery: false,
      };

      if (product?.highlights) {
        if (Array.isArray(product.highlights)) {
          // legacy array contains titles
          product.highlights.forEach((h) => {
            const key = mobileKeyMap[h];
            if (key) init[key] = true;
          });
        } else if (typeof product.highlights === "object") {
          Object.entries(product.highlights).forEach(([k, v]) => {
            if (v) init[k] = true;
          });
        }
      }

      return init;
    },
  );

  const [colorVariants, setColorVariants] = useState<
    { name: string; hex: string; dotImage: string; image: string }[]
  >(product?.colorVariants || []);
  const [isBestSeller, setIsBestSeller] = useState(
    product?.isBestSeller || false,
  );
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured || false);
  const [isNew, setIsNew] = useState(product?.isNew || false);
  const [isWeeklyTrending, setIsWeeklyTrending] = useState(
    product?.isWeeklyTrending || false,
  );
  const [isUsed] = useState(product?.isUsed || false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<
    Record<number, boolean>
  >({});
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});
  const [storageVariants, setStorageVariants] = useState<StorageVariantDraft[]>(
    [],
  );
  const [variantDraft, setVariantDraft] = useState<StorageVariantDraft>({
    id: "",
    storage: "",
    price: "",
    originalPrice: "",
    stock: "1",
    inStock: true,
    expanded: true,
    colors: [
      {
        name: "",
        hex: "#000000",
        image: "",
        images: [],
        modelUrl: "",
        inStock: true,
      },
    ],
  });

  const brands = [
    "Samsung",
    "Apple",
    "Xiaomi",
    "Realme",
    "OnePlus",
    "Vivo",
    "Oppo",
    "Google",
    "Sony",
    "Anker",
    "Mi",
    "Nillkin",
    "Spigen",
    "SanDisk",
    "JBL",
    "Boat",
    "Noise",
    "Nothing",
    "Motorola",
    "Nokia",
  ];

  const categoryHighlights = {
    MOBILE: [
      "Processor details",
      "Rear Camera specs",
      "Front Camera",
      "Display type & size",
      "Battery capacity",
    ],
    USED_PHONE: [
      "Condition (Grade A/B/C)",
      "Battery Health %",
      "Scratches/Dents details",
      "Warranty period",
      "Box/Accessories included",
    ],
    CHARGERS: [
      "Power Delivery (25W/45W)",
      "Fast Charging support",
      "Warranty information",
      "Box required for warranty",
    ],
    HEADPHONES: [
      "Driver size",
      "Noise cancellation",
      "Battery backup",
      "Connectivity (Wired/Wireless/Bluetooth)",
    ],
    SPEAKERS: [
      "Driver size",
      "Noise cancellation",
      "Battery backup",
      "Connectivity (Wired/Wireless/Bluetooth)",
    ],
    ACCESSORIES: [
      "Compatibility",
      "Material quality",
      "Warranty period",
      "Installation required",
    ],
    STORAGE: [
      "Storage capacity",
      "Transfer speed",
      "Compatibility",
      "Warranty period",
    ],
    CABLES: [
      "Cable length",
      "Charging speed",
      "Data transfer rate",
      "Compatibility",
    ],
    CAMERA: [
      "Resolution",
      "Lens quality",
      "Battery backup",
      "Storage capacity",
    ],
    SMART_WATCH: [
      "Display type & size",
      "Battery backup",
      "Health features",
      "Connectivity",
    ],
    GAMING: [
      "Performance specs",
      "Compatibility",
      "Build quality",
      "Warranty period",
    ],
    ADAPTOR: [
      "Port type (Input/Output)",
      "Compatibility",
      "Material",
      "Warranty",
    ],
  };

  const availableHighlights =
    categoryHighlights[category as keyof typeof categoryHighlights] || [];

  const handleOriginalPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOriginalPrice(val);
    if (val && discount) {
      const op = parseFloat(val);
      const d = parseFloat(discount);
      if (!isNaN(op) && !isNaN(d)) {
        setPrice(Math.round(op - (op * d) / 100).toString());
      }
    }
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDiscount(val);
    if (val && originalPrice) {
      const op = parseFloat(originalPrice);
      const d = parseFloat(val);
      if (!isNaN(op) && !isNaN(d)) {
        setPrice(Math.round(op - (op * d) / 100).toString());
      }
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPrice(val);
    if (val && originalPrice) {
      const op = parseFloat(originalPrice);
      const p = parseFloat(val);
      if (!isNaN(op) && !isNaN(p) && op > 0) {
        setDiscount((((op - p) / op) * 100).toFixed(2));
      }
    }
  };

  const handleHighlightChange = (highlight: string, checked: boolean) => {
    if (checked) {
      setHighlights((prev) => [...prev, highlight]);
    } else {
      setHighlights((prev) => prev.filter((h) => h !== highlight));
    }
  };

  const addColorVariant = () => {
    setColorVariants((prev) => [
      ...prev,
      { name: "", hex: "#000000", image: "" },
    ]);
  };

  const updateColorVariant = (index: number, field: string, value: string) => {
    setColorVariants((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant,
      ),
    );
  };

  const removeColorVariant = (index: number) => {
    if (product) {
      if (!confirm("Are you sure you want to delete this color variant?")) return;
    }
    setColorVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const buildVariantFamilyId = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `family-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const getBaseProduct = (): ProductFormData => ({
    name,
    brand,
    category,
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : undefined,
    discount: discount ? Number(discount) : undefined,
    rating: rating ? Number(rating) : undefined,
    ratingsCount: ratingsCount ? Number(ratingsCount) : undefined,
    reviewsCount: reviewsCount ? Number(reviewsCount) : undefined,
    stock: Number(stock),
    status: Number(stock) > 0 ? "In Stock" : "Out of Stock",
    image: imageSlots.filter((slot) => slot.enabled && slot.url.trim() !== "")[0]?.url || "",
    images: imageSlots
      .filter((slot) => slot.enabled && slot.url.trim() !== "")
      .map((slot) => slot.url),
    description,
    highlights: category === "MOBILE" ? mobileHighlights : highlights,
    colors: product?.colors || product?.colorVariants || [],
    colorVariants:
      colorVariants.filter((v) => v.name?.trim?.() !== "").length > 0
        ? colorVariants.filter((v) => v.name?.trim?.() !== "")
        : product?.colorVariants || [],
    isBestSeller,
    isFeatured,
    isNew,
    isNewArrival: product?.isNewArrival || isNew,
    isWeeklyTrending,
    isUsed,
  });

  const buildVariantPayload = (
    color: VariantColorDraft,
    storage?: StorageVariantDraft,
    familyId?: string,
  ): ProductFormData => {
    const baseProduct = getBaseProduct();

    const fallbackImages = imageSlots
      .filter((slot) => slot.enabled && slot.url.trim() !== "")
      .map((slot) => slot.url);
    const variantImages =
      (color.images || []).filter((img) => img?.trim()) ||
      (color.image?.trim() ? [color.image.trim()] : []);

    const resolvedImages =
      variantImages.length > 0
        ? variantImages
        : fallbackImages.length > 0
          ? fallbackImages
          : [];

    const variantPrice = storage ? Number(storage.price) : Number(price);
    const variantOriginalPrice = storage?.originalPrice
      ? Number(storage.originalPrice)
      : originalPrice
        ? Number(originalPrice)
        : undefined;
    const variantDiscount =
      storage?.originalPrice && Number(storage.originalPrice) > 0
        ? Number(
            (
              ((Number(storage.originalPrice) - Number(storage.price)) /
                Number(storage.originalPrice)) *
              100
            ).toFixed(2),
          )
        : discount
          ? Number(discount)
          : undefined;

    const variantStock = storage
      ? storage.inStock
        ? Number(storage.stock)
        : 0
      : Number(stock);

    return {
      ...baseProduct,
      familyId,
      name: storage
        ? `${name} (${color.name.trim()}, ${storage.storage.trim()})`
        : `${name} (${color.name.trim()})`,
      price: variantPrice,
      originalPrice: variantOriginalPrice,
      discount: variantDiscount,
      stock: variantStock,
      status: variantStock > 0 ? "In Stock" : "Out of Stock",
      image: resolvedImages[0] || "",
      images: resolvedImages,
      colors: [
        {
          name: color.name.trim(),
          hex: color.hex || "#000000",
          dotImage: color.dotImage || color.image || "",
          image: resolvedImages[0] || "",
          images: resolvedImages,
        },
      ],
      colorVariants: [
        {
          name: color.name.trim(),
          hex: color.hex || "#000000",
          dotImage: color.dotImage || color.image || "",
          image: resolvedImages[0] || "",
          images: resolvedImages,
        },
      ],
      colorName: color.name.trim(),
      colorHex: color.hex || "#000000",
      storageOption: storage?.storage.trim() || undefined,
      specs: color.modelUrl ? { model3dUrl: color.modelUrl } : undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !brand || !category || !price || !stock) {
      toast.error("Name, brand, category, price, and stock are required");
      return;
    }

    if (isUploading) {
      toast.error("Please wait for image upload to complete");
      return;
    }

    const baseProduct = getBaseProduct();

    const filteredColors = colorVariants
      .filter((variant) => variant.name?.trim())
      .map((variant) => ({
        name: variant.name.trim(),
        hex: variant.hex || "#000000",
        image: variant.image || "",
        images: variant.image ? [variant.image] : [],
      }));

    const hasStorageVariants = storageVariants.length > 0;
    const shouldCreateFamily = hasStorageVariants || filteredColors.length > 1;
    const familyId = shouldCreateFamily ? buildVariantFamilyId() : undefined;

    if (hasStorageVariants) {
      const variantProducts = storageVariants.flatMap((variant) =>
        variant.colors.map((color) =>
          buildVariantPayload(color, variant, familyId),
        ),
      );

      if (variantProducts.length === 0) {
        toast.error("Add at least one valid color and storage variant");
        return;
      }

      onSubmit(variantProducts);
      return;
    }

    if (filteredColors.length > 0) {
      const variantProducts = filteredColors.map((color) =>
        buildVariantPayload(color, undefined, familyId),
      );
      onSubmit(variantProducts);
      return;
    }

    onSubmit(baseProduct);
  };

  const handleImageUpload = async (file: File, index: number) => {
    try {
      setIsUploading(true);
      setImageLoading((prev) => ({ ...prev, [index]: true }));
      const url = await uploadImage(file);
      const newSlots = [...imageSlots];
      newSlots[index].url = url;
      setImageSlots(newSlots);
      // Reset error state on new upload
      setImageLoadErrors((prev) => ({ ...prev, [index]: false }));
      toast.success(`Image ${index + 1} uploaded successfully`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Image upload failed",
      );
    } finally {
      setIsUploading(false);
      setImageLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const updateImageUrl = (index: number, url: string) => {
    const newSlots = [...imageSlots];
    newSlots[index].url = url;
    setImageSlots(newSlots);
    // Reset error state when URL changes
    setImageLoadErrors((prev) => ({ ...prev, [index]: false }));
  };

  const toggleImageSlot = (index: number, enabled: boolean) => {
    const newSlots = [...imageSlots];
    newSlots[index].enabled = enabled;
    setImageSlots(newSlots);
  };

  const clearImageSlot = (index: number) => {
    const newSlots = [...imageSlots];
    if (product && newSlots[index]?.url) {
      if (!confirm("Are you sure you want to remove this image?")) return;
    }
    newSlots[index].url = "";
    setImageSlots(newSlots);
    // Also clear the file input if possible (though we don't have a ref, resetting URL is the main part)
  };

  const resetVariantDraft = () => {
    setVariantDraft({
      id: "",
      storage: "",
      price: "",
      originalPrice: "",
      stock: "1",
      inStock: true,
      expanded: true,
      colors: [
        {
          name: "",
          hex: "#000000",
          dotImage: "",
          image: "",
          images: [],
          modelUrl: "",
          inStock: true,
        },
      ],
    });
  };

  const updateVariantDraft = (
    field: keyof Omit<StorageVariantDraft, "colors">,
    value: string | boolean,
  ) => {
    setVariantDraft((prev) => ({ ...prev, [field]: value }));
  };

  const updateVariantDraftColor = (
    index: number,
    field: keyof VariantColorDraft,
    value: string | boolean | string[],
  ) => {
    setVariantDraft((prev) => ({
      ...prev,
      colors: prev.colors.map((color, colorIndex) =>
        colorIndex === index ? { ...color, [field]: value } : color,
      ),
    }));
  };

  const addVariantDraftColor = () => {
    setVariantDraft((prev) => ({
      ...prev,
      colors: [
        ...prev.colors,
        {
          name: "",
          hex: "#000000",
          dotImage: "",
          image: "",
          images: [],
          modelUrl: "",
          inStock: true,
        },
      ],
    }));
  };

  const addColorToAllVariants = () => {
    const template = variantDraft.colors[0];
    if (!template.name.trim()) {
      toast.error("Enter a color name before adding it to all variants");
      return;
    }

    setStorageVariants((prev) =>
      prev.map((variant) => ({
        ...variant,
        colors: variant.colors.some(
          (color) =>
            color.name.trim().toLowerCase() ===
            template.name.trim().toLowerCase(),
        )
          ? variant.colors
          : [...variant.colors, { ...template }],
      })),
    );
  };

  const addStorageVariant = () => {
    if (!variantDraft.storage.trim() || !variantDraft.price.trim()) {
      toast.error("Storage capacity and selling price are required");
      return;
    }

    const validColors = variantDraft.colors.filter((color) =>
      color.name.trim(),
    );

    if (validColors.length === 0) {
      toast.error("Add at least one color for this variant");
      return;
    }

    setStorageVariants((prev) => [
      ...prev,
      {
        ...variantDraft,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        colors: validColors,
      },
    ]);
    resetVariantDraft();
  };

  const editStorageVariant = (variant: StorageVariantDraft) => {
    setVariantDraft({ ...variant, id: "" });
    setStorageVariants((prev) => prev.filter((item) => item.id !== variant.id));
  };

  const deleteStorageVariant = (id: string) => {
    if (product) {
      if (!confirm("Are you sure you want to delete this storage variant?")) return;
    }
    setStorageVariants((prev) => prev.filter((variant) => variant.id !== id));
  };

  const toggleStorageVariantExpanded = (id: string) => {
    setStorageVariants((prev) =>
      prev.map((variant) =>
        variant.id === id
          ? { ...variant, expanded: !variant.expanded }
          : variant,
      ),
    );
  };

  const uploadVariantColorImage = async (
    file: File,
    colorIndex: number,
  ) => {
    try {
      setIsUploading(true);
      const url = await uploadImage(file);
      setVariantDraft((prev) => ({
        ...prev,
        colors: prev.colors.map((color, index) =>
          index === colorIndex
            ? {
                ...color,
                image: color.image || url,
                images: [...color.images, url],
              }
            : color,
        ),
      }));
      toast.success("Variant image uploaded successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Image upload failed",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const uploadVariantColorDotImage = async (
    file: File,
    colorIndex: number,
  ) => {
    try {
      setIsUploading(true);
      const url = await uploadImage(file);
      setVariantDraft((prev) => ({
        ...prev,
        colors: prev.colors.map((color, index) =>
          index === colorIndex ? { ...color, dotImage: url } : color,
        ),
      }));
      toast.success("Color dot image uploaded successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Image upload failed",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-h-[80vh] overflow-y-auto"
    >
      <ProductFormSectionTitle>Basic Information</ProductFormSectionTitle>
      <div>
        <Label htmlFor="name">Product Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="iPhone 15 Pro"
        />
      </div>

      <div>
        <Label htmlFor="brand">Brand</Label>
        <Select value={brand} onValueChange={setBrand}>
          <SelectTrigger>
            <SelectValue placeholder="Select brand" />
          </SelectTrigger>
          <SelectContent>
            {brands.map((brandOption) => (
              <SelectItem key={brandOption} value={brandOption}>
                {brandOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Product description..."
        />
      </div>

      {!isUsedMode && (
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <ProductFormSectionTitle>Base Pricing (Optional)</ProductFormSectionTitle>
      <p className="text-xs text-muted-foreground">
        Use this for products without storage variants
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price (₹)</Label>
          <Input
            id="price"
            type="number"
            value={price}
            onChange={handlePriceChange}
            placeholder="99999"
          />
        </div>
        <div>
          <Label htmlFor="originalPrice">Original Price (₹)</Label>
          <Input
            id="originalPrice"
            type="number"
            value={originalPrice}
            onChange={handleOriginalPriceChange}
            placeholder="109999"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discount">Discount (%)</Label>
          <Input
            id="discount"
            type="number"
            value={discount}
            onChange={handleDiscountChange}
            placeholder="10"
          />
        </div>
        <div>
          <Label htmlFor="stock">Stock Quantity</Label>
          <Input
            id="stock"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="25"
          />
        </div>
      </div>

      <ProductFormSectionTitle>Card Descriptions</ProductFormSectionTitle>
      <div className="p-3 border rounded-lg bg-secondary/10">
        <Label htmlFor="description-card">Card Description</Label>
        <Textarea
          id="description-card"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short product details shown across product surfaces..."
        />
      </div>

      <ProductFormSectionTitle>Ratings Section</ProductFormSectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="rating">Rating</Label>
          <Input
            id="rating"
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="4.5"
          />
        </div>
        <div>
          <Label htmlFor="ratingsCount">Reviews Count</Label>
          <Input
            id="ratingsCount"
            type="number"
            min="0"
            value={ratingsCount}
            onChange={(e) => setRatingsCount(e.target.value)}
            placeholder="120"
          />
        </div>
        <div>
          <Label htmlFor="reviewsCount">Number of Reviews</Label>
          <Input
            id="reviewsCount"
            type="number"
            min="0"
            value={reviewsCount}
            onChange={(e) => setReviewsCount(e.target.value)}
            placeholder="42"
          />
        </div>
      </div>

      <ProductFormSectionTitle>Color Options</ProductFormSectionTitle>
      <div className="space-y-4">
        <Label>Product Images (Max 4)</Label>
        {imageSlots.map((slot, index) => (
          <div
            key={slot.url || index}
            className="p-3 border rounded-lg bg-secondary/10 space-y-3"
          >
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`enable-image-${index}`}
                checked={slot.enabled}
                onChange={(e) => toggleImageSlot(index, e.target.checked)}
                className="rounded border-2 w-4 h-4 cursor-pointer"
              />
              <Label
                htmlFor={`enable-image-${index}`}
                className="cursor-pointer"
              >
                Enable Image Slot {index + 1}
              </Label>
            </div>

            {slot.enabled && (
              <div className="space-y-2 pl-6 animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="flex gap-2">
                  <Input
                    id={`image-file-${index}`}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="flex-1"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // File validation: check for valid image types
                        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                        if (!validTypes.includes(file.type)) {
                          toast.error("Invalid file type. Please upload a JPEG, PNG, or WebP image.");
                          return;
                        }
                        // File size validation (max 10MB)
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error("File too large. Please upload an image under 10MB.");
                          return;
                        }
                        handleImageUpload(file, index);
                      }
                    }}
                    disabled={isUploading}
                  />
                  {slot.url && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => clearImageSlot(index)}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="Or enter image URL"
                  value={slot.url}
                  onChange={(e) => updateImageUrl(index, e.target.value)}
                  disabled={isUploading}
                />
                {!isUploading &&
                  slot.url &&
                  slot.url.includes("google.com/imgres") && (
                    <p className="text-[10px] text-destructive font-medium">
                      Note: Google search URLs may not work. Use "Copy Image
                      Address" for a direct link.
                    </p>
                  )}
                {isUploading && (
                  <p className="text-sm text-muted-foreground italic">
                    Uploading image...
                  </p>
                )}
                {slot.url && (
                  <div className="relative h-[140px] w-full max-w-[200px] rounded-lg overflow-hidden bg-gray-100 border shadow-sm">
                    <div className="absolute inset-0 flex items-center justify-center">
                      {imageLoading[index] ? (
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-2" />
                          <p className="text-xs text-muted-foreground">Loading preview...</p>
                        </div>
                      ) : imageLoadErrors[index] ? (
                        <div className="flex flex-col items-center justify-center p-4">
                          <ImageIcon className="w-8 h-8 text-muted-foreground opacity-30 mb-2" />
                          <p className="text-[10px] text-destructive text-center leading-tight">
                            Invalid Image Source
                            <br />
                            Click Clear & Check URL
                          </p>
                        </div>
                      ) : (
                        <img
                          src={slot.url}
                          alt={`Preview ${index + 1}`}
                          className="max-w-full max-h-full w-auto h-auto object-contain"
                          onLoad={() => setImageLoading((prev) => ({ ...prev, [index]: false }))}
                          onError={() => {
                            setImageLoading((prev) => ({ ...prev, [index]: false }));
                            setImageLoadErrors((prev) => ({
                              ...prev,
                              [index]: true,
                            }));
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Highlights Section */}
      {availableHighlights.length > 0 && (
        <div>
          <ProductFormSectionTitle>Product Highlights</ProductFormSectionTitle>
          <Label>Product Highlights (Category: {category})</Label>
          <div className="grid grid-cols-1 gap-2 mt-2 p-3 border rounded-lg bg-secondary/20">
            <p className="text-xs text-muted-foreground mb-2">
              Select applicable highlights for this {category.toLowerCase()}:
            </p>
            {availableHighlights.map((highlight) => {
              // For MOBILE category we show checkbox + conditional textarea (fully controlled)
              if (category?.toUpperCase() === "MOBILE") {
                const key = mobileKeyMap[highlight];
                const checked = Boolean(mobileChecked[key]);

                const placeholderMap: Record<string, string> = {
                  processor: "Enter processor details",
                  rearCamera: "Enter rear camera specifications",
                  frontCamera: "Enter front camera details",
                  display: "Enter display type and size",
                  battery: "Enter battery capacity",
                };

                return (
                  <div key={highlight} className="space-y-2 p-1 rounded">
                    <label className="flex items-center space-x-2 hover:bg-secondary/50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setMobileChecked((prev) => ({
                            ...prev,
                            [key]: isChecked,
                          }));

                          // when checked create empty value so textarea appears and is controlled
                          if (isChecked) {
                            setMobileHighlights((prev) => ({
                              ...prev,
                              [key]: prev[key] ?? "",
                            }));
                            // also ensure legacy array doesn't contain it (we will send object on submit for MOBILE)
                            setHighlights((prev) =>
                              prev.filter((h) => h !== highlight),
                            );
                          } else {
                            // clear corresponding value from state when unchecked
                            setMobileHighlights((prev) => ({
                              ...prev,
                              [key]: "",
                            }));
                          }
                        }}
                        className="rounded border-2 w-4 h-4"
                      />
                      <span className="text-sm">{highlight}</span>
                    </label>

                    {checked && (
                      <div className="pl-6 animate-in fade-in slide-in-from-left-2 duration-200">
                        <Textarea
                          placeholder={placeholderMap[key]}
                          value={mobileHighlights[key]}
                          onChange={(e) =>
                            setMobileHighlights((prev) => ({
                              ...prev,
                              [key]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              }

              // fallback: existing behavior for non-mobile categories (unchanged)
              return (
                <label
                  key={highlight}
                  className="flex items-center space-x-2 hover:bg-secondary/50 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={highlights.includes(highlight)}
                    onChange={(e) =>
                      handleHighlightChange(highlight, e.target.checked)
                    }
                    className="rounded border-2 w-4 h-4"
                  />
                  <span className="text-sm">{highlight}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Color Variants Section */}
      <div>
        <ProductFormSectionTitle>Storage Variants (Optional)</ProductFormSectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 border rounded-lg bg-secondary/10 mb-4">
          <div>
            <Label>Storage Capacity</Label>
            <Input
              value={variantDraft.storage}
              onChange={(e) => updateVariantDraft("storage", e.target.value)}
              placeholder="12GB+256GB"
            />
          </div>
          <div>
            <Label>Comparative Price</Label>
            <Input
              type="number"
              value={variantDraft.originalPrice}
              onChange={(e) =>
                updateVariantDraft("originalPrice", e.target.value)
              }
              placeholder="76999"
            />
          </div>
          <div>
            <Label>Selling Price</Label>
            <Input
              type="number"
              value={variantDraft.price}
              onChange={(e) => updateVariantDraft("price", e.target.value)}
              placeholder="72999"
            />
          </div>
          <label className="flex items-center gap-2 pt-6 text-sm">
            <input
              type="checkbox"
              checked={variantDraft.inStock}
              onChange={(e) => {
                updateVariantDraft("inStock", e.target.checked);
                if (!e.target.checked) updateVariantDraft("stock", "0");
                if (e.target.checked && variantDraft.stock === "0") {
                  updateVariantDraft("stock", "1");
                }
              }}
              className="rounded border-2 w-4 h-4"
            />
            In Stock
          </label>
          <div>
            <Label>Stock Quantity</Label>
            <Input
              type="number"
              value={variantDraft.stock}
              onChange={(e) => updateVariantDraft("stock", e.target.value)}
              placeholder="25"
            />
          </div>
        </div>
        <ProductFormSectionTitle>Color Options</ProductFormSectionTitle>
        <div className="space-y-3 mt-2">
          {variantDraft.colors.map((color, index) => (
            <div
              key={`${color.name || color.hex}-${index}`}
              className="space-y-3 p-3 border rounded-lg bg-secondary/20"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <Label>Color Name</Label>
                  <Input
                    placeholder="Sand Storm"
                    value={color.name}
                    onChange={(e) =>
                      updateVariantDraftColor(index, "name", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label>Swatch</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={color.hex}
                      onChange={(e) =>
                        updateVariantDraftColor(index, "hex", e.target.value)
                      }
                      className="w-12 h-10 p-1 rounded"
                    />
                    <span className="text-xs text-muted-foreground">
                      {color.hex}
                    </span>
                  </div>
                </div>
                <label className="flex items-center gap-2 pt-6 text-sm">
                  <input
                    type="checkbox"
                    checked={color.inStock}
                    onChange={(e) =>
                      updateVariantDraftColor(
                        index,
                        "inStock",
                        e.target.checked,
                      )
                    }
                    className="rounded border-2 w-4 h-4"
                  />
                  Color In Stock
                </label>
              </div>

              <div>
                <Label>Color Dot Image</Label>
                <div className="mt-2 flex items-center gap-3">
                  {color.dotImage ? (
                    <img
                      src={color.dotImage}
                      alt=""
                      className="h-14 w-14 rounded-full border object-cover"
                    />
                  ) : (
                    <span
                      className="h-14 w-14 rounded-full border"
                      style={{ backgroundColor: color.hex }}
                    />
                  )}
                  <Label className="cursor-pointer rounded-md border border-border px-3 py-2 text-sm">
                    Upload 1:1 Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadVariantColorDotImage(file, index);
                      }}
                      disabled={isUploading}
                    />
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                <Input
                  placeholder="Product image URL"
                  value={color.image}
                  onChange={(e) =>
                    updateVariantDraftColor(index, "image", e.target.value)
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!color.image.trim()) {
                      toast.error("Enter an image URL before adding it");
                      return;
                    }
                    updateVariantDraftColor(index, "images", [
                      ...color.images,
                      color.image.trim(),
                    ]);
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Image
                </Button>
              </div>

              <div>
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadVariantColorImage(file, index);
                  }}
                  disabled={isUploading}
                />
              </div>

              <Input
                placeholder="3D Model URL (optional)"
                value={color.modelUrl}
                onChange={(e) =>
                  updateVariantDraftColor(index, "modelUrl", e.target.value)
                }
              />

              {color.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {color.images.map((imageUrl, imageIndex) => (
                    <div
                      key={`${imageUrl}-${imageIndex}`}
                      className="h-14 w-14 overflow-hidden rounded border bg-background"
                    >
                      <img
                        src={imageUrl}
                        alt={color.name || "Variant"}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={addVariantDraftColor}>
              <Plus className="w-4 h-4 mr-1" /> Add Color (General)
            </Button>
            <Button type="button" variant="outline" onClick={addColorToAllVariants}>
              <Plus className="w-4 h-4 mr-1" /> Add Color To All Variants
            </Button>
            <Button type="button" className="btn-gradient" onClick={addStorageVariant}>
              <Plus className="w-4 h-4 mr-1" /> Add Variant
            </Button>
          </div>
        </div>
      </div>

      {/* Product Flags Section */}
      <div>
        <ProductFormSectionTitle>Product Status</ProductFormSectionTitle>
        <Label>Product Flags</Label>
        <div className="grid grid-cols-1 gap-3 mt-2 p-3 border rounded-lg bg-secondary/20">
          <label className="flex items-center space-x-2 hover:bg-secondary/50 p-1 rounded">
            <input
              type="checkbox"
              checked={isBestSeller}
              onChange={(e) => setIsBestSeller(e.target.checked)}
              className="rounded border-2 w-4 h-4"
            />
            <span className="text-sm">Best Seller / Most Popular</span>
          </label>
          <label className="flex items-center space-x-2 hover:bg-secondary/50 p-1 rounded">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded border-2 w-4 h-4"
            />
            <span className="text-sm">Featured Product</span>
          </label>
          <label className="flex items-center space-x-2 hover:bg-secondary/50 p-1 rounded">
            <input
              type="checkbox"
              checked={Number(stock || 0) === 0}
              onChange={(e) => {
                if (e.target.checked) setStock("0");
                if (!e.target.checked && Number(stock || 0) === 0) setStock("1");
              }}
              className="rounded border-2 w-4 h-4"
            />
            <span className="text-sm">Out Of Stock</span>
          </label>
          <label className="flex items-center space-x-2 hover:bg-secondary/50 p-1 rounded">
            <input
              type="checkbox"
              checked={isNew}
              onChange={(e) => setIsNew(e.target.checked)}
              className="rounded border-2 w-4 h-4"
            />
            <span className="text-sm">New Arrival</span>
          </label>
          <label className="flex items-center space-x-2 hover:bg-secondary/50 p-1 rounded">
            <input
              type="checkbox"
              checked={isWeeklyTrending}
              onChange={(e) => setIsWeeklyTrending(e.target.checked)}
              className="rounded border-2 w-4 h-4"
            />
            <span className="text-sm">Weekly Trending</span>
          </label>
        </div>
      </div>

      <div>
        <ProductFormSectionTitle>Added Variants</ProductFormSectionTitle>
        {storageVariants.length === 0 ? (
          <p className="p-3 border rounded-lg bg-secondary/10 text-xs text-muted-foreground">
            No storage variants added. Saving now will create one standard
            product using the base pricing fields.
          </p>
        ) : (
          <div className="space-y-3">
            {storageVariants.map((variant) => (
              <div
                key={variant.id}
                className="p-3 border rounded-lg bg-secondary/10 space-y-3"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Storage Name</p>
                    <p className="font-medium text-foreground">
                      {variant.storage}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-medium text-foreground">
                      ₹{Number(variant.price || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Old Price</p>
                    <p className="font-medium text-foreground">
                      {variant.originalPrice
                        ? `₹${Number(variant.originalPrice).toLocaleString(
                            "en-IN",
                          )}`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Stock Status</p>
                    <p className="font-medium text-foreground">
                      {variant.inStock && Number(variant.stock || 0) > 0
                        ? "In Stock"
                        : "Out Of Stock"}
                    </p>
                  </div>
                </div>
                {variant.expanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {variant.colors.map((color) => (
                      <div
                        key={`${variant.id}-${color.name}`}
                        className="flex items-center gap-2 rounded border bg-background p-2 text-xs"
                      >
                        <div
                          className="h-5 w-5 rounded border"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="font-medium">{color.name}</span>
                        <span className="text-muted-foreground">
                          {color.inStock ? "In Stock" : "Out Of Stock"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => editStorageVariant(variant)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => deleteStorageVariant(variant.id)}
                  >
                    Delete
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => toggleStorageVariantExpanded(variant.id)}
                  >
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Expand
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {false && (
        <div className="p-3 border rounded-lg bg-secondary/10 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Storage Name</p>
              <p className="font-medium text-foreground">Standard</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="font-medium text-foreground">
                ₹{Number(price || 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Old Price</p>
              <p className="font-medium text-foreground">
                {originalPrice
                  ? `₹${Number(originalPrice).toLocaleString("en-IN")}`
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stock Status</p>
              <p className="font-medium text-foreground">
                {Number(stock || 0) > 0 ? "In Stock" : "Out Of Stock"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => document.getElementById("price")?.focus()}
            >
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setPrice("");
                setOriginalPrice("");
                setDiscount("");
                setStock("");
              }}
            >
              Delete
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => document.getElementById("enable-image-0")?.focus()}
            >
              Expand
            </Button>
          </div>
        </div>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button type="submit" className="btn-gradient" disabled={isUploading}>
          {(() => {
            if (isUploading) return "Uploading...";
            if (product) return "Update";
            return "Add";
          })()}{" "}
          Product
        </Button>
      </div>
    </form>
  );
}

// Products Management Component
function ProductsManagement({
  defaultIsUsed = false,
}: Readonly<{ defaultIsUsed?: boolean }>) {
  const navigate = useNavigate();
  const fallbackProductImage =
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop";
  const { products, createProduct, updateProduct, deleteProduct, categories, uploadImage } =
    useProducts();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedStockStatus, setSelectedStockStatus] = useState("All");
  const [selectedFlag, setSelectedFlag] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  );

  // ... (keeping existing transform logic)

  const adminProducts: AdminProduct[] = products.map((p) => ({
    ...p,
    status: p.stock > 0 ? ("In Stock" as const) : ("Out of Stock" as const),
    image: p.images?.[0] || p.image || fallbackProductImage,
  }));
  const brandOptions = Array.from(
    new Set(adminProducts.map((product) => product.brand).filter(Boolean)),
  ).sort();

  const filteredProducts = adminProducts
    .filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      const matchesBrand =
        selectedBrand === "All" || product.brand === selectedBrand;
      const matchesStock =
        selectedStockStatus === "All" ||
        (selectedStockStatus === "in-stock" && product.stock > 0) ||
        (selectedStockStatus === "out-of-stock" && product.stock <= 0);
      const matchesFlag =
        selectedFlag === "All" ||
        (selectedFlag === "featured" && product.isFeatured) ||
        (selectedFlag === "weekly" && product.isWeeklyTrending) ||
        (selectedFlag === "new" && product.isNew);
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      // Filter by usage type based on tab (defaultIsUsed prop)
      // If defaultIsUsed is true (Used Phones tab), show only category === 'used-phone'
      // If defaultIsUsed is false (Products tab), show only category !== 'used-phone'
      const isUsedPhoneCategory = product.category === "used-phone";
      const matchesType = defaultIsUsed
        ? isUsedPhoneCategory
        : !isUsedPhoneCategory;

      return (
        matchesCategory &&
        matchesBrand &&
        matchesStock &&
        matchesFlag &&
        matchesSearch &&
        matchesType
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "stock":
          return b.stock - a.stock;
        case "newest":
        default:
          return Number(b.id) - Number(a.id);
      }
    });

  const handleUpdate = async (data: ProductFormData | ProductFormData[]) => {
    if (editingProduct) {
      try {
        const firstItem = Array.isArray(data) ? data[0] : data;
        // Merge updated fields into the existing product to avoid wiping untouched fields
        const merged = { ...editingProduct, ...firstItem, isUsed: defaultIsUsed };
        await updateProduct(editingProduct.id, merged as any);
        setEditingProduct(null);
        toast.success("Product updated successfully");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update product",
        );
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        toast.success("Product deleted successfully");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete product",
        );
      }
    }
  };

  const handleUpdateStock = async (id: string, stock: number) => {
    try {
      await updateProduct(id, { stock });
      toast.success("Stock updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update stock",
      );
    }
  };

  const toggleProductField = async (
    product: AdminProduct,
    field: "isFeatured" | "isWeeklyTrending" | "stock",
  ) => {
    try {
      const payload =
        field === "stock"
          ? { stock: product.stock > 0 ? 0 : 1 }
          : { [field]: !product[field] };
      await updateProduct(product.id, payload);
      toast.success("Product updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update product");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-foreground">
          Products Management
        </h2>

        <Button className="btn-gradient" onClick={() => navigate("/admin/add-product")}>
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory("All")}
          className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
            selectedCategory === "All"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border hover:border-primary text-foreground"
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.name)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              selectedCategory === category.name
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border hover:border-primary text-foreground"
            }`}
          >
            {category.displayName}
          </button>
        ))}
      </div>

      {/* Search and Sort */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search Product"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.name}>
                {category.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger>
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Brands</SelectItem>
            {brandOptions.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStockStatus} onValueChange={setSelectedStockStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Stock</SelectItem>
            <SelectItem value="in-stock">In Stock</SelectItem>
            <SelectItem value="out-of-stock">Out Of Stock</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedFlag} onValueChange={setSelectedFlag}>
          <SelectTrigger>
            <SelectValue placeholder="Flags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Flags</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="weekly">Weekly Trending</SelectItem>
            <SelectItem value="new">New Arrival</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="stock">Stock: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
        {filteredProducts.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group h-full"
          >
            <Card className="h-full overflow-hidden hover:shadow-elevated transition-all flex flex-col border border-border/50 bg-card rounded-md sm:rounded-xl">
              <div className="relative h-24 sm:h-40 bg-secondary/30 overflow-hidden flex items-center justify-center">
                <img
                  src={product.image?.trim() ? product.image : fallbackProductImage}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-1 right-1">
                  <Badge
                    variant={
                      product.status === "In Stock" ? "default" : "destructive"
                    }
                    className="text-[6px] sm:text-[10px] px-1 py-0 bg-black/60 backdrop-blur-sm border-none"
                  >
                    {product.status}
                  </Badge>
                </div>
                <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 sm:gap-2">
                  <Dialog
                    open={editingProduct?.id === product.id}
                    onOpenChange={(open) => !open && setEditingProduct(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7 sm:h-9 sm:w-9"
                        onClick={() => setEditingProduct(product)}
                      >
                        <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                        <DialogDescription>
                          Update the product information below.
                        </DialogDescription>
                      </DialogHeader>
                      <AdminAddProduct
                        editingProduct={product}
                        onCancel={() => setEditingProduct(null)}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7 sm:h-9 sm:w-9"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-1.5 sm:p-3 flex-1 flex flex-col justify-between space-y-1">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-foreground text-[9px] sm:text-xs line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  <p className="text-[7px] sm:text-[10px] text-muted-foreground uppercase tracking-tight">
                    {product.brand}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-1.5">
                    <span className="text-foreground font-black text-[10px] sm:text-sm">
                      ₹{product.price.toLocaleString()}
                    </span>
                    {product.discount &&
                      product.originalPrice &&
                      product.originalPrice > product.price && (
                        <span className="text-muted-foreground text-[7px] sm:text-[10px] line-through">
                          ₹
                          {Math.round(product.originalPrice).toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      )}
                  </div>
                  <div className="text-[7px] sm:text-[10px] text-muted-foreground font-medium">
                    Stock: {product.stock}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {product.rating ? (
                      <Badge className="text-[7px] sm:text-[10px]">
                        <Star className="w-3 h-3 mr-1" />
                        {product.rating}
                      </Badge>
                    ) : null}
                    {product.isFeatured ? <Badge className="text-[7px] sm:text-[10px]">Featured</Badge> : null}
                    {product.isWeeklyTrending ? <Badge className="text-[7px] sm:text-[10px]">Trending</Badge> : null}
                    {product.isNew ? <Badge className="text-[7px] sm:text-[10px]">New</Badge> : null}
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px]"
                      onClick={() => toggleProductField(product, "isFeatured")}
                    >
                      <Star className="w-3 h-3 mr-1" /> Featured
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px]"
                      onClick={() => toggleProductField(product, "isWeeklyTrending")}
                    >
                      <Flame className="w-3 h-3 mr-1" /> Weekly
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px]"
                      onClick={() => toggleProductField(product, "stock")}
                    >
                      <Package className="w-3 h-3 mr-1" /> Stock
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="h-7 text-[10px]"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border border-dashed">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground italic">No products found</p>
        </div>
      )}
    </div>
  );
}

function PhoneForm(
  props: Readonly<{
    phone?: Phone;
    onSubmit: (data: Omit<Phone, "id">) => void;
    onCancel: () => void;
  }>,
) {
  const { phone, onSubmit, onCancel } = props;
  const [name, setName] = useState(phone?.name || "");
  const [price, setPrice] = useState(phone?.price?.toString() || "");
  const [originalPrice, setOriginalPrice] = useState(
    phone?.originalPrice?.toString() || "",
  );
  const [discount, setDiscount] = useState(phone?.discount?.toString() || "");
  const [image, setImage] = useState(phone?.image || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      toast.error("Name and price are required");
      return;
    }
    onSubmit({
      name,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      discount: discount ? Number(discount) : null,
      image,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Phone Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="iPhone 15 Pro"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price (₹)</Label>
          <Input
            id="price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="99999"
          />
        </div>
        <div>
          <Label htmlFor="originalPrice">Original Price (₹)</Label>
          <Input
            id="originalPrice"
            type="number"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            placeholder="109999"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="discount">Discount (%)</Label>
        <Input
          id="discount"
          type="number"
          value={discount}
          onChange={(e) => setDiscount(e.target.value)}
          placeholder="10"
        />
      </div>
      <div>
        <Label htmlFor="image">Image URL</Label>
        <Input
          id="image"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://..."
        />
      </div>
      {image && (
        <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
          <img
            src={image}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="btn-gradient">
          {phone ? "Update" : "Add"} Phone
        </Button>
      </div>
    </form>
  );
}

// Phone List Component
function PhoneList(props: Readonly<{ type: "new" | "used" }>) {
  const { type } = props;
  const { newPhones, usedPhones, addPhone, updatePhone, removePhone } =
    useAdmin();
  const phones = type === "new" ? newPhones : usedPhones;
  const [editingPhone, setEditingPhone] = useState<Phone | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleAdd = (data: Omit<Phone, "id">) => {
    addPhone(type, data);
    setIsAddOpen(false);
    toast.success("Phone added successfully");
  };

  const handleUpdate = (data: Omit<Phone, "id">) => {
    if (editingPhone) {
      updatePhone(type, editingPhone.id, data);
      setEditingPhone(null);
      toast.success("Phone updated successfully");
    }
  };

  const handleDelete = (id: number) => {
    removePhone(type, id);
    toast.success("Phone removed successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground capitalize">
          {type} Phones
        </h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient">
              <Plus className="w-4 h-4 mr-2" /> Add Phone
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Phone</DialogTitle>
              <DialogDescription>
                Add a new phone to your inventory.
              </DialogDescription>
            </DialogHeader>
            <PhoneForm
              onSubmit={handleAdd}
              onCancel={() => setIsAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
        {phones.map((phone) => (
          <motion.div
            key={phone.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group h-full"
          >
            <Card className="h-full overflow-hidden hover:shadow-elevated transition-all flex flex-col border border-border/50 bg-card rounded-md sm:rounded-xl">
              <div className="relative h-24 sm:h-40 bg-secondary/30 overflow-hidden flex items-center justify-center">
                <img
                  src={phone.image}
                  alt={phone.name}
                  className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 sm:gap-2">
                  <Dialog
                    open={editingPhone?.id === phone.id}
                    onOpenChange={(open) => !open && setEditingPhone(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7 sm:h-9 sm:w-9"
                        onClick={() => setEditingPhone(phone)}
                      >
                        <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Phone</DialogTitle>
                        <DialogDescription>
                          Update the phone information below.
                        </DialogDescription>
                      </DialogHeader>
                      <PhoneForm
                        phone={phone}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingPhone(null)}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7 sm:h-9 sm:w-9"
                    onClick={() => handleDelete(phone.id)}
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-1.5 sm:p-3 flex-1 flex flex-col justify-between space-y-1">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-foreground text-[9px] sm:text-xs line-clamp-2 leading-tight">
                    {phone.name}
                  </h3>
                </div>
                <div className="space-y-0.5">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-1.5">
                    <span className="text-foreground font-black text-[10px] sm:text-sm">
                      ₹{phone.price.toLocaleString()}
                    </span>
                    {phone.discount &&
                      phone.originalPrice &&
                      phone.originalPrice > phone.price && (
                        <span className="text-muted-foreground text-[7px] sm:text-[10px] line-through">
                          ₹
                          {Math.round(phone.originalPrice).toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {phones.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border border-dashed">
          <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground italic">
            No {type} phones available
          </p>
        </div>
      )}
    </div>
  );
}

// Hero Settings Component
function HeroSettings() {
  const { heroSettings, updateHeroSettings, uploadImage } = useAdmin();
  const [tagline, setTagline] = useState(heroSettings.tagline);
  const [title, setTitle] = useState(heroSettings.title);
  const [titleHighlight, setTitleHighlight] = useState(
    heroSettings.titleHighlight,
  );
  const [subtitle, setSubtitle] = useState(heroSettings.subtitle);
  const [backgroundImage, setBackgroundImage] = useState(
    heroSettings.backgroundImage,
  );
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      // Store the file for upload to Cloudinary on save
      setBackgroundFile(file);
      // Show preview
      const previewUrl = URL.createObjectURL(file);
      setBackgroundImage(previewUrl);
      toast.success("Image selected. Click Save to upload to cloud.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Image selection failed",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    // If there's a new file, pass it to updateHeroSettings
    // Otherwise just pass the image URL
    if (backgroundFile) {
      await updateHeroSettings({
        tagline,
        title,
        titleHighlight,
        subtitle,
        backgroundImage: backgroundFile,
      });
    } else {
      updateHeroSettings({
        tagline,
        title,
        titleHighlight,
        subtitle,
        backgroundImage,
      });
    }
    toast.success("Hero settings updated successfully");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">
        Hero Section Settings
      </h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" /> Text Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Get best mobile experience with us"
            />
          </div>
          <div>
            <Label htmlFor="title">Main Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Premium Mobiles &"
            />
          </div>
          <div>
            <Label htmlFor="titleHighlight">
              Title Highlight (gradient text)
            </Label>
            <Input
              id="titleHighlight"
              value={titleHighlight}
              onChange={(e) => setTitleHighlight(e.target.value)}
              placeholder="Accessories"
            />
          </div>
          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Upgrade Your Lifestyle Today"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" /> Background Image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="backgroundImage">
              Image URL (leave empty to use default)
            </Label>
            <Input
              id="backgroundImage-file"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
              disabled={isUploading}
              className="mb-2"
            />
            <Textarea
              id="backgroundImage"
              value={backgroundImage}
              onChange={(e) => setBackgroundImage(e.target.value)}
              placeholder="Or enter image URL"
              className="resize-none"
              disabled={isUploading}
            />
          </div>
          {isUploading && (
            <p className="text-sm text-muted-foreground italic">
              Uploading image...
            </p>
          )}
          {backgroundImage && (
            <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
              <img
                src={backgroundImage}
                alt="Background Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="btn-gradient" disabled={isUploading}>
        {isUploading ? "Uploading..." : "Save Hero Settings"}
      </Button>
    </div>
  );
}

// Gallery Image Form Component
function GalleryImageForm(
  props: Readonly<{
    image?: GalleryImage;
    onSubmit: (data: Omit<GalleryImage, "id">) => void;
    onCancel: () => void;
  }>,
) {
  const { image, onSubmit, onCancel } = props;
  const { uploadImage } = useAdmin();
  const [url, setUrl] = useState(image?.url || "");
  const [alt, setAlt] = useState(image?.alt || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      // Store file for upload on submit
      setSelectedFile(file);
      // Show preview
      const previewUrl = URL.createObjectURL(file);
      setUrl(previewUrl);
      toast.success("Image selected. Click Save to upload to cloud.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Image selection failed",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error("Image is required");
      return;
    }
    // Pass the File object to trigger Cloudinary upload in context
    if (selectedFile) {
      onSubmit({ url: selectedFile, alt: alt || "Gallery image" });
    } else {
      onSubmit({ url, alt: alt || "Gallery image" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="url">Image URL</Label>
        <Input
          id="url-file"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
          disabled={isUploading}
          className="mb-2"
        />
        <Input
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Or enter image URL"
          disabled={isUploading}
        />
      </div>
      <div>
        <Label htmlFor="alt">Alt Text (Description)</Label>
        <Input
          id="alt"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Phone display in store"
        />
      </div>
      {isUploading && (
        <p className="text-sm text-muted-foreground italic">
          Uploading image...
        </p>
      )}
      {url && (
        <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
          <img src={url} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
          Cancel
        </Button>
        <Button type="submit" className="btn-gradient" disabled={isUploading}>
          {isUploading ? "Uploading..." : image ? "Update" : "Add"} Image
        </Button>
      </div>
    </form>
  );
}

// Gallery Settings Component
function GallerySettings() {
  const {
    galleryImages,
    addGalleryImage,
    updateGalleryImage,
    removeGalleryImage,
  } = useAdmin();
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleAdd = (data: Omit<GalleryImage, "id">) => {
    addGalleryImage(data);
    setIsAddOpen(false);
    toast.success("Image added successfully");
  };

  const handleUpdate = (data: Omit<GalleryImage, "id">) => {
    if (editingImage) {
      updateGalleryImage(editingImage.id, data);
      setEditingImage(null);
      toast.success("Image updated successfully");
    }
  };

  const handleDelete = (id: number) => {
    removeGalleryImage(id);
    toast.success("Image removed successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Gallery Images</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient">
              <Plus className="w-4 h-4 mr-2" /> Add Image
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Gallery Image</DialogTitle>
              <DialogDescription>
                Upload a new image to your gallery.
              </DialogDescription>
            </DialogHeader>
            <GalleryImageForm
              onSubmit={handleAdd}
              onCancel={() => setIsAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
        {galleryImages.map((image) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative h-full"
          >
            <Card className="h-full overflow-hidden flex flex-col border border-border/50">
              <div className="aspect-square relative bg-secondary/30 overflow-hidden">
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Dialog
                    open={editingImage?.id === image.id}
                    onOpenChange={(open) => !open && setEditingImage(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => setEditingImage(image)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Image</DialogTitle>
                        <DialogDescription>
                          Update the gallery image information.
                        </DialogDescription>
                      </DialogHeader>
                      <GalleryImageForm
                        image={image}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingImage(null)}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDelete(image.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-3 flex-1">
                <p className="text-sm text-muted-foreground truncate">
                  {image.alt}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {galleryImages.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border border-dashed">
          <Images className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground italic">
            No gallery images available
          </p>
        </div>
      )}
    </div>
  );
}

// Offer Form Component
function OfferForm(
  props: Readonly<{
    offer?: Offer;
    onSubmit: (data: Omit<Offer, "id">) => void;
    onCancel: () => void;
  }>,
) {
  const { offer, onSubmit, onCancel } = props;
  const { products: allProducts } = useProducts();
  const { uploadImage } = useAdmin();
  const [title, setTitle] = useState(offer?.title || "");
  const [subtitle, setSubtitle] = useState(offer?.subtitle || "Buy Now & Get");
  const [description, setDescription] = useState(offer?.description || "");
  const [tagline, setTagline] = useState(offer?.tagline || "End is No End");
  const [image, setImage] = useState(offer?.image || "");
  const [endDate, setEndDate] = useState(offer?.endDate || "");
  const [isUploading, setIsUploading] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, string>
  >(() => {
    const map: Record<string, string> = {};
    (offer?.products || []).forEach((p) => {
      map[p.productId] = String(p.offerPrice);
    });
    return map;
  });

  const filteredProducts = allProducts
    .filter((p) =>
      productQuery.trim()
        ? p.name.toLowerCase().includes(productQuery.trim().toLowerCase())
        : true,
    )
    .slice(0, 50);

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const url = await uploadImage(file);
      setImage(url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Image upload failed",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !image) {
      toast.error("Title and image are required");
      return;
    }

    const products = Object.entries(selectedProducts)
      .map(([productId, price]) => ({
        productId,
        offerPrice: Number(price),
      }))
      .filter((p) => p.productId && Number.isFinite(p.offerPrice) && p.offerPrice > 0);

    const missingPrice = Object.entries(selectedProducts).some(
      ([, price]) => !price || Number(price) <= 0,
    );
    if (missingPrice) {
      toast.error("Please enter offer price for selected products");
      return;
    }

    onSubmit({
      title,
      subtitle,
      description,
      tagline,
      image,
      endDate,
      products,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-h-[60vh] overflow-y-auto"
    >
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Cashback up to ₹10,000"
        />
      </div>
      <div>
        <Label htmlFor="subtitle">Subtitle</Label>
        <Input
          id="subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Buy Now & Get"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="On Smartphones"
        />
      </div>
      <div>
        <Label htmlFor="tagline">Tagline</Label>
        <Input
          id="tagline"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="End is No End"
        />
      </div>
      <div>
        <Label htmlFor="offer-image">Image URL</Label>
        <Input
          id="offer-image-file"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
          disabled={isUploading}
          className="mb-2"
        />
        <Input
          id="offer-image"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="Or enter image URL"
          disabled={isUploading}
        />
      </div>
      <div>
        <Label htmlFor="endDate">End Date</Label>
        <Input
          id="endDate"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="productQuery">Select Products</Label>
        <Input
          id="productQuery"
          value={productQuery}
          onChange={(e) => setProductQuery(e.target.value)}
          placeholder="Search products..."
        />
        <div className="mt-3 space-y-2 max-h-56 overflow-y-auto rounded-lg border border-border/60 bg-background p-3">
          {filteredProducts.length === 0 ? (
            <p className="text-xs text-muted-foreground">No products found.</p>
          ) : (
            filteredProducts.map((p) => {
              const checked = Object.prototype.hasOwnProperty.call(selectedProducts, String(p.id));
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const id = String(p.id);
                      setSelectedProducts((prev) => {
                        const next = { ...prev };
                        if (e.target.checked) next[id] = next[id] || "";
                        else delete next[id];
                        return next;
                      });
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      â‚¹{Number(p.price).toLocaleString("en-IN")}
                    </div>
                  </div>
                  {checked ? (
                    <Input
                      value={selectedProducts[String(p.id)] || ""}
                      onChange={(e) =>
                        setSelectedProducts((prev) => ({
                          ...prev,
                          [String(p.id)]: e.target.value.replace(/[^\d]/g, ""),
                        }))
                      }
                      placeholder="Offer price"
                      className="w-28"
                      inputMode="numeric"
                    />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
      {isUploading && (
        <p className="text-sm text-muted-foreground italic">
          Uploading image...
        </p>
      )}
      {image && (
        <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
          <img
            src={image}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
          Cancel
        </Button>
        <Button type="submit" className="btn-gradient" disabled={isUploading}>
          {isUploading ? "Uploading..." : offer ? "Update" : "Add"} Offer
        </Button>
      </div>
    </form>
  );
}

// Offers Settings Component
function OffersSettings() {
  const { offers, addOffer, updateOffer, removeOffer } = useAdmin();
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const fallbackOfferImage =
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=300&fit=crop";

  const handleAdd = (data: Omit<Offer, "id">) => {
    addOffer(data);
    setIsAddOpen(false);
    toast.success("Offer added successfully");
  };

  const handleUpdate = (data: Omit<Offer, "id">) => {
    if (editingOffer) {
      updateOffer(editingOffer.id, data);
      setEditingOffer(null);
      toast.success("Offer updated successfully");
    }
  };

  const handleDelete = (id: number) => {
    removeOffer(id);
    toast.success("Offer removed successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Offers</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient">
              <Plus className="w-4 h-4 mr-2" /> Add Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Offer</DialogTitle>
              <DialogDescription>
                Create a new promotional offer.
              </DialogDescription>
            </DialogHeader>
            <OfferForm
              onSubmit={handleAdd}
              onCancel={() => setIsAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
        {offers.map((offer) => (
          <motion.div
            key={offer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group h-full"
          >
            <Card className="h-full overflow-hidden flex flex-col border border-border/50">
              <div className="aspect-video relative bg-secondary/30 overflow-hidden">
                <img
                  src={offer.image?.trim() ? offer.image : fallbackOfferImage}
                  alt={offer.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Dialog
                    open={editingOffer?.id === offer.id}
                    onOpenChange={(open) => !open && setEditingOffer(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => setEditingOffer(offer)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Offer</DialogTitle>
                        <DialogDescription>
                          Update the offer information.
                        </DialogDescription>
                      </DialogHeader>
                      <OfferForm
                        offer={offer}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingOffer(null)}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDelete(offer.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-foreground truncate">
                  {offer.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {offer.tagline}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Valid: {offer.endDate}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {offers.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border border-dashed">
          <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground italic">
            No active offers available
          </p>
        </div>
      )}
    </div>
  );
}

// Technician Form Component
function TechnicianForm(
  props: Readonly<{
    technician?: Technician;
    onSubmit: (data: Omit<Technician, "id">) => void;
    onCancel: () => void;
  }>,
) {
  const { technician, onSubmit, onCancel } = props;
  const { uploadImage } = useProducts();
  const [name, setName] = useState(technician?.name || "");
  const [role, setRole] = useState(technician?.role || "");
  const [image, setImage] = useState(technician?.image || "");
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const url = await uploadImage(file);
      setImage(url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Image upload failed",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !image) {
      toast.error("Name, role, and image are required");
      return;
    }
    onSubmit({
      name,
      role,
      image,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Technician Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rajesh Kumar"
        />
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <Input
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Senior Technician"
        />
      </div>
      <div>
        <Label htmlFor="image">Pic</Label>
        <Input
          id="image-file"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
          disabled={isUploading}
        />
        <Input
          id="image"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="Or enter image URL"
          className="mt-2"
          disabled={isUploading}
        />
      </div>
      {image && (
        <div className="aspect-square w-32 rounded-lg overflow-hidden bg-secondary">
          <img
            src={image}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
          Cancel
        </Button>
        <Button type="submit" className="btn-gradient" disabled={isUploading}>
          {isUploading ? "Uploading..." : technician ? "Update" : "Add"} Technician
        </Button>
      </div>
    </form>
  );
}

// Technicians Management Component
function TechniciansManagement() {
  const { technicians, addTechnician, updateTechnician, removeTechnician } = useAdmin();
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleAdd = (data: Omit<Technician, "id">) => {
    addTechnician(data);
    setIsAddOpen(false);
    toast.success("Technician added successfully");
  };

  const handleUpdate = (data: Omit<Technician, "id">) => {
    if (editingTechnician) {
      updateTechnician(editingTechnician.id, data);
      setEditingTechnician(null);
      toast.success("Technician updated successfully");
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to remove this technician?")) {
      removeTechnician(id);
      toast.success("Technician removed successfully");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Technicians</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient">
              <Plus className="w-4 h-4 mr-2" /> Add Technician
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Technician</DialogTitle>
              <DialogDescription>
                Add a new team member to your technicians list.
              </DialogDescription>
            </DialogHeader>
            <TechnicianForm
              onSubmit={handleAdd}
              onCancel={() => setIsAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {technicians.map((tech) => (
          <motion.div
            key={tech.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group h-full"
          >
            <Card className="h-full overflow-hidden hover:shadow-elevated transition-all flex flex-col border border-border/50">
              <div className="relative h-48 bg-secondary/30 overflow-hidden">
                <img
                  src={tech.image}
                  alt={tech.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Dialog
                    open={editingTechnician?.id === tech.id}
                    onOpenChange={(open) => !open && setEditingTechnician(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => setEditingTechnician(tech)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Technician</DialogTitle>
                        <DialogDescription>
                          Update the technician information.
                        </DialogDescription>
                      </DialogHeader>
                      <TechnicianForm
                        technician={tech}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingTechnician(null)}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDelete(tech.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-foreground">{tech.name}</h3>
                <p className="text-sm text-primary mt-1">{tech.role}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {technicians.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border border-dashed">
          <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground italic">No technicians added yet</p>
        </div>
      )}
    </div>
  );
}

// Service Form Component
function ServiceForm(
  props: Readonly<{
    service?: Service;
    onSubmit: (data: Omit<Service, "id">) => void;
    onCancel: () => void;
  }>,
) {
  const { service, onSubmit, onCancel } = props;
  const [title, setTitle] = useState(service?.title || "");
  const [description, setDescription] = useState(service?.description || "");
  const [price, setPrice] = useState(service?.price || "");
  const [duration, setDuration] = useState(service?.duration || "");
  const [icon, setIcon] = useState(service?.icon || "wrench");

  const iconOptions = [
    { value: "monitor", label: "Screen/Monitor" },
    { value: "battery", label: "Battery" },
    { value: "wifi", label: "Software/WiFi" },
    { value: "camera", label: "Camera" },
    { value: "mic", label: "Microphone" },
    { value: "hard-drive", label: "Storage/Data" },
    { value: "smartphone", label: "Phone" },
    { value: "wrench", label: "General/Repair" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) {
      toast.error("Title and price are required");
      return;
    }
    onSubmit({ title, description, price, duration, icon });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Service Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Screen Replacement"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the service..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Starting from ₹999"
          />
        </div>
        <div>
          <Label htmlFor="duration">Duration</Label>
          <Input
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="1-2 hours"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="icon">Icon</Label>
        <Select value={icon} onValueChange={setIcon}>
          <SelectTrigger>
            <SelectValue placeholder="Select an icon" />
          </SelectTrigger>
          <SelectContent>
            {iconOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="btn-gradient">
          {service ? "Update" : "Add"} Service
        </Button>
      </div>
    </form>
  );
}

// Services Settings Component
function ServicesSettings() {
  const { services, addService, updateService, removeService } = useAdmin();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleAdd = (data: Omit<Service, "id">) => {
    addService(data);
    setIsAddOpen(false);
    toast.success("Service added successfully");
  };

  const handleUpdate = (data: Omit<Service, "id">) => {
    if (editingService) {
      updateService(editingService.id, data);
      setEditingService(null);
      toast.success("Service updated successfully");
    }
  };

  const handleDelete = (id: number) => {
    removeService(id);
    toast.success("Service removed successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Services</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient">
              <Plus className="w-4 h-4 mr-2" /> Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>
                Add a new repair service to your offerings.
              </DialogDescription>
            </DialogHeader>
            <ServiceForm
              onSubmit={handleAdd}
              onCancel={() => setIsAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
        {services.map((service) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group h-full"
          >
            <Card className="h-full overflow-hidden hover:shadow-elevated transition-all flex flex-col border border-border/50">
              <CardContent className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-primary font-semibold text-sm">
                        {service.price}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {service.duration}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Dialog
                      open={editingService?.id === service.id}
                      onOpenChange={(open) => !open && setEditingService(null)}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingService(service)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit Service</DialogTitle>
                          <DialogDescription>
                            Update the service information.
                          </DialogDescription>
                        </DialogHeader>
                        <ServiceForm
                          service={service}
                          onSubmit={handleUpdate}
                          onCancel={() => setEditingService(null)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border border-dashed">
          <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground italic">No services listed</p>
        </div>
      )}
    </div>
  );
}

// Main Admin Component
type AdminSectionId =
  | "products"
  | "banners"
  | "brands"
  | "technicians"
  | "categories"
  | "deals"
  | "popups"
  | "orders"
  | "customers";

const adminSections: {
  id: AdminSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "products", label: "Product Management", icon: Package },
  { id: "banners", label: "Banner & Hero Management", icon: Images },
  { id: "brands", label: "Brand Management", icon: Tag },
  { id: "technicians", label: "Technicians", icon: UsersIcon },
  { id: "categories", label: "Category Management", icon: Settings },
  { id: "deals", label: "Deals Management", icon: Flame },
  { id: "popups", label: "Popup Management", icon: Megaphone },
  { id: "orders", label: "Order Management", icon: FileText },
  { id: "customers", label: "Customer Management", icon: UsersIcon },
];

type AdminResource = {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
  data: Record<string, unknown>;
};

function AdminResourceManager({
  type,
  title,
  fields,
}: Readonly<{
  type: "banner" | "brand" | "feature-icon" | "deal" | "popup";
  title: string;
  fields: { key: string; label: string; kind?: "text" | "number" | "textarea" }[];
}>) {
  const { uploadImage } = useProducts();
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminResource | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState(true);

  const loadResources = async () => {
    try {
      setLoading(true);
      const response = (await api(`/admin/resources/${type}`)) as {
        resources: AdminResource[];
      };
      setResources(response.resources || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load data");
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [type]);

  const resetForm = () => {
    setEditing(null);
    setForm({});
    setEnabled(true);
  };

  const saveResource = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      title: form.title || form.name || "",
      enabled,
      order: Number(form.order || 0),
      data: form,
    };
    try {
      if (editing) {
        await api(`/admin/resources/${type}/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/admin/resources/${type}`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      toast.success(`${title} saved`);
      resetForm();
      loadResources();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    }
  };

  const deleteResource = async (resource: AdminResource) => {
    if (!confirm(`Delete ${resource.title || title}?`)) return;
    try {
      await api(`/admin/resources/${type}/${resource.id}`, {
        method: "DELETE",
      });
      toast.success(`${title} deleted`);
      loadResources();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const editResource = (resource: AdminResource) => {
    setEditing(resource);
    setEnabled(resource.enabled);
    setForm(
      Object.fromEntries(
        Object.entries(resource.data || {}).map(([key, value]) => [
          key,
          String(value ?? ""),
        ]),
      ),
    );
  };

  const handleUpload = async (key: string, file?: File) => {
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setForm((prev) => ({ ...prev, [key]: url }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <Button type="button" variant="outline" onClick={resetForm}>
          <Plus className="w-4 h-4 mr-2" /> Add New
        </Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <form onSubmit={saveResource} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.key} className={field.kind === "textarea" ? "md:col-span-2" : ""}>
                <Label>{field.label}</Label>
                {field.kind === "textarea" ? (
                  <Textarea
                    value={form[field.key] || ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                  />
                ) : (
                  <Input
                    type={field.kind === "number" ? "number" : "text"}
                    value={form[field.key] || ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                  />
                )}
                {/(image|logo|icon|banner)$/i.test(field.key) && (
                  <Input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="mt-2"
                    onChange={(e) => handleUpload(field.key, e.target.files?.[0])}
                  />
                )}
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="rounded border-2 w-4 h-4"
              />
              Enabled
            </label>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" className="btn-gradient">
                {editing ? "Update" : "Add"} {title.replace(" Management", "")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-20 rounded-lg bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {resources.map((resource) => (
            <Card key={resource.id} className="border-border/50">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {resource.title || "Untitled"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {resource.enabled ? "Enabled" : "Disabled"} · Order {resource.order || 0}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => editResource(resource)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await api(`/admin/resources/${type}/${resource.id}`, {
                        method: "PUT",
                        body: JSON.stringify({
                          ...resource,
                          enabled: !resource.enabled,
                          data: resource.data || {},
                        }),
                      });
                      loadResources();
                    }}
                  >
                    {resource.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => deleteResource(resource)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {resources.length === 0 && (
            <div className="text-center py-12 bg-card rounded-lg border border-dashed text-muted-foreground">
              No records found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BrandManager() {
  const { products, uploadImage } = useProducts();
  const [brands, setBrands] = useState<AdminResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminResource | null>(null);
  const [brandName, setBrandName] = useState("");
  const [brandImage, setBrandImage] = useState("");
  const [enabled, setEnabled] = useState(true);

  const loadBrands = async () => {
    try {
      setLoading(true);
      const response = (await api("/admin/resources/brand")) as {
        resources: AdminResource[];
      };
      setBrands(response.resources || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load brands");
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const resolveBrandLogo = (brand: AdminResource) => {
    const slug = String(brand.data?.slug || brand.data?.name || brand.title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return (
      String(
        brand.data?.logo ||
          brand.data?.image ||
          brand.data?.imageUrl ||
          (brand.data as { url?: string } | undefined)?.url ||
          "",
      ).trim() ||
      ""
    );
  };

  const resetForm = () => {
    setEditing(null);
    setBrandName("");
    setBrandImage("");
    setEnabled(true);
  };

  const saveBrand = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = brandName.trim();
    if (!name) {
      toast.error("Brand name is required");
      return;
    }

    const payload = {
      title: name,
      enabled,
      order: Number(editing?.order || 0),
      data: {
        name,
        logo: brandImage,
        image: brandImage,
        imageUrl: brandImage,
        url: brandImage,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      },
    };

    try {
      if (editing) {
        await api(`/admin/resources/brand/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Brand updated");
      } else {
        await api("/admin/resources/brand", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Brand created");
      }
      resetForm();
      loadBrands();
      localStorage.setItem("mc_brand_update", String(Date.now()));
      window.dispatchEvent(new CustomEvent("mc_brand_update"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save brand");
    }
  };

  const uploadBrandImage = async (file?: File) => {
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setBrandImage(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const editBrand = (brand: AdminResource) => {
    setEditing(
      brand.id.startsWith("product-brand-") || brand.id.startsWith("default-brand-")
        ? null
        : brand,
    );
    setBrandName(String(brand.data?.name || brand.title || ""));
    setBrandImage(
      String(
        brand.data?.logo ||
          brand.data?.image ||
          brand.data?.imageUrl ||
          (brand.data as { url?: string } | undefined)?.url ||
          "",
      ),
    );
    setEnabled(brand.enabled);
  };

  const deleteBrand = async (brand: AdminResource) => {
    if (brand.id.startsWith("default-brand-")) {
      toast.error("Default brands cannot be deleted. Edit it and save your own logo instead.");
      return;
    }
    if (brand.id.startsWith("product-brand-")) {
      toast.error("This brand comes from existing products. Save it first before deleting.");
      return;
    }
    if (!confirm(`Delete ${brand.title || "this brand"}?`)) return;
    try {
      await api(`/admin/resources/brand/${brand.id}`, { method: "DELETE" });
      if (editing?.id === brand.id) resetForm();
      toast.success("Brand deleted");
      loadBrands();
      localStorage.setItem("mc_brand_update", String(Date.now()));
      window.dispatchEvent(new CustomEvent("mc_brand_update"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete brand");
    }
  };

  const productBrands: AdminResource[] = Array.from(
    new Map(
      products
        .map((product) => String(product.brand || "").trim())
        .filter(Boolean)
        .map((name) => [
          name.toLowerCase(),
          {
            id: `product-brand-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            title: name,
            enabled: true,
            order: 0,
            data: {
              name,
              slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
              logo: "",
              source: "product",
            },
          },
        ]),
    ).values(),
  );
  const savedBrandNames = new Set(
    brands.map((brand) => String(brand.data?.name || brand.title || "").toLowerCase()),
  );
  const visibleBrands = [
    ...brands,
    ...productBrands.filter(
      (brand) => {
        const name = String(brand.title || "").toLowerCase();
        return !savedBrandNames.has(name);
      },
    ),
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Brand Management</h2>
      <Card className="border-border/50">
        <CardContent className="p-4">
          <form onSubmit={saveBrand} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>New Brand Name</Label>
              <Input
                value={brandName}
                onChange={(event) => setBrandName(event.target.value)}
                placeholder="e.g., Samsung"
              />
            </div>
            <div>
              <Label>Brand Image</Label>
              <Input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                onChange={(event) => uploadBrandImage(event.target.files?.[0])}
              />
            </div>
            {brandImage ? (
              <div className="md:col-span-2 flex items-center gap-3 rounded-lg border border-border/50 bg-white p-3">
                <img src={brandImage} alt={brandName || "Brand"} className="h-16 w-24 object-contain" />
                <Button type="button" variant="outline" onClick={() => setBrandImage("")}>
                  Remove Image
                </Button>
              </div>
            ) : null}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) => setEnabled(event.target.checked)}
                className="rounded border-2 w-4 h-4"
              />
              Active
            </label>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Clear
              </Button>
              <Button type="submit" className="btn-gradient">
                {editing ? "Update Brand" : "Create Brand"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-card rounded-lg animate-pulse" />
            ))}
          </div>
        ) : visibleBrands.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center text-muted-foreground">
              No brands yet
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {visibleBrands.map((brand) => (
              <Card key={brand.id} className="border-border/50 hover:shadow-lg transition-shadow overflow-hidden group">
                <CardContent className="p-4 flex flex-col items-center justify-between h-full gap-3">
                  <div className="w-full flex flex-col items-center gap-3 flex-1">
                    {/* Brand Logo */}
                    <div className="w-full h-24 rounded-lg bg-white/50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/30">
                      {resolveBrandLogo(brand) ? (
                        <img
                          src={resolveBrandLogo(brand)}
                          alt={brand.title || "Brand"}
                          className="h-20 w-20 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded text-2xl font-bold text-primary">
                          {String(brand.title || brand.data?.name || "?").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Brand Info */}
                    <div className="w-full text-center">
                      <h3 className="font-semibold text-sm line-clamp-2">{brand.title || brand.data?.name || "Untitled"}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {brand.data?.source === "product"
                          ? "From products"
                          : brand.data?.source === "default"
                            ? "Default"
                          : brand.enabled
                            ? "Active"
                            : "Inactive"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="w-full flex gap-2 pt-2 border-t border-border/30">
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      onClick={() => editBrand(brand)}
                      className="flex-1"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => deleteBrand(brand)}
                      className="flex-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = (await api("/admin/orders?limit=50")) as { orders: any[] };
      setOrders(response.orders || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await api(`/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    loadOrders();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Order Management</h2>
      <div className="grid gap-3">
        {loading ? (
          <div className="h-24 bg-card rounded-lg animate-pulse" />
        ) : (
          orders.map((order) => {
            const isCompleted = order.status === "COMPLETED";

            return (
            <Card
              key={order.id}
              className={`border-border/50 ${isCompleted ? "grayscale bg-gray-100 opacity-75" : ""}`}
            >
              <CardContent className="p-4 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
                <div className="space-y-2 text-sm">
                  <h3 className="font-semibold">Order #{order.id}</h3>
                  <p>{order.user?.fullName || "Customer"} · {order.user?.phone || "-"}</p>
                  <p className="text-muted-foreground">
                    {(order.items || []).map((item: any) => item.product?.name).join(", ")}
                  </p>
                  {order.addressText ? (
                    <p className="text-muted-foreground">Address: {order.addressText}</p>
                  ) : null}
                  <div className="space-y-2 pt-2">
                    {(order.items || []).map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg border border-border/50 bg-white p-2"
                      >
                        {item.product?.image || item.product?.images?.[0] ? (
                          <img
                            src={item.product?.image || item.product?.images?.[0]}
                            alt={item.product?.name || "Product"}
                            className="h-12 w-12 rounded-md object-contain"
                          />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground line-clamp-1">
                            {item.product?.name || "Booked item"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Qty {item.quantity} · ₹{Number(item.price || 0).toLocaleString("en-IN")} each
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          ₹{Number((item.price || 0) * (item.quantity || 0)).toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="font-semibold">₹{Number(order.total || 0).toLocaleString("en-IN")}</p>
                </div>
                <Select value={order.status} onValueChange={(value) => updateStatus(order.id, value)}>
                  <SelectTrigger className="w-full lg:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function CustomerManagement() {
  const [tab, setTab] = useState<"customers" | "submissions">("customers");
  const [customers, setCustomers] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = (await api(`/admin/customers?limit=50&search=${encodeURIComponent(search)}`)) as {
        customers: any[];
      };
      setCustomers(response.customers || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const response = (await api("/notifications?limit=100")) as { notifications: any[] };
      setSubmissions(response.notifications || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "customers") {
      loadCustomers();
    } else {
      loadSubmissions();
    }
  }, [tab, search]);

  const markAsResolved = async (id: string) => {
    try {
      await api(`/notifications/${id}/reply`, { method: "PATCH" });
      toast.success("Marked as resolved");
      loadSubmissions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    }
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm("Delete this submission?")) return;
    try {
      await api(`/notifications/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      loadSubmissions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
        <h2 className="text-2xl font-bold text-foreground">Customer Management</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search..." 
            className="flex-1 sm:flex-initial"
          />
          <Button type="button" variant="outline" onClick={() => setTab(tab === "customers" ? "submissions" : "customers")}>
            {tab === "customers" ? "Submissions" : "Customers"}
          </Button>
        </div>
      </div>

      {tab === "customers" ? (
        <div className="grid gap-3">
          {loading ? (
            <div className="h-24 bg-card rounded-lg animate-pulse" />
          ) : customers.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center text-muted-foreground">
                No customers found
              </CardContent>
            </Card>
          ) : (
            customers.map((customer) => (
              <Card key={customer.id} className="border-border/50">
                <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{customer.fullName}</h3>
                    <p className="text-sm text-muted-foreground">{customer.email} · {customer.phone}</p>
                    <p className="text-sm">
                      {customer.ordersCount} orders · ₹{Number(customer.totalPurchaseAmount || 0).toLocaleString("en-IN")}
                    </p>
                    {customer.address ? (
                      <p className="text-sm text-muted-foreground">Address: {customer.address}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant="outline">
                        Joined {new Date(customer.createdAt).toLocaleDateString()}
                      </Badge>
                      <Badge className={customer.emailVerified ? "bg-green-500" : "bg-gray-500"}>
                        Email {customer.emailVerified ? "Verified" : "Unverified"}
                      </Badge>
                      <Badge className={customer.phoneVerified ? "bg-green-500" : "bg-gray-500"}>
                        Phone {customer.phoneVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await api(`/admin/customers/${customer.id}/disable`, { method: "PATCH" });
                      toast.success("Customer disable recorded");
                    }}
                  >
                    Disable Account
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {loading ? (
            <div className="h-24 bg-card rounded-lg animate-pulse" />
          ) : submissions.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="p-8 text-center text-muted-foreground">
                No submissions found
              </CardContent>
            </Card>
          ) : (
            submissions.map((submission) => (
              <Card key={submission.id} className="border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold">{submission.name || submission.title || "Submission"}</h3>
                        <Badge variant="outline" className="text-xs">
                          {submission.type === "REPAIR" && "Repair Request"}
                          {submission.type === "CONTACT" && "Contact Form"}
                          {submission.type === "ORDER" && "Order"}
                          {submission.type === "CART_ORDER" && "Cart Order"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {submission.mobileNumber || submission.phone || "No phone"}
                      </p>
                      <p className="text-sm">{submission.message}</p>
                      {submission.type === "REPAIR" && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <p>Brand: {submission.phoneBrand} · Model: {submission.phoneModel}</p>
                          {submission.issues && submission.issues.length > 0 && (
                            <p>Issues: {submission.issues.join(", ")}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <Badge className={submission.replied ? "bg-green-500" : "bg-orange-500"}>
                        {submission.replied ? "Resolved" : "Pending"}
                      </Badge>
                      <time className="text-xs text-muted-foreground">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </time>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-border/50">
                    {!submission.replied && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsResolved(submission.id)}
                      >
                        Mark Resolved
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteSubmission(submission.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CategoryManager() {
  const { categories, fetchCategories, uploadImage } = useProducts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [icon, setIcon] = useState("");

  const reset = () => {
    setEditingId(null);
    setName("");
    setDisplayName("");
    setIcon("");
  };

  const saveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!displayName.trim()) {
      toast.error("Category name is required");
      return;
    }

    const payload = {
      name: displayName.toUpperCase().replace(/\s+/g, "_"),
      displayName: displayName.trim(),
      icon,
      image: icon,
    };

    try {
      if (editingId) {
        await api(`/categories/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      toast.success("Category saved");
      reset();
      fetchCategories();
      invalidateCategoryCache();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save category");
    }
  };

  const uploadCategoryImage = async (file?: File) => {
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setIcon(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Category Management</h2>
      <Card className="border-border/50">
        <CardContent className="p-4">
          <form onSubmit={saveCategory} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Category Name</Label>
              <Input 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                placeholder="E.g., Mobile Phones"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Category Icon</Label>
              <div className="space-y-2">
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => uploadCategoryImage(e.target.files?.[0])} 
                />
                {icon && (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-secondary">
                    <img src={icon} alt="Icon" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={reset}>Cancel</Button>
              <Button type="submit" className="btn-gradient">
                {editingId ? "Update" : "Add"} Category
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-3">
        {categories.map((category) => (
          <Card key={category.id} className="border-border/50">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0 border border-border">
                  {category.icon ? (
                    <img
                      src={category.icon}
                      alt={category.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <h3 className="font-semibold">{category.displayName}</h3>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(category.id);
                    setDisplayName(category.displayName);
                    setIcon(category.icon || category.image || "");
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    if (!confirm("Delete this category?")) return;
                    await api(`/categories/${category.id}`, { method: "DELETE" });
                    fetchCategories();
                    invalidateCategoryCache();
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Admin() {
  const [activeSection, setActiveSection] = useState<AdminSectionId>("products");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const { products } = useProducts();

  const visibleSections = adminSections.filter((section) =>
    section.label.toLowerCase().includes(sidebarSearch.toLowerCase()),
  );

  const renderSection = () => {
    switch (activeSection) {
      case "products":
        return <ProductsManagement defaultIsUsed={false} />;
      case "banners":
        return <BannerHeroManager />;
      case "brands":
        return <BrandManager />;
      case "technicians":
        return <TechniciansManagement />;
      case "categories":
        return <CategoryManager />;

      case "deals":
        return <DealsManager products={products} />;
      case "popups":
        return <PopupManager />;
      case "orders":
        return <OrderManagement />;
      case "customers":
        return <CustomerManagement />;
      default:
        return <ProductsManagement defaultIsUsed={false} />;
    }
  };

  return (
    <ProductProvider>
      <div className="min-h-screen bg-secondary">
        <Header />

        <main className="pt-32 md:pt-40 pb-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-2xl md:text-4xl font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Manage your products, offers, services, and website content
              </p>
            </motion.div>
            <div className="lg:hidden mb-4">
              <Button type="button" variant="outline" onClick={() => setMobileSidebarOpen(true)}>
                <Menu className="w-4 h-4 mr-2" /> Menu
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
              <aside
                className={`${
                  mobileSidebarOpen ? "fixed inset-0 z-50 p-4 bg-foreground/50" : "hidden"
                } lg:block lg:sticky lg:top-28 lg:self-start`}
              >
                <div
                  className={`bg-card border border-border/50 rounded-xl p-3 transition-all duration-300 ${
                    sidebarCollapsed ? "lg:w-20" : "lg:w-72"
                  } ${mobileSidebarOpen ? "w-full max-w-sm" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {!sidebarCollapsed && (
                      <Input
                        value={sidebarSearch}
                        onChange={(e) => setSidebarSearch(e.target.value)}
                        placeholder="Search menu..."
                      />
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        window.innerWidth < 1024
                          ? setMobileSidebarOpen(false)
                          : setSidebarCollapsed((prev) => !prev)
                      }
                    >
                      <PanelLeftClose className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {visibleSections.map((section) => {
                      const Icon = section.icon;
                      const active = activeSection === section.id;
                      return (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => {
                            setActiveSection(section.id);
                            setMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
                            active
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-secondary"
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          {!sidebarCollapsed && <span>{section.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>
              <section className="min-w-0">{renderSection()}</section>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ProductProvider>
  );
}
