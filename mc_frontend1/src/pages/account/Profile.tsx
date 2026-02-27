import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AccountProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const persistedProfile = useMemo(() => {
    if (!user?.email) return null;
    try {
      const raw = localStorage.getItem(`mc_user_profile_${user.email}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [user?.email]);

  const derivedNames = useMemo(() => {
    const fullName =
      (persistedProfile?.fullName as string | undefined) ||
      user?.fullName ||
      "";
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ");
    return { firstName, lastName, fullName };
  }, [persistedProfile?.fullName, user?.fullName]);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "Male",
    dob: "",
  });

  useEffect(() => {
    setProfile((prev) => ({
      ...prev,
      firstName: persistedProfile?.firstName ?? derivedNames.firstName,
      lastName: persistedProfile?.lastName ?? derivedNames.lastName,
      email: user?.email ?? persistedProfile?.email ?? "",
      phone: persistedProfile?.phone ?? (user as any)?.phone ?? "",
      gender: persistedProfile?.gender ?? prev.gender,
      dob: persistedProfile?.dob ?? prev.dob,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, derivedNames.firstName, derivedNames.lastName]);

  const handleSave = async () => {
    setShowConfirmDialog(true);
  };

  const confirmSave = async () => {
    setShowConfirmDialog(false);
    if (!user?.email) return;
    setIsSaving(true);

    try {
      await api("/user/update-profile", {
        method: "PUT",
        body: JSON.stringify({
          fullName: `${profile.firstName} ${profile.lastName}`.trim(),
          phone: profile.phone,
          dob: profile.dob || null,
        }),
      });

      // Also save to localStorage for UI persistence
      localStorage.setItem(
        `mc_user_profile_${user.email}`,
        JSON.stringify({
          ...profile,
          fullName: `${profile.firstName} ${profile.lastName}`.trim(),
        })
      );

      toast({
        title: "Success",
        description: "Your profile has been updated successfully.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Personal Details</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name
          </label>
          <Input
            value={profile.firstName}
            onChange={(e) => setProfile({...profile, firstName: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name
          </label>
          <Input
            value={profile.lastName}
            onChange={(e) => setProfile({...profile, lastName: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <Input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({...profile, email: e.target.value})}
            disabled
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <Input
            value={profile.phone}
            onChange={(e) => setProfile({...profile, phone: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select 
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={profile.gender}
            onChange={(e) => setProfile({...profile, gender: e.target.value})}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth
          </label>
          <Input
            type="date"
            value={profile.dob}
            onChange={(e) => setProfile({...profile, dob: e.target.value})}
          />
        </div>
      </div>
      
      <div className="mt-6">
        <Button 
          onClick={handleSave} 
          className="bg-blue-600 hover:bg-blue-700"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Profile Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to update your personal details?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSave} className="bg-blue-600 hover:bg-blue-700">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
