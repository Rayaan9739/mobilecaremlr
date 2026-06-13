import React, { useState, useEffect } from "react";
import { Plus, Trash2, Upload, X, DragVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "./RichTextEditor";
import api from "@/lib/api";
import { toast } from "sonner";

// Type definitions
interface ProductHighlight {
  featureIcon: string;
  featureText: string;
}

interface ProductColorVariant {
  id: string;
  name: string;
  hex: string;
  dotImage: string;
  images: string[];
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  inStock: boolean;
}

interface ProductStorageVariant {
  id: string;
  storage: string;
  colorVariants: ProductColorVariant[];
}

interface ProductFlags {
  isWeeklyTrending: boolean;
  isMostPopular: boolean;
  isPremiumUsed: boolean;
  isBestSelling: boolean;
  isFlagship: boolean;
}

interface ProductFormData {
  name: string;
  brand: string;
  category: string;
  rating: number;
  reviewCount: number;
  description: string;
  highlights: ProductHighlight[];
  storageVariants: ProductStorageVariant[];
  flags: ProductFlags;
}

interface AdminProductFormProps {
  productId?: string;
  onSave?: (data: ProductFormData) => void;
  isEdit?: boolean;
}

export function AdminProductForm({
  productId,
  onSave,
  isEdit = false,
}: AdminProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    brand: "",
    category: "",
    rating: 4.5,
    reviewCount: 0,
    description: "",
    highlights: [{ featureIcon: "", featureText: "" }],
    storageVariants: [
      {
        id: "storage-1",
        storage: "256GB",
        colorVariants: [
          {
            id: "color-1",
            name: "Black",
            hex: "#000000",
            dotImage: "",
            images: [],
            price: 0,
            originalPrice: 0,
            discount: 0,
            stock: 0,
            inStock: true,
          },
        ],
      },
    ],
    flags: {
      isWeeklyTrending: false,
      isMostPopular: false,
      isPremiumUsed: false,
      isBestSelling: false,
      isFlagship: false,
    },
  });

  const [loading, setLoading] = useState(false);
  const [draggedImage, setDraggedImage] = useState<{
    storageId: string;
    colorId: string;
    index: number;
  } | null>(null);

  // Load product data if editing
  useEffect(() => {
    if (isEdit && productId) {
      loadProduct();
    }
  }, [productId, isEdit]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const product = await api(`/products/${productId}`);
      // Transform API response to form data
      setFormData({
        name: product.name || "",
        brand: product.brand || "",
        category: product.category || "",
        rating: product.rating || 4.5,
        reviewCount: product.reviewCount || 0,
        description: product.description || "",
        highlights: product.highlights || [{ featureIcon: "", featureText: "" }],
        storageVariants: product.storageVariants || formData.storageVariants,
        flags: product.flags || formData.flags,
      });
    } catch (error) {
      toast.error("Failed to load product");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof Omit<ProductFormData, "storageVariants" | "highlights" | "flags">,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addStorageVariant = () => {
    const newId = `storage-${Date.now()}`;
    setFormData((prev) => ({
      ...prev,
      storageVariants: [
        ...prev.storageVariants,
        {
          id: newId,
          storage: "",
          colorVariants: [
            {
              id: "color-1",
              name: "Black",
              hex: "#000000",
              dotImage: "",
              images: [],
              price: 0,
              originalPrice: 0,
              discount: 0,
              stock: 0,
              inStock: true,
            },
          ],
        },
      ],
    }));
  };

  const removeStorageVariant = (storageId: string) => {
    setFormData((prev) => ({
      ...prev,
      storageVariants: prev.storageVariants.filter((s) => s.id !== storageId),
    }));
  };

  const addColorVariant = (storageId: string) => {
    const newColorId = `color-${Date.now()}`;
    setFormData((prev) => ({
      ...prev,
      storageVariants: prev.storageVariants.map((storage) =>
        storage.id === storageId
          ? {
              ...storage,
              colorVariants: [
                ...storage.colorVariants,
                {
                  id: newColorId,
                  name: "",
                  hex: "#000000",
                  dotImage: "",
                  images: [],
                  price: 0,
                  originalPrice: 0,
                  discount: 0,
                  stock: 0,
                  inStock: true,
                },
              ],
            }
          : storage
      ),
    }));
  };

  const removeColorVariant = (storageId: string, colorId: string) => {
    setFormData((prev) => ({
      ...prev,
      storageVariants: prev.storageVariants.map((storage) =>
        storage.id === storageId
          ? {
              ...storage,
              colorVariants: storage.colorVariants.filter((c) => c.id !== colorId),
            }
          : storage
      ),
    }));
  };

  const updateColorVariant = (
    storageId: string,
    colorId: string,
    field: keyof ProductColorVariant,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      storageVariants: prev.storageVariants.map((storage) =>
        storage.id === storageId
          ? {
              ...storage,
              colorVariants: storage.colorVariants.map((color) =>
                color.id === colorId ? { ...color, [field]: value } : color
              ),
            }
          : storage
      ),
    }));
  };

  const updateStorageVariant = (storageId: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      storageVariants: prev.storageVariants.map((storage) =>
        storage.id === storageId ? { ...storage, [field]: value } : storage
      ),
    }));
  };

  const addHighlight = () => {
    setFormData((prev) => ({
      ...prev,
      highlights: [...prev.highlights, { featureIcon: "", featureText: "" }],
    }));
  };

  const removeHighlight = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index),
    }));
  };

  const updateHighlight = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      highlights: prev.highlights.map((h, i) =>
        i === index ? { ...h, [field]: value } : h
      ),
    }));
  };

  const handleImageUpload = async (
    storageId: string,
    colorId: string,
    files: FileList
  ) => {
    if (!files.length) return;

    try {
      setLoading(true);
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("image", files[i]);

        const response = await api("/upload", {
          method: "POST",
          body: formData,
        }) as { url: string };

        if (response.url) {
          uploadedUrls.push(response.url);
        }
      }

      // Add uploaded images to color variant
      setFormData((prev) => ({
        ...prev,
        storageVariants: prev.storageVariants.map((storage) =>
          storage.id === storageId
            ? {
                ...storage,
                colorVariants: storage.colorVariants.map((color) =>
                  color.id === colorId
                    ? {
                        ...color,
                        images: [...(color.images || []), ...uploadedUrls],
                      }
                    : color
                ),
              }
            : storage
        ),
      }));

      toast.success(`${uploadedUrls.length} image(s) uploaded`);
    } catch (error) {
      toast.error("Failed to upload images");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (
    storageId: string,
    colorId: string,
    imageIndex: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      storageVariants: prev.storageVariants.map((storage) =>
        storage.id === storageId
          ? {
              ...storage,
              colorVariants: storage.colorVariants.map((color) =>
                color.id === colorId
                  ? {
                      ...color,
                      images: color.images.filter((_, i) => i !== imageIndex),
                    }
                  : color
              ),
            }
          : storage
      ),
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const endpoint = isEdit ? `/products/${productId}` : "/products";
      const method = isEdit ? "PUT" : "POST";

      await api(endpoint, {
        method,
        body: JSON.stringify(formData),
      });

      toast.success(isEdit ? "Product updated" : "Product created");
      onSave?.(formData);
    } catch (error) {
      toast.error("Failed to save product");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Product Name</label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., iPhone 17 Pro"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Brand</label>
              <Input
                value={formData.brand}
                onChange={(e) => handleInputChange("brand", e.target.value)}
                placeholder="e.g., Apple"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="">Select Category</option>
                <option value="MOBILE">Mobile</option>
                <option value="ACCESSORY">Accessory</option>
                <option value="USED">Used Phone</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={formData.rating}
                  onChange={(e) =>
                    handleInputChange("rating", parseFloat(e.target.value))
                  }
                  placeholder="Rating"
                  min="0"
                  max="5"
                  step="0.1"
                />
                <Input
                  type="number"
                  value={formData.reviewCount}
                  onChange={(e) =>
                    handleInputChange("reviewCount", parseInt(e.target.value))
                  }
                  placeholder="Review Count"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium block mb-2">Description</label>
            <RichTextEditor
              value={formData.description}
              onChange={(html) => handleInputChange("description", html)}
              placeholder="Enter product description with formatting..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Highlights */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Product Highlights</CardTitle>
          <Button size="sm" onClick={addHighlight}>
            <Plus className="w-4 h-4 mr-2" />
            Add Highlight
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {formData.highlights.map((highlight, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={highlight.featureIcon}
                onChange={(e) =>
                  updateHighlight(index, "featureIcon", e.target.value)
                }
                placeholder="Feature icon (e.g., camera)"
              />
              <Input
                value={highlight.featureText}
                onChange={(e) =>
                  updateHighlight(index, "featureText", e.target.value)
                }
                placeholder="Feature text"
                className="flex-1"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeHighlight(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Storage Variants */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Storage & Color Variants</CardTitle>
          <Button size="sm" onClick={addStorageVariant}>
            <Plus className="w-4 h-4 mr-2" />
            Add Storage
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {formData.storageVariants.map((storage, storageIndex) => (
            <Card key={storage.id} className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Input
                    value={storage.storage}
                    onChange={(e) =>
                      updateStorageVariant(storage.id, "storage", e.target.value)
                    }
                    placeholder="e.g., 256GB"
                    className="w-48"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeStorageVariant(storage.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Colors for this storage */}
                <div className="space-y-3">
                  {storage.colorVariants.map((color, colorIndex) => (
                    <Card key={color.id} className="border-border/40 bg-black/20">
                      <CardContent className="pt-4 space-y-3">
                        {/* Color Name & Hex */}
                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            value={color.name}
                            onChange={(e) =>
                              updateColorVariant(
                                storage.id,
                                color.id,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="Color name (e.g., Silver)"
                          />
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={color.hex}
                              onChange={(e) =>
                                updateColorVariant(
                                  storage.id,
                                  color.id,
                                  "hex",
                                  e.target.value
                                )
                              }
                              className="w-12 h-10 border border-border rounded cursor-pointer"
                            />
                            <Input
                              value={color.hex}
                              onChange={(e) =>
                                updateColorVariant(
                                  storage.id,
                                  color.id,
                                  "hex",
                                  e.target.value
                                )
                              }
                              placeholder="#000000"
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              removeColorVariant(storage.id, color.id)
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Dot Image Upload */}
                        <div>
                          <label className="text-xs font-medium">Color Dot Image</label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                // Handle file upload
                                const file = e.target.files[0];
                                // TODO: Implement dot image upload
                              }
                            }}
                          />
                          {color.dotImage && (
                            <div className="mt-2">
                              <img
                                src={color.dotImage}
                                alt="Color dot"
                                className="w-8 h-8 rounded-full border border-border"
                              />
                            </div>
                          )}
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-4 gap-2">
                          <Input
                            type="number"
                            value={color.price}
                            onChange={(e) =>
                              updateColorVariant(
                                storage.id,
                                color.id,
                                "price",
                                parseFloat(e.target.value)
                              )
                            }
                            placeholder="Price"
                            min="0"
                          />
                          <Input
                            type="number"
                            value={color.originalPrice || ""}
                            onChange={(e) =>
                              updateColorVariant(
                                storage.id,
                                color.id,
                                "originalPrice",
                                parseFloat(e.target.value)
                              )
                            }
                            placeholder="Original Price"
                            min="0"
                          />
                          <Input
                            type="number"
                            value={color.discount || ""}
                            onChange={(e) =>
                              updateColorVariant(
                                storage.id,
                                color.id,
                                "discount",
                                parseFloat(e.target.value)
                              )
                            }
                            placeholder="Discount %"
                            min="0"
                            max="100"
                          />
                          <Input
                            type="number"
                            value={color.stock}
                            onChange={(e) =>
                              updateColorVariant(
                                storage.id,
                                color.id,
                                "stock",
                                parseInt(e.target.value)
                              )
                            }
                            placeholder="Stock"
                            min="0"
                          />
                        </div>

                        {/* Images */}
                        <div>
                          <label className="text-xs font-medium block mb-2">
                            Product Images
                          </label>
                          <div className="border border-dashed border-border rounded p-4">
                            <label className="cursor-pointer">
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="w-6 h-6 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  Click to upload images
                                </span>
                              </div>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleImageUpload(storage.id, color.id, e.target.files!)
                                }
                              />
                            </label>
                          </div>

                          {/* Image Gallery */}
                          {color.images.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mt-3">
                              {color.images.map((img, imgIdx) => (
                                <div key={imgIdx} className="relative group">
                                  <img
                                    src={img}
                                    alt="Product"
                                    className="w-full h-20 object-cover rounded border border-border"
                                  />
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition"
                                    onClick={() =>
                                      removeImage(storage.id, color.id, imgIdx)
                                    }
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Add Color Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addColorVariant(storage.id)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Color
                </Button>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Flags */}
      <Card>
        <CardHeader>
          <CardTitle>Product Flags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.flags.isWeeklyTrending}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  flags: {
                    ...prev.flags,
                    isWeeklyTrending: e.target.checked,
                  },
                }))
              }
              className="w-4 h-4"
            />
            <span>Weekly Trending Products</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.flags.isMostPopular}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  flags: { ...prev.flags, isMostPopular: e.target.checked },
                }))
              }
              className="w-4 h-4"
            />
            <span>Most Popular Products</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.flags.isPremiumUsed}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  flags: { ...prev.flags, isPremiumUsed: e.target.checked },
                }))
              }
              className="w-4 h-4"
            />
            <span>Premium Used Phones</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.flags.isBestSelling}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  flags: { ...prev.flags, isBestSelling: e.target.checked },
                }))
              }
              className="w-4 h-4"
            />
            <span>Best Selling Smartphones</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.flags.isFlagship}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  flags: { ...prev.flags, isFlagship: e.target.checked },
                }))
              }
              className="w-4 h-4"
            />
            <span>Flagship Smartphones</span>
          </label>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3 sticky bottom-0 bg-background p-4 border-t border-border rounded-lg">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="flex-1"
        >
          {loading ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </div>
  );
}
