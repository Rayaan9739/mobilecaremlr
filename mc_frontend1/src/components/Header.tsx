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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRepairBooking } from "@/contexts/RepairBookingContext";

const navItems = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Mobiles and Accessories", href: "/mobiles-accessories" },
  { name: "Services", href: "/services" },
  { name: "Offers", href: "/offers" },
  { name: "Contact", href: "/contact" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountHover, setAccountHover] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const { openModal, notifications } = useRepairBooking();
  const navigate = useNavigate();
  const location = useLocation();
  const { totalItems } = useCart();
  const { isAuthenticated, logout, loading } = useAuth();

  const isAdminRoute = location.pathname.startsWith("/admin");

  // close account menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
        setAccountHover(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  const unreadCount = notifications.filter((n) => !n.replied).length;

  const accountMenuItems = [
    {
      icon: Package,
      label: "Orders",
      subtitle: "Track your orders",
      path: "/account/orders",
    },
    {
      icon: UserCircle,
      label: "Personal Details",
      subtitle: "Name, Email, Phone Number",
      path: "/account/profile",
    },
    {
      icon: MapPinIcon,
      label: "Saved Address",
      subtitle: "Manage addresses",
      path: "/account/addresses",
    },
    {
      icon: HelpCircle,
      label: "Help and Support",
      subtitle: "Get assistance",
      path: "/account/support",
    },
    {
      icon: LogOut,
      label: "Log Out",
      subtitle: "Sign out of account",
      path: "/logout",
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Info Bar */}
      <div className="bg-foreground text-primary-foreground py-2 text-xs sm:text-sm">
        <div className="container mx-auto px-3 sm:px-4 flex items-center justify-between flex-wrap gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap min-w-0">
            <span className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
              <span className="hidden sm:inline">Kodialbail, Mangaluru</span>
            </span>
            <span className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
              <span className="hidden sm:inline">
                Mon – Sat: 9:00 AM – 8:30 PM
              </span>
            </span>
          </div>
          <div className="flex items-center justify-end gap-3 sm:gap-6 flex-wrap">
            <Link to="/faq" className="hover:text-primary transition-colors">
              FAQ
            </Link>
            <Link
              to="/contact"
              className="hover:text-primary transition-colors"
            >
              Support
            </Link>
            {!loading && isAuthenticated ? (
              <div className="relative">
                <div
                  ref={accountRef}
                  onMouseEnter={() => setAccountHover(true)}
                  onMouseLeave={() => setAccountHover(false)}
                  onClick={() => setAccountHover((prev) => !prev)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-1 hover:text-primary transition-colors px-2 py-1">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Account</span>
                    <ChevronDown className="w-3 h-3" />
                  </div>

                  <AnimatePresence>
                    {accountHover && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl py-3 z-50"
                        onMouseEnter={() => setAccountHover(true)}
                        onMouseLeave={() => setAccountHover(false)}
                      >
                        {accountMenuItems.map((item) => (
                          <button
                            key={item.path}
                            onClick={() => {
                              if (item.path === "/logout") {
                                logout();
                                return;
                              }
                              setAccountHover(false);
                              navigate(item.path);
                            }}
                            className="flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-gray-50 transition-colors w-full text-left"
                          >
                            <item.icon className="w-5 h-5 text-gray-600" />
                            <div>
                              <div className="font-medium text-sm">
                                {item.label}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.subtitle}
                              </div>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              !loading && (
                <Link
                  to="/auth"
                  className="hover:text-primary transition-colors"
                >
                  Login / Sign Up
                </Link>
              )
            )}
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="bg-card/95 backdrop-blur-lg shadow-soft border-b border-border">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4 min-w-0">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 min-w-0">
              <img
                src="/logo.png"
                alt="MobileCare Logo"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover shrink-0"
              />
              <span className="text-sm sm:text-xl font-bold text-foreground leading-none truncate">
                Mobile<span className="text-primary"> Care</span>
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-foreground hover:text-primary transition-colors font-medium pb-1 border-b-2 ${
                    location.pathname === item.href
                      ? "text-primary border-primary"
                      : "border-transparent"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {isAdminRoute && (
                <button
                  type="button"
                  onClick={() => navigate("/admin/notifications")}
                  className="relative p-2 text-foreground hover:text-primary transition-colors rounded-full hover:bg-primary/10"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => navigate("/cart")}
                className="relative p-2 text-foreground hover:text-primary transition-colors rounded-full hover:bg-primary/10"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {totalItems}
                  </span>
                )}
              </button>
              <Button
                onClick={() => openModal()}
                className="btn-gradient text-primary-foreground rounded-full px-6 shadow-soft hover:shadow-elevated transition-all"
              >
                <Wrench className="w-4 h-4 mr-2" />
                Book Repair →
              </Button>
            </div>

            <div className="lg:hidden flex items-center gap-1 sm:gap-2 shrink-0">
              {isAdminRoute && (
                <button
                  type="button"
                  onClick={() => navigate("/admin/notifications")}
                  className="relative p-1.5 sm:p-2 text-foreground hover:text-primary transition-colors rounded-full hover:bg-primary/10"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-medium">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              )}
              <Button
                onClick={() => openModal()}
                size="sm"
                className="btn-gradient text-primary-foreground rounded-full px-2 sm:px-3 text-xs h-8 shadow-soft hover:shadow-elevated transition-all"
              >
                <Wrench className="w-3 h-3 sm:mr-1.5" />
                <span className="hidden sm:inline">Book Repair</span>
              </Button>
              <button
                onClick={() => navigate("/cart")}
                className="relative p-1.5 sm:p-2 text-foreground hover:text-primary transition-colors rounded-full hover:bg-primary/10"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
                    {totalItems}
                  </span>
                )}
              </button>
              <button
                className="p-1.5 sm:p-2 text-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="lg:hidden overflow-hidden"
              >
                <div className="py-4 space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`block py-2 text-sm text-foreground hover:text-primary transition-colors font-medium ${
                        location.pathname === item.href ? "text-primary" : ""
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <Button
                    onClick={() => {
                      openModal();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full btn-gradient text-primary-foreground rounded-full mt-4"
                  >
                    <Wrench className="w-4 h-4 mr-2" />
                    Book Repair →
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </header>
  );
}
