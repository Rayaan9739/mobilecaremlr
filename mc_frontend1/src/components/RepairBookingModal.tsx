import { motion, AnimatePresence } from "framer-motion";
import { X, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRepairBooking } from "@/contexts/RepairBookingContext";
import { REPAIR_ISSUES } from "@/constants/repairIssues";
import { isValidPhoneNumber, normalizePhoneInput } from "@/lib/phone";
import { useState } from "react";

export function RepairBookingModal() {
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const {
    isOpen,
    closeModal,
    formData,
    updateFormData,
    resetForm,
    addNotification,
    brands,
    modelsByBrand,
    loadingBrands,
    handleBrandChange,
    handleIssueToggle,
    isFormValid,
  } = useRepairBooking();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!isFormValid()) {
      toast.error("Please fill all required fields to submit.");
      return;
    }

    try {
      const ok = await addNotification(formData);
      if (!ok) {
        toast.error("Failed to submit. Please try again.");
        return;
      }

      toast.success(
        "Repair request received. Please visit the service center as selected.",
      );

      closeModal();
      resetForm();
      setSubmitAttempted(false);
    } catch (error) {
      toast.error("Failed to submit. Please try again.");
    }
  };

  const hasPhoneError =
    (submitAttempted || formData.mobileNumber.length > 0) &&
    !isValidPhoneNumber(formData.mobileNumber);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-accent p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Book a Repair
                  </h2>
                  <p className="text-white/80 text-sm">Quick and easy</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Form Content */}
            <form
              onSubmit={handleSubmit}
              className="overflow-y-auto p-6 space-y-6"
            >
              {/* Step 1: Phone Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Phone Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneBrand">Phone Brand *</Label>
                    <Select
                      value={formData.phoneBrand}
                      onValueChange={handleBrandChange}
                      disabled={loadingBrands}
                    >
                      <SelectTrigger id="phoneBrand">
                        <SelectValue
                          placeholder={
                            loadingBrands ? "Loading brands..." : "Select brand"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneModel">Phone Model *</Label>
                    {formData.phoneBrand === "Other" ? (
                      <Input
                        id="phoneModel"
                        value={formData.phoneModel}
                        onChange={(e) =>
                          updateFormData({ phoneModel: e.target.value })
                        }
                        placeholder="Enter phone model"
                        required
                      />
                    ) : (
                      <Select
                        value={formData.phoneModel}
                        onValueChange={(value) =>
                          updateFormData({ phoneModel: value })
                        }
                        disabled={
                          !formData.phoneBrand ||
                          modelsByBrand[formData.phoneBrand]?.length === 0
                        }
                      >
                        <SelectTrigger id="phoneModel">
                          <SelectValue
                            placeholder={
                              !formData.phoneBrand
                                ? "Select brand first"
                                : "Select model"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.phoneBrand &&
                            modelsByBrand[formData.phoneBrand]?.map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 2: What's Wrong */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">
                  What's Wrong With the Phone?
                </h3>

                <div className="space-y-3">
                  {REPAIR_ISSUES.map((issue) => (
                    <div key={issue} className="flex items-center space-x-2">
                      <Checkbox
                        id={`issue-${issue}`}
                        checked={formData.issues.includes(issue)}
                        onCheckedChange={() => handleIssueToggle(issue)}
                      />
                      <Label
                        htmlFor={`issue-${issue}`}
                        className="font-normal cursor-pointer"
                      >
                        {issue}
                      </Label>
                    </div>
                  ))}
                </div>

                {formData.issues.includes("Something else") && (
                  <div className="space-y-2 mt-3">
                    <Label htmlFor="otherIssue">
                      Briefly explain the problem *
                    </Label>
                    <Textarea
                      id="otherIssue"
                      value={formData.otherIssue}
                      onChange={(e) =>
                        updateFormData({ otherIssue: e.target.value })
                      }
                      placeholder="Tell us what's wrong..."
                      rows={3}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Step 4: Contact Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Contact Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateFormData({ name: e.target.value })}
                      placeholder="Your name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">Mobile Number *</Label>
                    <Input
                      id="mobileNumber"
                      type="tel"
                      value={formData.mobileNumber}
                      onChange={(e) =>
                        updateFormData({
                          mobileNumber: normalizePhoneInput(e.target.value),
                        })
                      }
                      placeholder="10-digit number"
                      pattern="^\+?[0-9]{10,}$"
                      required
                    />
                    {hasPhoneError && (
                      <p className="text-xs text-red-500">
                        Please enter a valid phone number
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3: Visit Preference */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Visit Preference
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="visitDate">
                    When will you visit the service center? *
                  </Label>
                  <Input
                    id="visitDate"
                    type="date"
                    value={formData.visitDate}
                    onChange={(e) =>
                      updateFormData({ visitDate: e.target.value })
                    }
                    min={getTodayDate()}
                    required
                  />
                </div>

                {/* Professional Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
                  <p className="leading-relaxed">
                    <span className="font-semibold">Note:</span> Billing details
                    will be sent to your registered mobile number. Please visit
                    the service center for a complete diagnosis and further
                    assistance with your device.
                  </p>
                </div>
              </div>

              {/* Confirmation */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Checkbox
                    id="contactConsent"
                    checked={formData.contactConsent}
                    onCheckedChange={(checked) =>
                      updateFormData({ contactConsent: checked as boolean })
                    }
                  />
                  <Label
                    htmlFor="contactConsent"
                    className="font-normal cursor-pointer text-sm leading-relaxed"
                  >
                    I agree to be contacted about my phone repair. *
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormValid()}
                  className="flex-1 btn-gradient"
                >
                  Submit Request
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
