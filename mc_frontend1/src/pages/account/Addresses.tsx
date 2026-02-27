import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Trash2, Edit2, Plus, MapPin, Check, Navigation } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Address {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefaultAddress: boolean;
}

export default function AccountAddresses() {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
    isDefault: false,
  });

  const fetchAddresses = async () => {
    try {
      const data = await api<Address | null>("/addresses/my");
      setAddresses(data ? [data] : []);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      landmark: "",
      isDefault: false,
    });
    setEditingAddress(null);
  };

  const openAddDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      name: "",
      phone: "",
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || "",
      isDefault: address.isDefaultAddress,
    });
    setShowDialog(true);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Error", description: "Geolocation is not supported by your browser", variant: "destructive" });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Use OpenStreetMap Nominatim API for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          const data = await response.json();
          
          if (data.address) {
            const addr = data.address;
            // Build a complete address string
            const fullAddress = [
              addr.house_number,
              addr.road,
              addr.neighbourhood,
              addr.suburb,
              addr.city || addr.town || addr.village || addr.county,
              addr.state,
              addr.postcode
            ].filter(Boolean).join(", ");
            
            setFormData({
              ...formData,
              addressLine1: fullAddress,
            });
            toast({ title: "Location Found", description: "Address fields auto-filled" });
          }
        } catch {
          toast({ title: "Error", description: "Failed to get address details", variant: "destructive" });
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast({ title: "Location access denied", description: "Please enter address manually", variant: "destructive" });
        } else {
          toast({ title: "Error", description: "Failed to get location", variant: "destructive" });
        }
      }
    );
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.addressLine1.trim()) {
      toast({ title: "Error", description: "Please enter your address", variant: "destructive" });
      return;
    }

    // Create address data for API
    const addressData = {
      addressLine1: formData.addressLine1,
    };

    try {
      if (editingAddress) {
        await api(`/addresses/${editingAddress.id}`, {
          method: "PATCH",
          body: JSON.stringify(addressData),
        });
        toast({ title: "Success", description: "Address updated successfully" });
      } else {
        await api("/addresses", {
          method: "POST",
          body: JSON.stringify(addressData),
        });
        toast({ title: "Success", description: "Address added successfully" });
      }
      setShowDialog(false);
      resetForm();
      fetchAddresses();
    } catch {
      toast({ title: "Error", description: "Failed to save address", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api(`/addresses/${id}`, { method: "DELETE" });
      toast({ title: "Success", description: "Address deleted successfully" });
      setShowDeleteConfirm(null);
      fetchAddresses();
    } catch {
      toast({ title: "Error", description: "Failed to delete address", variant: "destructive" });
    }
  };


  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Saved Addresses</h1>
        <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add New Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-10">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No saved addresses</p>
          <Button onClick={openAddDialog} className="mt-4 bg-blue-600 hover:bg-blue-700">
            Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div key={address.id} className="border border-gray-200 rounded-lg p-4 relative">
              <p className="font-medium">Saved Address</p>
              <p className="text-sm text-gray-600 mt-1">
                {address.addressLine1}
                {address.addressLine2 && <>, {address.addressLine2}</>}
              </p>
              {address.landmark && <p className="text-sm text-gray-500">Landmark: {address.landmark}</p>}
              <p className="text-sm text-gray-600">
                {address.city}, {address.state} - {address.pincode}
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(address)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => setShowDeleteConfirm(address.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
          </DialogHeader>
          
          {/* Use Current Location Button */}
          <Button
            variant="outline"
            onClick={handleUseCurrentLocation}
            disabled={isGettingLocation}
            className="w-full mb-3"
          >
            <Navigation className="w-4 h-4 mr-2" />
            {isGettingLocation ? "Getting Location..." : "Use Current Location"}
          </Button>
          
          <div className="grid gap-3 py-3">
            <textarea
              placeholder="Enter your complete address *"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              className="w-full border rounded-lg px-4 py-2 min-h-[100px] resize-none"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 w-full">
              {editingAddress ? "Update" : "Save"} Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
            <DialogDescription>Are you sure you want to delete this address?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
            <Button onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
