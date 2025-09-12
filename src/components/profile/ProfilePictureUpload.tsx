import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload, Camera, Loader2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'

interface ProfilePictureUploadProps {
  currentImage?: string
  userName: string
  onUploadSuccess?: (newImageUrl: string) => void
}

export function ProfilePictureUpload({ 
  currentImage, 
  userName, 
  onUploadSuccess 
}: ProfilePictureUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, or WebP)')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Image must be smaller than 5MB')
      return
    }

    // Set selected file and preview
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first')
      return
    }

    setIsUploading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Authentication required')
        return
      }

      // Get employee details to update the documents array
      const { data: employeeDetails, error: employeeError } = await supabase
        .from('employees_details')
        .select('*')
        .eq('personal_email', user.email)
        .single()

      if (employeeError || !employeeDetails) {
        toast.error('Unable to find user profile')
        return
      }

      // Generate unique filename
      const timestamp = Date.now()
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `profile_${timestamp}.${fileExt}`
      const filePath = `profile-pictures/${employeeDetails.id}/${fileName}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get signed URL for the new image
      const { data: signedUrlData } = await supabase.storage
        .from('employee-documents')
        .createSignedUrl(filePath, 3600)

      // Update documents array - remove old profile picture and add new one
      const updatedDocuments = (employeeDetails.documents || []).filter(
        (doc: any) => doc.type !== 'Photo'
      )

      const newDocument = {
        type: 'Photo',
        filename: selectedFile.name,
        path: filePath,
        size: selectedFile.size,
        mime_type: selectedFile.type,
        uploaded_at: new Date().toISOString()
      }

      updatedDocuments.push(newDocument)

      // Update employee details with new documents array
      const { error: updateError } = await supabase
        .from('employees_details')
        .update({ documents: updatedDocuments })
        .eq('id', employeeDetails.id)

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`)
      }

      toast.success('Profile picture updated successfully!')
      
      // Call success callback with new image URL
      if (onUploadSuccess && signedUrlData?.signedUrl) {
        onUploadSuccess(signedUrlData.signedUrl)
      }

      // Reset state and close dialog
      setSelectedFile(null)
      setPreviewUrl(null)
      setIsOpen(false)

    } catch (error) {
      console.error('Profile picture upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update profile picture')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="relative group cursor-pointer">
          <Avatar className="w-24 h-24">
            <AvatarImage src={currentImage || ""} alt={userName} />
            <AvatarFallback className="text-2xl font-bold">
              {getUserInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Profile Picture</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current/Preview Image */}
          <div className="flex justify-center">
            <Avatar className="w-32 h-32">
              <AvatarImage 
                src={previewUrl || currentImage || ""} 
                alt={userName}
              />
              <AvatarFallback className="text-3xl font-bold">
                {getUserInitials(userName)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* File Input */}
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose New Picture
            </Button>

            {selectedFile && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Size: {Math.round(selectedFile.size / 1024)}KB
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1"
              disabled={isUploading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            
            <Button
              onClick={handleUpload}
              className="flex-1"
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {isUploading ? 'Uploading...' : 'Update'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}