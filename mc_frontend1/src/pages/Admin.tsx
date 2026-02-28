import { useState } from "react";
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
import {
  useAdmin,
  Phone,
  GalleryImage,
  Offer,
  Service,
  Technician,
} from "@/contexts/AdminContext";
import { useProducts, ProductProvider } from "@/contexts/ProductContext";
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
} from "lucide-react";
import { toast } from "sonner";

// Product type definition
type AdminProduct = {
  id: string;
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
  colorVariants: { name: string; hex: string; image: string }[];
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  isUsed?: boolean;
  description?: string;
  images: string[];
  rating?: number;
};

// Product Form Component
function ProductForm({
  product,
  onSubmit,
  onCancel,
  isUsedMode = false,
}: Readonly<{
  product?: AdminProduct;
  onSubmit: (data: Omit<AdminProduct, "id">) => void;
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
    { name: string; hex: string; image: string }[]
  >(product?.colorVariants || []);
  const [isBestSeller, setIsBestSeller] = useState(
    product?.isBestSeller || false,
  );
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured || false);
  const [isNew, setIsNew] = useState(product?.isNew || false);
  const [isUsed] = useState(product?.isUsed || false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<
    Record<number, boolean>
  >({});
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});

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
    setColorVariants((prev) => prev.filter((_, i) => i !== index));
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

    const enabledImages = imageSlots
      .filter((slot) => slot.enabled && slot.url.trim() !== "")
      .map((slot) => slot.url);

    const stockNum = Number(stock);
    onSubmit({
      name,
      brand,
      category,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      discount: discount ? Number(discount) : undefined,
      stock: stockNum,
      status: stockNum > 0 ? "In Stock" : "Out of Stock",
      image: enabledImages[0] || "",
      images: enabledImages,
      description,
      highlights: category === "MOBILE" ? mobileHighlights : highlights,
      colorVariants: colorVariants.filter((v) => v.name.trim() !== ""),
      isBestSeller,
      isFeatured,
      isNew,
      isUsed,
    });
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
    newSlots[index].url = "";
    setImageSlots(newSlots);
    // Also clear the file input if possible (though we don't have a ref, resetting URL is the main part)
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-h-[80vh] overflow-y-auto"
    >
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
        <div className="flex items-center justify-between">
          <Label>Color Variants</Label>
          <Button
            type="button"
            onClick={addColorVariant}
            size="sm"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Color
          </Button>
        </div>
        <div className="space-y-3 mt-2">
          {colorVariants.length === 0 && (
            <p className="text-xs text-muted-foreground p-3 border rounded-lg bg-secondary/20">
              No color variants added. Click "Add Color" to add product color
              options.
            </p>
          )}
          {colorVariants.map((variant, index) => (
            <div
              key={`${variant.name || variant.hex}-${index}`}
              className="grid grid-cols-5 gap-2 p-3 border rounded-lg bg-secondary/20"
            >
              <Input
                placeholder="Color name (e.g., Black)"
                value={variant.name}
                onChange={(e) =>
                  updateColorVariant(index, "name", e.target.value)
                }
              />
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={variant.hex}
                  onChange={(e) =>
                    updateColorVariant(index, "hex", e.target.value)
                  }
                  className="w-12 h-10 p-1 rounded"
                />
                <span className="text-xs text-muted-foreground">
                  {variant.hex}
                </span>
              </div>
              <Input
                placeholder="Variant image URL (optional)"
                value={variant.image}
                onChange={(e) =>
                  updateColorVariant(index, "image", e.target.value)
                }
              />
              <div className="flex items-center">
                {variant.hex && (
                  <div
                    className="w-6 h-6 rounded border-2 border-border mr-2"
                    style={{ backgroundColor: variant.hex }}
                  ></div>
                )}
              </div>
              <Button
                type="button"
                onClick={() => removeColorVariant(index)}
                size="sm"
                variant="destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Product Flags Section */}
      <div>
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
              checked={isNew}
              onChange={(e) => setIsNew(e.target.checked)}
              className="rounded border-2 w-4 h-4"
            />
            <span className="text-sm">New Arrival</span>
          </label>
        </div>
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
  const fallbackProductImage =
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop";
  const { products, createProduct, updateProduct, deleteProduct, categories } =
    useProducts();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  );
  const [isAddOpen, setIsAddOpen] = useState(false);

  // ... (keeping existing transform logic)

  const adminProducts: AdminProduct[] = products.map((p) => ({
    ...p,
    status: p.stock > 0 ? ("In Stock" as const) : ("Out of Stock" as const),
    image: p.images?.[0] || p.image || fallbackProductImage,
  }));

  const filteredProducts = adminProducts
    .filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
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

      return matchesCategory && matchesSearch && matchesType;
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

  const handleAdd = async (data: Omit<AdminProduct, "id">) => {
    try {
      const productData = {
        ...data,
        isUsed: defaultIsUsed,
      };
      await createProduct(productData);
      setIsAddOpen(false);
      toast.success("Product added successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add product",
      );
    }
  };

  const handleUpdate = async (data: Omit<AdminProduct, "id">) => {
    if (editingProduct) {
      try {
        const productData = {
          ...data,
          isUsed: defaultIsUsed,
        };
        await updateProduct(editingProduct.id, productData);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-foreground">
          Products Management
        </h2>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Add New {defaultIsUsed ? "Used Phone" : "Product"}
              </DialogTitle>
              <DialogDescription>
                Fill in the details to add a new product to your inventory.
              </DialogDescription>
            </DialogHeader>
            <ProductForm
              onSubmit={handleAdd}
              onCancel={() => setIsAddOpen(false)}
              isUsedMode={defaultIsUsed}
            />
          </DialogContent>
        </Dialog>
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
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
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
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Product</DialogTitle>
                        <DialogDescription>
                          Update the product information below.
                        </DialogDescription>
                      </DialogHeader>
                      <ProductForm
                        product={product}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingProduct(null)}
                        isUsedMode={product.isUsed}
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
  const [yearsOfExperience, setYearsOfExperience] = useState(
    technician?.yearsOfExperience?.toString() || "",
  );
  const [rating, setRating] = useState(technician?.rating?.toString() || "");
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
      yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
      rating: rating ? Number(rating) : undefined,
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
        <Label htmlFor="role">Role/Specialization</Label>
        <Input
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Senior Technician"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="experience">Years of Experience</Label>
          <Input
            id="experience"
            type="number"
            value={yearsOfExperience}
            onChange={(e) => setYearsOfExperience(e.target.value)}
            placeholder="5"
          />
        </div>
        <div>
          <Label htmlFor="rating">Rating (0-5)</Label>
          <Input
            id="rating"
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="4.9"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="image">Profile Image</Label>
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
                {tech.yearsOfExperience && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {tech.yearsOfExperience} years experience
                  </p>
                )}
                {tech.rating && (
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-semibold">{tech.rating}</span>
                  </div>
                )}
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
export default function Admin() {
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

            <Tabs defaultValue="products" className="space-y-6">
              <div className="w-full overflow-x-auto scrollbar-hide bg-card p-1 rounded-xl border border-border/50">
                <TabsList className="flex w-max min-w-full h-auto bg-transparent gap-1 p-0">
                  <TabsTrigger
                    value="products"
                    className="flex items-center gap-1 text-[10px] sm:text-xs"
                  >
                    <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Products
                  </TabsTrigger>
                  <TabsTrigger
                    value="used-phones"
                    className="flex items-center gap-1 text-[10px] sm:text-xs"
                  >
                    <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Used Phones
                  </TabsTrigger>
                  <TabsTrigger
                    value="offers"
                    className="flex items-center gap-1 text-[10px] sm:text-xs"
                  >
                    <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Offers
                  </TabsTrigger>
                  <TabsTrigger
                    value="services"
                    className="flex items-center gap-1 text-[10px] sm:text-xs"
                  >
                    <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Services
                  </TabsTrigger>
                  <TabsTrigger
                    value="hero"
                    className="flex items-center gap-1 text-[10px] sm:text-xs"
                  >
                    <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Hero
                  </TabsTrigger>
                  <TabsTrigger
                    value="gallery"
                    className="flex items-center gap-1 text-[10px] sm:text-xs"
                  >
                    <Images className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Gallery
                  </TabsTrigger>
                  <TabsTrigger
                    value="technicians"
                    className="flex items-center gap-1 text-[10px] sm:text-xs"
                  >
                    <UsersIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Technicians
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="products">
                <ProductsManagement defaultIsUsed={false} />
              </TabsContent>

              <TabsContent value="used-phones">
                <ProductsManagement defaultIsUsed={true} />
              </TabsContent>

              <TabsContent value="offers">
                <OffersSettings />
              </TabsContent>

              <TabsContent value="services">
                <ServicesSettings />
              </TabsContent>

              <TabsContent value="hero">
                <HeroSettings />
              </TabsContent>

              <TabsContent value="gallery">
                <GallerySettings />
              </TabsContent>

              <TabsContent value="technicians">
                <TechniciansManagement />
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>
    </ProductProvider>
  );
}
