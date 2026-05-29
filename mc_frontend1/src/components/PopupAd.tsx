import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchPublicResources, PublicResource } from "@/lib/publicResources";

export function PopupAd() {
  const navigate = useNavigate();
  const location = useLocation();
  const [popup, setPopup] = useState<PublicResource | null>(null);

  useEffect(() => {
    const loadPopup = async () => {
      if (location.pathname !== "/") {
        setPopup(null);
        return;
      }

      try {
        const resources = await fetchPublicResources("popup");
        const nextPopup = resources.find((item) => {
          if (sessionStorage.getItem(`popup-dismissed-${item.id}`)) return false;
          return item.enabled;
        });
        setPopup(nextPopup || null);
      } catch (error) {
        console.error("Failed to load popup:", error);
      }
    };

    loadPopup();
    window.addEventListener("mc_popup_update", loadPopup);
    window.addEventListener("storage", loadPopup);

    return () => {
      window.removeEventListener("mc_popup_update", loadPopup);
      window.removeEventListener("storage", loadPopup);
    };
  }, [location.pathname]);

  if (!popup) return null;

  const image = String(popup.data?.image || "");
  const message = String(popup.data?.message || "");
  const hasOfferProducts =
    Array.isArray(popup.data?.offerProducts) && popup.data.offerProducts.length > 0;
  const link = String(popup.data?.link || (hasOfferProducts ? `/offers/${popup.id}` : ""));

  const closePopup = () => {
    sessionStorage.setItem(`popup-dismissed-${popup.id}`, "true");
    setPopup(null);
  };

  const openLink = () => {
    if (!link) return;
    closePopup();
    navigate(link);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-border bg-white shadow-2xl">
        <button
          type="button"
          onClick={closePopup}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-foreground shadow-md hover:bg-gray-100"
          aria-label="Close popup"
        >
          <X className="h-5 w-5" />
        </button>
        {image ? (
          <button type="button" onClick={openLink} className="block w-full">
            <img
              src={image}
              alt={popup.title || "Advertisement"}
              className="max-h-[60vh] w-full object-cover"
            />
          </button>
        ) : null}
        <div className="p-4">
          <h2 className="pr-8 text-lg font-bold text-foreground">
            {popup.title || "Offer"}
          </h2>
          {message ? (
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {message}
            </p>
          ) : null}
          {link ? (
            <button
              type="button"
              onClick={openLink}
              className="mt-3 text-sm font-semibold text-primary"
            >
              View Details
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
