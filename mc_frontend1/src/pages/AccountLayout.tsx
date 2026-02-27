import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { 
  Package, 
  UserCircle, 
  MapPinIcon, 
  HelpCircle, 
  LogOut 
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const accountMenuItems = [
  { icon: Package, label: "Orders", path: "/account/orders" },
  { icon: UserCircle, label: "Personal Details", path: "/account/profile" },
  { icon: MapPinIcon, label: "Saved Address", path: "/account/addresses" },
  { icon: HelpCircle, label: "Help and Support", path: "/account/support" },
];

export default function AccountLayout() {
  const location = useLocation();
  const { user } = useAuth();

  const getUserName = () => {
    if (user?.fullName) return user.fullName;
    // Try to get from localStorage
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.fullName || 'User';
      }
    } catch {}
    return 'User';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-32 md:pt-40 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Left Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Hello,</div>
                    <div className="text-sm text-gray-600">{getUserName()}</div>
                  </div>
                </div>
                
                <nav className="space-y-1">
                  {accountMenuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        location.pathname === item.path
                          ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  ))}
                  
                  <button
                    onClick={() => {
                      // Clear all authentication data
                      localStorage.removeItem('token');
                      localStorage.removeItem('role');
                      localStorage.removeItem('user');
                      localStorage.removeItem('authToken');
                      sessionStorage.clear();
                      // Redirect to home page
                      window.location.href = '/';
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </nav>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}