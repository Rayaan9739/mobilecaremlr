# Product Variant System - Visual Guide

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN PANEL - ADD PRODUCT                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                   ┌───────────────────┐
                   │ Choose Form Type  │
                   │  ○ Variant Form   │ ← You're here!
                   │  ○ Standard Form  │
                   └───────────────────┘
                              │
                              ▼
            ┌───────────────────────────────────────┐
            │    FILL BASIC INFO (Q1-Q10)           │
            │  1. Product Name                      │
            │  2. Brand                             │
            │  3. Description                       │
            │  4. Category                          │
            │  5. Selling Price                     │
            │  6. Original Price                    │
            │  7. Discount (auto-calculated)        │
            │  8. Stock                             │
            │  9. Rating                            │
            │  10. Images (max 4)                   │
            └───────────────────────────────────────┘
                              │
                              ▼
                   ┌───────────────────┐
                   │  ADD FIRST COLOR  │
                   │  (Q11)            │
                   ├───────────────────┤
                   │ Color Name        │ → e.g., Midnight Black
                   │ Hex Color         │ → #000000
                   │ Color Images      │ → 4 images per color
                   └───────────────────┘
                              │
                              ▼
                ┌──────────────────────────────┐
                │ PRODUCT CREATED! ✓           │
                │ (First product in DB)        │
                └──────────────────────────────┘
                              │
                              ▼
               ┌────────────────────────────────┐
               │  ADD STORAGE VARIANTS (Q12)    │
               │  (Optional - per color)        │
               ├────────────────────────────────┤
               │ Storage: 6GB+128GB - ₹15,999   │ → Creates product variant
               │ Storage: 8GB+256GB - ₹18,999   │ → Creates product variant
               └────────────────────────────────┘
                              │
                              ▼
               ┌────────────────────────────────┐
               │  ADD MORE COLORS (Optional)    │
               │  (Q11 again)                   │
               ├────────────────────────────────┤
               │ Color: Silver                  │ → New color variant
               │  + Storage variants per color  │
               └────────────────────────────────┘
                              │
                              ▼
                  ┌──────────────────────┐
                  │ CLICK "CREATE ALL"   │
                  │ ALL PRODUCTS CREATED │
                  └──────────────────────┘
```

## Product Creation Examples

### Example 1: Simple Product
```
INPUT:
└─ Samsung Galaxy A17
   └─ Midnight Black
      (no storage variants)

DATABASE RESULT (1 product):
├─ id: prod_001
├─ name: "Samsung Galaxy A17"
├─ colorName: "Midnight Black"
├─ storageOption: null
├─ price: 15999
└─ stock: 50
```

### Example 2: Same Color, Different Storage
```
INPUT:
└─ Samsung Galaxy A17
   └─ Midnight Black
      ├─ 6GB+128GB (₹15,999, 50 stock)
      └─ 8GB+256GB (₹18,999, 30 stock)

DATABASE RESULT (2 products):
├─ prod_001: Galaxy A17 - Midnight Black (6GB+128GB) | 15999 | 50 stock
└─ prod_002: Galaxy A17 - Midnight Black (8GB+256GB) | 18999 | 30 stock
```

### Example 3: Multiple Colors & Storage
```
INPUT:
└─ Samsung Galaxy A17
   ├─ Midnight Black
   │  ├─ 6GB+128GB (₹15,999, 50 stock)
   │  └─ 8GB+256GB (₹18,999, 30 stock)
   └─ Silver
      ├─ 6GB+128GB (₹15,999, 40 stock)
      └─ 8GB+256GB (₹18,999, 25 stock)

DATABASE RESULT (4 products):
├─ prod_001: Galaxy A17 - Midnight Black (6GB+128GB) | 15999 | 50 stock
├─ prod_002: Galaxy A17 - Midnight Black (8GB+256GB) | 18999 | 30 stock
├─ prod_003: Galaxy A17 - Silver (6GB+128GB) | 15999 | 40 stock
└─ prod_004: Galaxy A17 - Silver (8GB+256GB) | 18999 | 25 stock
```

## UI Layout

### Main Form Section
```
┌─────────────────────────────────────────────────────┐
│ PRODUCT INFORMATION (QUESTIONS 1-10)               │
├─────────────────────────────────────────────────────┤
│ Q1. Product Name: ___________________________      │
│ Q2. Brand: [Samsung ▼]                            │
│ Q3. Description: _____________________________     │
│ Q4. Category: [MOBILE ▼]                          │
│ Q5. Selling Price (₹): ___________  Q6. Original  │
│ Q7. Discount (₹): ___________ [auto-calc]        │
│ Q8. Stock: __________  Q9. Rating: __________    │
│ Q10. Images (max 4):  [IMG1] [IMG2] [IMG3] [IMG4]│
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Q11. COLOR VARIANTS                                 │
├─────────────────────────────────────────────────────┤
│ ○ No colors added yet                              │
│   (First color will create the product)            │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ ▼ SHOW COLOR ENTRY FORM                    │   │
│ ├─────────────────────────────────────────────┤   │
│ │ Color Name: ________________________        │   │
│ │ Color Code: [Color Picker] [#000000]       │   │
│ │ Color Images: [IMG1] [IMG2] [IMG3] [IMG4] │   │
│ │                                            │   │
│ │ [✓ Create Product with This Color]        │   │
│ │     or                                     │   │
│ │ [+ Add This Color as Variant]              │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘

For each color:
┌─────────────────────────────────────────────────────┐
│ ▼ Midnight Black [████]  (1 color added)           │
├─────────────────────────────────────────────────────┤
│ [Color Preview Images]                             │
│                                                     │
│ STORAGE VARIANTS:                                  │
│ ├─ 6GB+128GB | ₹15,999 | Stock: 50 | [✕]        │
│ └─ 8GB+256GB | ₹18,999 | Stock: 30 | [✕]        │
│                                                     │
│ ┌──────────────────────────────────────────┐      │
│ │ ▼ ADD STORAGE VARIANT                   │      │
│ ├──────────────────────────────────────────┤      │
│ │ Storage: ________________  (e.g. 8+256) │      │
│ │ Price (₹): _________  Original: _______ │      │
│ │ Stock: ________                          │      │
│ │ [+ Add Storage Variant]                  │      │
│ └──────────────────────────────────────────┘      │
│                                                     │
│ [✕ Remove Color]                                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                                                     │
│ [Cancel]  [✓ Create All Products]                 │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Question Flow Chart

```
START
  │
  ├─→ Q1: Product Name
  ├─→ Q2: Brand
  ├─→ Q3: Description
  ├─→ Q4: Category
  ├─→ Q5: Selling Price
  ├─→ Q6: Original Price → [Auto-calc Q7: Discount]
  ├─→ Q8: Stock
  ├─→ Q9: Rating
  ├─→ Q10: Images
  │
  └─→ Q11: ADD FIRST COLOR
       ├─→ Color Name
       ├─→ Color Code (HEX)
       ├─→ Color Images (4 max)
       │
       ├─→ [CREATE PRODUCT] ← First product created!
       │
       └─→ Q12: ADD STORAGE VARIANTS (per color)
           ├─→ Storage Capacity
           ├─→ Price
           ├─→ Original Price
           ├─→ Stock
           └─→ [ADD STORAGE] → Creates product variant
           
       └─→ Repeat Q11 for more colors
       
  └─→ [CREATE ALL PRODUCTS] ← Submit all at once
```

## Color Card Interaction

```
┌────────────────────────────────┐
│ ▼ Midnight Black  [████]       │ ← Click to expand/collapse
├────────────────────────────────┤
│                                │
│ [EXPANDED VIEW]                │
│                                │
│ Color preview images           │
│ Storage variants list          │
│ Add storage variant button     │
│ Remove color button            │
│                                │
└────────────────────────────────┘
```

## Data Flow

```
USER INPUT
    │
    ├─ Q1-Q10: Base Product Info
    │
    ├─ Q11: Color Details
    │   ├─ colorName: "Midnight Black"
    │   ├─ colorHex: "#000000"
    │   └─ images: [url1, url2, url3, url4]
    │
    ├─ Q12: Storage Variants (per color)
    │   ├─ storage: "6GB+128GB"
    │   ├─ price: 15999
    │   ├─ originalPrice: 19999
    │   └─ stock: 50
    │
    ▼
FORM PROCESSING
    │
    ├─ Validation
    ├─ Create products array
    │   └─ For each color + storage combination:
    │       └─ Create product object
    │
    ▼
DATABASE
    │
    └─ Insert all products in batch
```

## Price Calculation Logic

```
When you enter:
  Q5: Selling Price = 15,999
  Q6: Original Price = 19,999

Then:
  Q7: Discount = ((Original - Selling) / Original) × 100
             = ((19,999 - 15,999) / 19,999) × 100
             = 20%
```

For storage variants:
```
Storage 1: Price = 15,999, Original = 19,999
  → Discount = 20%

Storage 2: Price = 18,999, Original = 22,999
  → Discount = 17.4%
  (Each storage can have different discount)
```

## Image Management

```
Product Level (Q10): 4 image slots
  [Img1: ________]  [Img2: ________]
  [Img3: ________]  [Img4: ________]

Color Level (Q11): 4 image slots per color
  [Img1: ________]  [Img2: ________]
  [Img3: ________]  [Img4: ________]

Database Storage:
  Product.images = [url1, url2, url3, url4] (from Q10)
  
  If color has images:
    Use color images for that product
  Else:
    Fall back to product images
```
