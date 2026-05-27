import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Upload,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

type ProductVariantFormProps = {
  categories: Array<{ id: string; displayName: string; name: string }>;
  onSubmit: (products: any[]) => void;
  onCancel: () => void;
  uploadImage: (file: File) => Promise<string>;
};

type ColorVariant = {
  id: string;
  colorName: string;
  colorHex: string;
  images: string[];
  storageVariants: StorageVariant[];
  inStock: boolean;
};

type StorageVariant = {
  id: string;
  storage: string;
  price: string;
  originalPrice: string;
  stock: string;
  inStock: boolean;
};

type StorageVariantDraft = {
  storage: string;
  price: string;
  originalPrice: string;
  stock: string;
  inStock: boolean;
};

export function ProductVariantForm({
  categories,
  onSubmit,
  onCancel,
  uploadImage,
}: ProductVariantFormProps) {
  // Step 1: Base Product Info (Questions 1-10)
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [stock, setStock] = useState("");
  const [rating, setRating] = useState("");
  const [images, setImages] = useState<string[]>(["", "", "", ""]);
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});

  // Color Variants
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);
  const [currentColor, setCurrentColor] = useState<{
    colorName: string;
    colorHex: string;
    images: string[];
  }>({
    colorName: "",
    colorHex: "#000000",
    images: ["", "", "", ""],
  });
  const [expandedColor, setExpandedColor] = useState<string | null>(null);

  // UI State
  const [isUploading, setIsUploading] = useState(false);
  const [showColorForm, setShowColorForm] = useState(false);
  const [currentColorImageSlots, setCurrentColorImageSlots] = useState<
    { url: string; enabled: boolean }[]
  >(["", "", "", ""].map(() => ({ url: "", enabled: false })));
  
  // Storage variant draft for current color
  const [storageVariantDraft, setStorageVariantDraft] = useState<StorageVariantDraft>({
    storage: "",
    price: "",
    originalPrice: "",
    stock: "",
    inStock: true,
  });
  const [expandedStorageColor, setExpandedStorageColor] = useState<string | null>(null);

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
    "Motorola",
    "Nokia",
    "Nothing",
  ];

  // Calculate discount automatically
  useEffect(() => {
    if (originalPrice && price) {
      const op = parseFloat(originalPrice);
      const p = parseFloat(price);
      if (!isNaN(op) && !isNaN(p) && op > 0) {
        setDiscount((((op - p) / op) * 100).toFixed(2));
      }
    }
  }, [originalPrice, price]);

  const handleImageUpload = async (
    file: File,
    index: number,
    isBaseProduct: boolean = true
  ) => {
    try {
      setIsUploading(true);
      setImageLoading((prev) => ({ ...prev, [index]: true }));
      const url = await uploadImage(file);

      if (isBaseProduct) {
        const newImages = [...images];
        newImages[index] = url;
        setImages(newImages);
      } else {
        const newSlots = [...currentColorImageSlots];
        newSlots[index].url = url;
        newSlots[index].enabled = true;
        setCurrentColorImageSlots(newSlots);
        setCurrentColor((prev) => ({
          ...prev,
          images: newSlots
            .filter((s) => s.enabled && s.url)
            .map((s) => s.url),
        }));
      }
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Image upload failed"
      );
    } finally {
      setIsUploading(false);
      setImageLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const validateBaseProduct = () => {
    if (!productName.trim()) {
      toast.error("Product name is required (Q1)");
      return false;
    }
    if (!brand.trim()) {
      toast.error("Brand is required (Q2)");
      return false;
    }
    if (!description.trim()) {
      toast.error("Description is required (Q3)");
      return false;
    }
    if (!category.trim()) {
      toast.error("Category is required (Q4)");
      return false;
    }
    if (!price.trim() || isNaN(parseFloat(price))) {
      toast.error("Valid price is required (Q5)");
      return false;
    }
    if (!stock.trim() || isNaN(parseInt(stock))) {
      toast.error("Valid stock is required (Q8)");
      return false;
    }
    const enabledImages = images.filter((img) => img.trim());
    if (enabledImages.length === 0) {
      toast.error("At least one image is required (Q10)");
      return false;
    }
    return true;
  };

  const addFirstColor = () => {
    if (!validateBaseProduct()) return;
    if (!currentColor.colorName.trim()) {
      toast.error("Color name is required");
      return;
    }
    if (currentColor.images.length === 0) {
      toast.error("At least one image for color is required");
      return;
    }

    // Create base product with first color
    const enabledImages = images.filter((img) => img.trim());
    const baseProduct = {
      name: productName,
      brand,
      description,
      category,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      discount: discount ? parseFloat(discount) : null,
      rating: rating ? parseFloat(rating) : null,
      stock: parseInt(stock),
      images: enabledImages,
      colorName: currentColor.colorName,
      colorHex: currentColor.colorHex,
      colorVariants: [
        {
          name: currentColor.colorName,
          hex: currentColor.colorHex,
          image: currentColor.images[0],
        },
      ],
    };

    // Add first color to variants
    const newColor: ColorVariant = {
      id: `color-${Date.now()}`,
      colorName: currentColor.colorName,
      colorHex: currentColor.colorHex,
      images: currentColor.images,
      storageVariants: [],
      inStock: true,
    };

    setColorVariants([newColor]);
    setCurrentColor({ colorName: "", colorHex: "#000000", images: ["", "", "", ""] });
    setCurrentColorImageSlots(["", "", "", ""].map(() => ({ url: "", enabled: false })));
    setShowColorForm(false);

    toast.success(`Product created with ${newColor.colorName} color!`);
  };

  const addAnotherColor = () => {
    if (!validateBaseProduct()) return;
    if (!currentColor.colorName.trim()) {
      toast.error("Color name is required");
      return;
    }
    if (currentColor.images.length === 0) {
      toast.error("At least one image for color is required");
      return;
    }

    const newColor: ColorVariant = {
      id: `color-${Date.now()}`,
      colorName: currentColor.colorName,
      colorHex: currentColor.colorHex,
      images: currentColor.images,
      storageVariants: [],
      inStock: true,
    };

    setColorVariants([...colorVariants, newColor]);
    setCurrentColor({ colorName: "", colorHex: "#000000", images: ["", "", "", ""] });
    setCurrentColorImageSlots(["", "", "", ""].map(() => ({ url: "", enabled: false })));
    setShowColorForm(false);

    toast.success(`${newColor.colorName} color added!`);
  };

  const addStorageVariant = (colorId: string) => {
    if (!storageVariantDraft.storage.trim()) {
      toast.error("Storage capacity is required");
      return;
    }
    if (!storageVariantDraft.price.trim() || isNaN(parseFloat(storageVariantDraft.price))) {
      toast.error("Valid price is required");
      return;
    }

    setColorVariants((prev) =>
      prev.map((color) => {
        if (color.id === colorId) {
          return {
            ...color,
            storageVariants: [
              ...color.storageVariants,
              {
                id: `storage-${Date.now()}`,
                ...storageVariantDraft,
              },
            ],
          };
        }
        return color;
      })
    );

    setStorageVariantDraft({
      storage: "",
      price: "",
      originalPrice: "",
      stock: "",
      inStock: true,
    });
    toast.success(`${storageVariantDraft.storage} storage added!`);
  };

  const removeStorageVariant = (colorId: string, storageId: string) => {
    setColorVariants((prev) =>
      prev.map((color) => {
        if (color.id === colorId) {
          return {
            ...color,
            storageVariants: color.storageVariants.filter((s) => s.id !== storageId),
          };
        }
        return color;
      })
    );
  };

  const handleFinalSubmit = () => {
    if (!validateBaseProduct()) return;

    if (colorVariants.length === 0) {
      toast.error("Add at least one color variant");
      return;
    }

    const shouldCreateFamily =
      colorVariants.length > 1 ||
      colorVariants.some((color) => color.storageVariants.length > 0);
    const familyId = shouldCreateFamily
      ? `family-${Date.now()}-${Math.random().toString(36).slice(2)}`
      : undefined;

    const enabledImages = images.filter((img) => img.trim());
    const productsToCreate = colorVariants.flatMap((color) => {
      // If color has storage variants, create a product for each storage
      if (color.storageVariants.length > 0) {
        return color.storageVariants.map((storage) => {
          const storageDiscount = storage.originalPrice
            ? (
                ((parseFloat(storage.originalPrice) - parseFloat(storage.price)) /
                  parseFloat(storage.originalPrice)) *
                100
              ).toFixed(2)
            : null;

          return {
            name: `${productName} - ${color.colorName} (${storage.storage})`,
            brand,
            description,
            category,
            price: parseFloat(storage.price),
            originalPrice: storage.originalPrice
              ? parseFloat(storage.originalPrice)
              : null,
            discount: storageDiscount ? parseFloat(storageDiscount) : null,
            stock: parseInt(storage.stock) || 0,
            rating: rating ? parseFloat(rating) : null,
            images: color.images.length > 0 ? color.images : enabledImages,
            familyId,
            colorName: color.colorName,
            colorHex: color.colorHex,
            storageOption: storage.storage,
            baseProductId: null,
            colorVariants: [
              {
                name: color.colorName,
                hex: color.colorHex,
                image: color.images[0] || enabledImages[0],
              },
            ],
          };
        });
      }

      // Otherwise just create product for this color (without specific storage)
      return [
        {
          name: productName,
          brand,
          description,
          category,
          price: parseFloat(price),
          originalPrice: originalPrice ? parseFloat(originalPrice) : null,
          discount: discount ? parseFloat(discount) : null,
          stock: parseInt(stock),
          rating: rating ? parseFloat(rating) : null,
          images: color.images.length > 0 ? color.images : enabledImages,
          familyId,
          colorName: color.colorName,
          colorHex: color.colorHex,
          colorVariants: [
            {
              name: color.colorName,
              hex: color.colorHex,
              image: color.images[0] || enabledImages[0],
            },
          ],
        },
      ];
    });

    onSubmit(productsToCreate);
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto p-4">
      {/* Base Product Info */}
      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-lg">Product Information (Questions 1-10)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Q1: Product Name */}
          <div>
            <Label>
              Q1. Product Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Samsung Galaxy A17"
            />
          </div>

          {/* Q2: Brand */}
          <div>
            <Label>
              Q2. Brand <span className="text-red-500">*</span>
            </Label>
            <Select value={brand} onValueChange={setBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Q3: Description */}
          <div>
            <Label>
              Q3. Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product description..."
              className="min-h-24"
            />
          </div>

          {/* Q4: Category */}
          <div>
            <Label>
              Q4. Category <span className="text-red-500">*</span>
            </Label>
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

          {/* Q5: Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Q5. Selling Price (₹) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="15,999"
                step="0.01"
              />
            </div>

            {/* Q6: Original Price */}
            <div>
              <Label>Q6. Original Price (₹)</Label>
              <Input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="19,999"
                step="0.01"
              />
            </div>
          </div>

          {/* Q7: Discount */}
          <div>
            <Label>Q7. Discount (in rupees)</Label>
            <Input
              type="number"
              value={discount}
              readOnly
              placeholder="Auto-calculated"
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Auto-calculated from original price and selling price
            </p>
          </div>

          {/* Q8: Stock */}
          <div>
            <Label>
              Q8. Stock <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="50"
              min="0"
            />
          </div>

          {/* Q9: Rating */}
          <div>
            <Label>Q9. Rating (number)</Label>
            <Input
              type="number"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="4.5"
              min="0"
              max="5"
              step="0.1"
            />
          </div>

          {/* Q10: Images */}
          <div>
            <Label>
              Q10. Images (max 4) <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="border-2 border-dashed rounded-lg p-4 text-center"
                >
                  {img ? (
                    <div className="space-y-2">
                      <img
                        src={img}
                        alt={`Product ${idx + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const newImages = [...images];
                          newImages[idx] = "";
                          setImages(newImages);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Label className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6" />
                        <span className="text-sm">Image {idx + 1}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleImageUpload(e.target.files[0], idx, true);
                          }
                        }}
                        disabled={imageLoading[idx] || isUploading}
                      />
                    </Label>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Variants */}
      <Card>
        <CardHeader className="bg-blue-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Q11. Color Variants</CardTitle>
            {colorVariants.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {colorVariants.length} color(s) added
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {colorVariants.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900">Add First Color</p>
                <p className="text-sm text-blue-800">
                  When you add the first color, the product will be created. Then you can add more colors as variants.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {colorVariants.map((color, idx) => (
                <Card key={color.id} className="bg-blue-50">
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() =>
                      setExpandedColor(
                        expandedColor === color.id ? null : color.id
                      )
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: color.colorHex }}
                        />
                        <span className="font-medium">{color.colorName}</span>
                      </div>
                      {expandedColor === color.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedColor === color.id && (
                    <CardContent className="space-y-3 border-t pt-4">
                      <div className="grid grid-cols-2 gap-2">
                        {color.images.map((img, imgIdx) => (
                          <img
                            key={imgIdx}
                            src={img}
                            alt={`${color.colorName} ${imgIdx + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                        ))}
                      </div>

                      {/* Storage Variants Section */}
                      <div className="border-t pt-3">
                        <h4 className="font-medium text-sm mb-2">Storage Variants</h4>
                        {color.storageVariants.length > 0 ? (
                          <div className="space-y-2 mb-3">
                            {color.storageVariants.map((storage) => (
                              <div
                                key={storage.id}
                                className="bg-white border rounded p-2 flex items-center justify-between"
                              >
                                <div>
                                  <p className="text-sm font-medium">{storage.storage}</p>
                                  <p className="text-xs text-muted-foreground">
                                    ₹{storage.price} {storage.stock && `| Stock: ${storage.stock}`}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeStorageVariant(color.id, storage.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mb-2">No storage variants added</p>
                        )}

                        {/* Add Storage Variant Form */}
                        <div
                          className="bg-blue-50 border border-blue-200 rounded p-3 cursor-pointer"
                          onClick={() =>
                            setExpandedStorageColor(
                              expandedStorageColor === color.id ? null : color.id
                            )
                          }
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Add Storage Variant</span>
                            {expandedStorageColor === color.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </div>

                        {expandedStorageColor === color.id && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2 space-y-3">
                            {/* Storage Capacity */}
                            <div>
                              <Label className="text-sm">Storage Capacity</Label>
                              <Input
                                value={storageVariantDraft.storage}
                                onChange={(e) =>
                                  setStorageVariantDraft({
                                    ...storageVariantDraft,
                                    storage: e.target.value,
                                  })
                                }
                                placeholder="e.g., 6GB+128GB, 8GB+256GB"
                              />
                            </div>

                            {/* Price */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-sm">Price (₹)</Label>
                                <Input
                                  type="number"
                                  value={storageVariantDraft.price}
                                  onChange={(e) =>
                                    setStorageVariantDraft({
                                      ...storageVariantDraft,
                                      price: e.target.value,
                                    })
                                  }
                                  placeholder="15,999"
                                  step="0.01"
                                />
                              </div>

                              {/* Original Price */}
                              <div>
                                <Label className="text-sm">Original Price (₹)</Label>
                                <Input
                                  type="number"
                                  value={storageVariantDraft.originalPrice}
                                  onChange={(e) =>
                                    setStorageVariantDraft({
                                      ...storageVariantDraft,
                                      originalPrice: e.target.value,
                                    })
                                  }
                                  placeholder="19,999"
                                  step="0.01"
                                />
                              </div>
                            </div>

                            {/* Stock */}
                            <div>
                              <Label className="text-sm">Stock</Label>
                              <Input
                                type="number"
                                value={storageVariantDraft.stock}
                                onChange={(e) =>
                                  setStorageVariantDraft({
                                    ...storageVariantDraft,
                                    stock: e.target.value,
                                  })
                                }
                                placeholder="50"
                                min="0"
                              />
                            </div>

                            {/* Add Button */}
                            <Button
                              type="button"
                              className="w-full"
                              onClick={() => addStorageVariant(color.id)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Storage Variant
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Remove Color Button */}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setColorVariants(
                            colorVariants.filter((c) => c.id !== color.id)
                          );
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Color
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Add Color Form */}
          <Card className="border-2 border-blue-200 bg-white">
            <CardHeader
              className="cursor-pointer bg-blue-50"
              onClick={() => setShowColorForm(!showColorForm)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {showColorForm ? "Hide" : "Show"} Color Entry Form
                </span>
                {showColorForm ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </CardHeader>
            {showColorForm && (
              <CardContent className="space-y-4 pt-4">
                {/* Color Name */}
                <div>
                  <Label>Color Name</Label>
                  <Input
                    value={currentColor.colorName}
                    onChange={(e) =>
                      setCurrentColor({ ...currentColor, colorName: e.target.value })
                    }
                    placeholder="e.g., Midnight Black"
                  />
                </div>

                {/* Color Hex */}
                <div>
                  <Label>Color Code (HEX)</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={currentColor.colorHex}
                      onChange={(e) =>
                        setCurrentColor({ ...currentColor, colorHex: e.target.value })
                      }
                      className="w-16 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={currentColor.colorHex}
                      onChange={(e) =>
                        setCurrentColor({ ...currentColor, colorHex: e.target.value })
                      }
                      placeholder="#000000"
                    />
                  </div>
                </div>

                {/* Color Images */}
                <div>
                  <Label>Color Images (max 4)</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {currentColorImageSlots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="border-2 border-dashed rounded-lg p-4 text-center"
                      >
                        {slot.url ? (
                          <div className="space-y-2">
                            <img
                              src={slot.url}
                              alt={`Color variant ${idx + 1}`}
                              className="w-full h-24 object-cover rounded"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const newSlots = [...currentColorImageSlots];
                                newSlots[idx].url = "";
                                newSlots[idx].enabled = false;
                                setCurrentColorImageSlots(newSlots);
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <Label className="cursor-pointer">
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-6 h-6" />
                              <span className="text-sm">Image {idx + 1}</span>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleImageUpload(e.target.files[0], idx, false);
                                }
                              }}
                              disabled={imageLoading[idx] || isUploading}
                            />
                          </Label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  {colorVariants.length === 0 ? (
                    <Button
                      type="button"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={addFirstColor}
                      disabled={isUploading}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Product with This Color
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={addAnotherColor}
                      disabled={isUploading}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add This Color as Variant
                    </Button>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleFinalSubmit}
          disabled={colorVariants.length === 0 || isUploading}
          className="flex-1 bg-primary"
        >
          Create All Products
        </Button>
      </div>
    </div>
  );
}
