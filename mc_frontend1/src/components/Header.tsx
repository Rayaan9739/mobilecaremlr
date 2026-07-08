import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MapPin,
  Clock,
  ChevronDown,
  Menu,
  X,
  Wrench,
  Bell,
  ShoppingCart,
  User,
  Package,
  UserCircle,
  MapPinIcon,
  HelpCircle,
  LogOut,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRepairBooking } from "@/contexts/RepairBookingContext";
import { useProducts, Product } from "@/contexts/ProductContext";
import { COMPANY_LOGO_SRC } from "@/utils/companyLogo";
import { resolveProductImage, getProductFallbackImage } from "@/utils/productImage";

const navItems = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Mobiles and Accessories", href: "/mobiles-accessories" },
  { name: "Services", href: "/services" },
  { name: "Offers", href: "/offers" },
  { name: "Contact", href: "/contact" },
];

const trendingSearches = ["iPhone", "Samsung", "Charger", "Earbuds", "Cases"];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountHover, setAccountHover] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { openModal, notifications } = useRepairBooking();
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const { isAuthenticated, logout, loading } = useAuth();
  const { products } = useProducts();

  const isAdminRoute = location.pathname.startsWith("/admin");

  // Close account dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountHover(false);
      }
      // Close search dropdown when clicking outside search container
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close search on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowDropdown(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSearchQuery = params.get("search") || "";

    if (location.pathname === "/products") {
      setSearchQuery(urlSearchQuery);
    } else if (!urlSearchQuery) {
      setSearchQuery("");
    }
  }, [location.pathname, location.search]);

  // Debounced live search filtering
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timer = setTimeout(() => {
      const q = trimmed.toLowerCase();
      const matched = products
        .filter((p) => {
          const haystack = [
            p.name,
            p.brand,
            p.category,
            p.colorName,
            p.storageOption,
          ].join(" ").toLowerCase();
          return haystack.includes(q);
        })
        .slice(0, 7);
      setSearchResults(matched);
      setShowDropdown(true);
      setSearchLoading(false);
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, products]);

  const unreadCount = notifications.filter((n) => !n.replied).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowDropdown(false);
    }
  };

  const handleResultClick = (product: Product) => {
    const type = String(product.category || "").toUpperCase() === "MOBILE" ? "new" : "accessory";
    navigate(`/product/${type}/${product.id}`);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const accountMenuItems = [
    { icon: Package, label: "Orders", subtitle: "Track your orders", path: "/account/orders" },
    { icon: UserCircle, label: "Personal Details", subtitle: "Name, Email, Phone Number", path: "/account/profile" },
    { icon: MapPinIcon, label: "Saved Address", subtitle: "Manage addresses", path: "/account/addresses" },
    { icon: HelpCircle, label: "Help and Support", subtitle: "Get assistance", path: "/account/support" },
    { icon: LogOut, label: "Log Out", subtitle: "Sign out of account", path: "/logout" },
  ];

  const renderSearchDropdown = () => (
    <AnimatePresence>
      {showDropdown && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-2xl z-50 overflow-hidden"
        >
          {searchResults.length === 0 ? (
            <div className="px-4 py-5 text-center text-muted-foreground text-xs md:text-sm">
              No products found for &ldquo;<span className="font-semibold text-foreground">{searchQuery}</span>&rdquo;
            </div>
          ) : (
            <>
              <div className="px-4 pt-3 pb-1 text-[10px] md:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Products
              </div>
              <div className="divide-y divide-gray-100">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleResultClick(product)}
                    className="w-full flex items-center gap-2.5 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 hover:bg-blue-50 transition-colors text-left group"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-[#f0f7ff] flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                      <img
                        src={resolveProductImage(product)}
                        alt={product.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => { e.currentTarget.src = getProductFallbackImage(); }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs md:text-sm font-semibold text-gray-800 truncate group-hover:text-primary transition-colors">
                        {product.name}
                      </p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">
                        {product.category && (
                          <span className="capitalize">{String(product.category).toLowerCase().replace(/_/g, " ")} &bull; </span>
                        )}
                        <span className="font-bold text-primary">
                          ₹{Number(product.price || 0).toLocaleString("en-IN")}
                        </span>
                      </p>
                    </div>
                    <Search className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-3 text-xs md:text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-colors text-center border-t border-gray-100"
              >
                View all results for &ldquo;{searchQuery}&rdquo;
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* ── Row 1: Top Info Bar ── */}
      <div className="bg-white border-b border-border text-foreground py-1.5 text-xs">
        <div className="container mx-auto px-2 sm:px-4 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
            <span className="flex min-w-0 items-center gap-1 text-muted-foreground sm:gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-[10px] font-medium sm:hidden">Kodialbail</span>
              <span className="hidden sm:inline font-medium">Kodialbail, Mangaluru</span>
            </span>
            <span className="flex min-w-0 items-center gap-1 text-muted-foreground sm:gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="whitespace-nowrap text-[10px] font-medium sm:hidden">9 AM – 8:30 PM</span>
              <span className="hidden sm:inline font-medium">Mon – Sat: 9:00 AM – 8:30 PM</span>
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-4 text-[10px] text-muted-foreground sm:text-xs">
            <Link to="/faq" className="hover:text-primary transition-colors font-medium hidden sm:inline">FAQ</Link>
            <Link to="/contact" className="hover:text-primary transition-colors font-medium hidden sm:inline">Support</Link>
            {!loading && isAuthenticated ? (
              <div className="relative" ref={accountRef}>
                <div
                  onMouseEnter={() => setAccountHover(true)}
                  onMouseLeave={() => setAccountHover(false)}
                  onClick={() => setAccountHover((p) => !p)}
                  className="cursor-pointer flex items-center gap-1 hover:text-primary transition-colors px-2 py-1"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="font-medium">Account</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
                <AnimatePresence>
                  {accountHover && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute top-full right-0 mt-2 w-72 bg-white border border-border rounded-xl shadow-elevated py-2 z-50"
                      onMouseEnter={() => setAccountHover(true)}
                      onMouseLeave={() => setAccountHover(false)}
                    >
                      {accountMenuItems.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => {
                            if (item.path === "/logout") { logout(); return; }
                            setAccountHover(false);
                            navigate(item.path);
                          }}
                          className="flex items-center gap-3 px-4 py-3 text-foreground hover:bg-accent/50 transition-colors w-full text-left"
                        >
                          <item.icon className="w-4 h-4 text-primary" />
                          <div>
                            <div className="font-semibold text-sm">{item.label}</div>
                            <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              !loading && (
                <Link to="/auth" className="hover:text-primary transition-colors font-medium">
                  Login / Sign Up
                </Link>
              )
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2: Logo + Search + Icons ── */}
      <div className="bg-white border-b border-border py-2.5 md:py-3">
        <div className="container mx-auto px-3 sm:px-4" ref={searchContainerRef}>
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
              <img src="/logo.jpg" alt="Mobile Care Logo" className="w-8 h-8 sm:w-9 sm:h-9 aspect-square object-contain rounded-xl" />
              <span className="text-sm sm:text-xl font-bold text-foreground leading-none whitespace-nowrap">
                Mobile <span className="text-red-600">Care</span>
              </span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-auto hidden md:block relative">
              <form onSubmit={handleSearch}>
                <div className="flex w-full rounded-full border-2 border-primary overflow-hidden shadow-soft">
                  <div className="flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground bg-accent/30 border-r border-border shrink-0">
                    <Search className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium hidden lg:inline">Search</span>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchQuery.trim().length >= 2) setShowDropdown(true);
                    }}
                    placeholder="Search for mobiles, accessories, brands..."
                    className="flex-1 px-4 py-2.5 text-sm text-foreground bg-white outline-none placeholder:text-muted-foreground/60"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 btn-gradient text-white text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
                  >
                    {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                  </button>
                </div>
              </form>

              {/* Live Search Dropdown */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 overflow-hidden"
                  >
                    {searchResults.length === 0 ? (
                      <div className="px-5 py-6 text-center text-muted-foreground text-sm">
                        No products found for &ldquo;<span className="font-semibold text-foreground">{searchQuery}</span>&rdquo;
                      </div>
                    ) : (
                      <>
                        <div className="px-4 pt-3 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Products
                        </div>
                        <div className="divide-y divide-gray-100">
                          {searchResults.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleResultClick(product)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left group"
                            >
                              {/* Thumbnail */}
                              <div className="w-12 h-12 rounded-xl bg-[#f0f7ff] flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                                <img
                                  src={resolveProductImage(product)}
                                  alt={product.name}
                                  className="w-full h-full object-contain p-1"
                                  onError={(e) => { e.currentTarget.src = getProductFallbackImage(); }}
                                />
                              </div>
                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-primary transition-colors">
                                  {product.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {product.category && (
                                    <span className="capitalize">{String(product.category).toLowerCase().replace(/_/g, " ")} &bull; </span>
                                  )}
                                  <span className="font-bold text-primary">
                                    ₹{Number(product.price || 0).toLocaleString("en-IN")}
                                  </span>
                                </p>
                              </div>
                              <Search className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </button>
                          ))}
                        </div>
                        {/* View all results link */}
                        <button
                          type="button"
                          onClick={() => {
                            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                            setShowDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-colors text-center border-t border-gray-100"
                        >
                          View all results for &ldquo;{searchQuery}&rdquo; &rarr;
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0">
              {isAdminRoute && (
                <button
                  type="button"
                  onClick={() => navigate("/admin/notifications")}
                  className="relative p-2 text-foreground hover:text-primary transition-colors rounded-full hover:bg-accent/50"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => navigate("/cart")}
                className="relative p-2 text-foreground hover:text-primary transition-colors rounded-full hover:bg-accent/50"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </button>
              <Button
                onClick={() => openModal()}
                className="btn-gradient text-white rounded-full px-4 md:px-6 text-sm shadow-soft hover:shadow-elevated transition-all hidden sm:flex"
              >
                <Wrench className="w-4 h-4 mr-1.5" />
                Book Repair
              </Button>
              {/* Mobile hamburger */}
              <button
                className="p-2 text-foreground lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="mt-2.5 md:hidden relative">
            <div className="flex w-full rounded-full border-2 border-primary overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setShowDropdown(true);
                }}
                placeholder="Search mobiles, accessories..."
                className="min-w-0 flex-1 px-4 py-2 text-xs text-foreground bg-white outline-none placeholder:text-muted-foreground/70"
              />
              <button type="submit" className="px-4 py-2 btn-gradient text-white">
                <Search className="w-4 h-4" />
              </button>
            </div>
            {renderSearchDropdown()}
          </form>
        </div>
      </div>

      {/* ── Row 3: Navigation ── */}
      <nav className="bg-primary">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide lg:gap-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`shrink-0 py-2.5 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap lg:py-3 lg:text-sm ${
                  location.pathname === item.href
                    ? "text-white border-white"
                    : "text-white/80 border-transparent hover:text-white hover:border-white/50"
                }`}
              >
                {item.name}
              </Link>
            ))}
            <div className="ml-auto hidden items-center gap-6 text-white/80 text-sm lg:flex">
              <button
                onClick={() => openModal()}
                className="flex items-center gap-1.5 hover:text-white transition-colors font-semibold"
              >
                🔥 Hot Deals
              </button>
              <Link to="/services" className="hover:text-white transition-colors">
                Book Repair
              </Link>
              <Link to="/contact" className="hover:text-white transition-colors">
                Store Locator
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden bg-white border-b border-border overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors ${
                    location.pathname === item.href
                      ? "text-primary bg-accent/50"
                      : "text-foreground hover:text-primary hover:bg-accent/30"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-3 border-t border-border">
                <Button
                  onClick={() => { openModal(); setMobileMenuOpen(false); }}
                  className="w-full btn-gradient text-white rounded-full"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Book Repair
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
