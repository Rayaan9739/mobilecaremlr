import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminProvider } from "@/contexts/AdminContext";
import { CartProvider } from "@/contexts/CartContext";
import { RepairBookingProvider } from "@/contexts/RepairBookingContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProductProvider } from "@/contexts/ProductContext";
import { LoginModal } from "@/components/LoginModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RepairBookingModal } from "@/components/RepairBookingModal";
import { PopupAd } from "@/components/PopupAd";

import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Phones from "./pages/Phones";
import ProductDetail from "./pages/ProductDetail";
import Admin from "./pages/Admin";
import AdminNotifications from "./pages/AdminNotifications";
import AdminAddProduct from "./pages/AdminAddProduct";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import MobilesAccessories from "./pages/MobilesAccessories";
import Offers from "./pages/Offers";
import OfferDetail from "./pages/OfferDetail";
import Services from "./pages/Services";
import Cart from "./pages/Cart";
import Accessories from "./pages/Accessories";
import AccessoryCategory from "./pages/AccessoryCategory";
import CategoryPage from "./pages/CategoryPage";
import BrandPage from "./pages/BrandPage";
import Products from "./pages/Products";
import BestSellers from "./pages/BestSellers";
import AccountLayout from "./pages/AccountLayout";
import AccountOrders from "./pages/account/Orders";
import AccountProfile from "./pages/account/Profile";
import AccountAddresses from "./pages/account/Addresses";
import AccountSupport from "./pages/account/Support";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { showGuestModal, setShowGuestModal } = useAuth();

  return (
    <>

      <LoginModal
        isOpen={showGuestModal}
        onClose={() => setShowGuestModal(false)}
      />
      <RepairBookingModal />
      <PopupAd />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/phones/:type" element={<Phones />} />
        <Route path="/product/:type/:id" element={<ProductDetail />} />
        <Route path="/mobiles-accessories" element={<MobilesAccessories />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/offers/:id" element={<OfferDetail />} />
        <Route path="/services" element={<Services />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/accessories" element={<Accessories />} />
        <Route path="/accessories/:category" element={<AccessoryCategory />} />
        <Route path="/category/:categoryName" element={<CategoryPage />} />
        <Route path="/brand/:brandName" element={<BrandPage />} />
        <Route path="/brands/:brandName" element={<BrandPage />} />
        <Route path="/products" element={<Products />} />
        <Route path="/used-phones" element={<Products />} />
        <Route path="/used-phones/:id" element={<ProductDetail />} />
        <Route path="/all-products" element={<Products />} />
        <Route path="/best-sellers" element={<BestSellers />} />
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<AccountProfile />} />
          <Route path="orders" element={<AccountOrders />} />
          <Route path="profile" element={<AccountProfile />} />
          <Route path="addresses" element={<AccountAddresses />} />
          <Route path="support" element={<AccountSupport />} />
        </Route>
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/add-product"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminAddProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminNotifications />
            </ProtectedRoute>
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <ProductProvider>
          <AdminProvider>
            <CartProvider>
              <RepairBookingProvider>
                <TooltipProvider>
                <Toaster />
                <Sonner />
                <AppContent />
              </TooltipProvider>
              </RepairBookingProvider>
            </CartProvider>
          </AdminProvider>
        </ProductProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;


