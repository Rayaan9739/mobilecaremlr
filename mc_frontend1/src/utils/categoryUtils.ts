// Category-based product filtering utility
// Supports keyword-based matching for special categories

import { Product } from "@/contexts/ProductContext";

// Category keyword definitions
export const CATEGORY_KEYWORDS = {
  audio: {
    categories: ["HEADPHONES", "SPEAKERS"],
    keywords: [
      "headphone",
      "earphone",
      "speaker",
      "audio",
      "sound",
      "bluetooth",
      "wireless",
      "earbuds",
      "neckband",
      "hearable",
      "earbud",
      "headset",
      "tws",
      "anc",
      "noise cancelling",
    ],
  },
  sports: {
    categories: [],
    keywords: [
      "sport",
      "sports",
      "gym",
      "fitness",
      "workout",
      "outdoor",
      "training",
      "running",
      "exercise",
      "athletic",
      "yoga",
      "cycling",
      "swimming",
      "hiking",
      "camping",
    ],
  },
  photography: {
    categories: ["CAMERA"],
    keywords: [
      "camera",
      "dslr",
      "lens",
      "photography",
      "tripod",
      "zoom",
      "photo",
      "video",
      "mirrorless",
      "canon",
      "nikon",
      "sony",
      "gopro",
      "action camera",
    ],
  },
  smartwatch: {
    categories: ["SMART_WATCH"],
    keywords: [
      "smartwatch",
      "watch",
      "wearable",
      "fitness watch",
      "smart watch",
      "band",
      "fitness band",
      "tracker",
      "apple watch",
      "galaxy watch",
      "mi band",
    ],
  },
  adaptor: {
    categories: ["ADAPTOR"],
    keywords: [
      "adaptor",
      "adapter",
      "converter",
      "dongle",
      "connector",
      "usb-c to 3.5mm",
      "otg",
    ],
  },
};

/**
 * Check if a product matches a special category
 * @param product - Product to check
 * @param categoryKey - Special category key (audio, sports, photography, smartwatch)
 * @returns true if product matches the category
 */
export function matchesCategory(
  product: Product,
  categoryKey: string,
): boolean {
  const config =
    CATEGORY_KEYWORDS[categoryKey as keyof typeof CATEGORY_KEYWORDS];
  if (!config) return false;

  // Check exact category match
  if (
    config.categories.length > 0 &&
    config.categories.includes(product.category)
  ) {
    return true;
  }

  // Check keywords in name and description (case-insensitive)
  const searchText =
    `${product.name} ${product.description || ""}`.toLowerCase();
  return config.keywords.some((keyword) =>
    searchText.includes(keyword.toLowerCase()),
  );
}

/**
 * Get display title for special category
 */
export const SPECIAL_CATEGORY_TITLES = {
  audio: "Audio Products",
  sports: "Sports & Outdoors",
  photography: "Photography",
  smartwatch: "Smart Watches",
  adaptor: "Adaptors & Converters",
};
