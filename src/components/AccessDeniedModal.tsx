import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Lock, Mail, X } from 'lucide-react'

interface AccessDeniedModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  featureName?: string
  requiredRole?: string[]
  requiredModule?: string
}

export function AccessDeniedModal({ 
  open, 
  onOpenChange, 
  featureName = "this feature",
  requiredRole,
  requiredModule 
}: AccessDeniedModalProps) {
  const [isContactingAdmin, setIsContactingAdmin] = useState(false)

  const handleContactAdmin = () => {
    setIsContactingAdmin(true)
    // Simulate sending a request
    setTimeout(() => {
      setIsContactingAdmin(false)
      onOpenChange(false)
      // You could add actual email functionality here
    }, 2000)
  }

  const getRequirementText = () => {
    if (requiredRole && requiredRole.length > 0) {
      return `This feature requires ${requiredRole.join(' or ')} role.`
    }
    if (requiredModule) {
      return `This feature requires access to the ${requiredModule} module.`
    }
    return "You don't have permission to access this feature."
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Access Restricted
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-left space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 font-medium">
                You don't have access to {featureName}
              </p>
              <p className="text-amber-700 text-sm mt-1">
                {getRequirementText()}
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Need access?</strong> Contact your administrator to request permission for this feature.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={handleContactAdmin}
            disabled={isContactingAdmin}
            className="flex items-center gap-2"
            variant="default"
          >
            <Mail className="h-4 w-4" />
            {isContactingAdmin ? 'Sending Request...' : 'Contact Admin for Access'}
          </Button>
          
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook to manage access denied modal
export function useAccessDeniedModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [modalProps, setModalProps] = useState<{
    featureName?: string
    requiredRole?: string[]
    requiredModule?: string
  }>({})

  const showAccessDenied = (props: {
    featureName?: string
    requiredRole?: string[]
    requiredModule?: string
  }) => {
    setModalProps(props)
    setIsOpen(true)
  }

  const hideAccessDenied = () => {
    setIsOpen(false)
    setModalProps({})
  }

  return {
    isOpen,
    modalProps,
    showAccessDenied,
    hideAccessDenied,
    AccessDeniedModal: () => (
      <AccessDeniedModal
        open={isOpen}
        onOpenChange={setIsOpen}
        {...modalProps}
      />
    )
  }
}