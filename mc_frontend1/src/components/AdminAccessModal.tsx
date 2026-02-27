import { useNavigate } from "react-router-dom"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface AdminAccessModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminAccessModal({ isOpen, onClose }: AdminAccessModalProps) {
  const navigate = useNavigate()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Admin Access Required</DialogTitle>
          <DialogDescription>
            You need admin privileges to access this section. Please contact the administrator if you believe you should have access.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => navigate("/")}>
            Go to Home
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
