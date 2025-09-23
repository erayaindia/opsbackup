import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Camera, Upload } from 'lucide-react';
import {
  ContentCreator,
  CreatorRole,
  CreatorStatus,
  CreatorAvailability,
  PaymentCycle,
  CommunicationChannel,
} from '@/types/contentCreator';

interface AddCreatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCreator: (creator: Omit<ContentCreator, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const CREATOR_ROLES: CreatorRole[] = [
  'Videographer', 'Editor', 'UGC Creator', 'Influencer', 'Agency', 'Model',
  'Designer', 'Photographer', 'Copywriter', 'Voice Actor', 'Animator'
];

const CREATOR_STATUSES: CreatorStatus[] = ['Active', 'Onboarding', 'Paused', 'Rejected'];
const CREATOR_AVAILABILITIES: CreatorAvailability[] = ['Free', 'Limited', 'Busy'];
const PAYMENT_CYCLES: PaymentCycle[] = ['Per Project', 'Monthly', 'Weekly', 'Custom'];
const COMMUNICATION_CHANNELS: CommunicationChannel[] = ['Email', 'WhatsApp', 'Phone'];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry'
];

export const AddCreatorModal: React.FC<AddCreatorModalProps> = ({
  open,
  onOpenChange,
  onCreateCreator,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const tabs = ['info', 'rates'];
  const tabNames = ['Creator Info', 'Rates & Payment'];
  const currentTabIndex = tabs.indexOf(activeTab);
  const isLastTab = currentTabIndex === tabs.length - 1;
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    role: '' as CreatorRole,
    status: 'Active' as CreatorStatus,
    availability: 'Free' as CreatorAvailability,
    rating: 0,

    // Contact
    email: '',
    phone: '',
    whatsapp: '',
    socialLinks: {
      instagram: '',
      youtube: '',
      portfolio: '',
    },
    preferredCommunication: 'WhatsApp' as CommunicationChannel,

    // Shipping Address
    shippingAddress: {
      fullAddress: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      alternatePhone: '',
    },

    // Rate Card
    baseRate: '' as any,
    unit: 'per deliverable',
    paymentCycle: 'Per Project' as PaymentCycle,
    advancePercentage: 0,

    // Initial Payment
    initialPayment: 0,
  });

  const handleInputChange = (field: string, value: string | number) => {
    if (field.startsWith('socialLinks.')) {
      const socialField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value,
        },
      }));
    } else if (field.startsWith('shippingAddress.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          [addressField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Check file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('Only JPG, PNG, and WebP formats are allowed');
        return;
      }

      setProfileImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview('');
  };

  // Clean up image preview URL when modal closes
  React.useEffect(() => {
    if (!open) {
      setProfileImage(null);
      setImagePreview('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check required fields
    if (!formData.name || !formData.role || !formData.email || !formData.phone || !formData.whatsapp ||
        !formData.shippingAddress.fullAddress || !formData.shippingAddress.city || !formData.shippingAddress.state ||
        !formData.shippingAddress.pincode || !formData.shippingAddress.phone ||
        !formData.baseRate || formData.rating <= 0) {
      alert('Please fill in all required fields including a valid rating (greater than 0)');
      return;
    }

    // Check at least one social media link is provided
    const hasSocialLink = formData.socialLinks.portfolio?.trim() || formData.socialLinks.instagram?.trim() || formData.socialLinks.youtube?.trim();
    if (!hasSocialLink) {
      alert('Please provide at least one social media link (Portfolio, Instagram, or YouTube)');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newCreator: Omit<ContentCreator, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        role: formData.role,
        status: formData.status,
        availability: formData.availability,
        rating: formData.rating,
        profilePicture: imagePreview || undefined,
        location: '',
        timezone: '',
        email: formData.email,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        socialLinks: Object.fromEntries(
          Object.entries(formData.socialLinks).filter(([_, value]) => value.trim() !== '')
        ),
        preferredCommunication: formData.preferredCommunication,
        shippingAddress: {
          fullAddress: formData.shippingAddress.fullAddress,
          city: formData.shippingAddress.city,
          state: formData.shippingAddress.state,
          pincode: formData.shippingAddress.pincode,
          phone: formData.shippingAddress.phone,
          alternatePhone: formData.shippingAddress.alternatePhone || undefined,
        },
        currentProjects: [],
        pastProjects: [],
        performance: {
          avgTurnaroundDays: 0,
          qualityHistory: [],
          totalProjects: 0,
          completionRate: 0,
          avgRating: formData.rating,
        },
        rateCard: {
          baseRate: typeof formData.baseRate === 'string' ? parseFloat(formData.baseRate) || 0 : formData.baseRate,
          currency: 'INR',
          unit: formData.unit,
        },
        paymentCycle: formData.paymentCycle,
        advancePercentage: formData.advancePercentage || undefined,
        payments: formData.initialPayment > 0 ? [{
          id: `payment-${Date.now()}`,
          amount: formData.initialPayment,
          currency: 'INR',
          status: 'Pending' as const,
          dueDate: new Date(),
          description: 'Initial payment setup',
        }] : [],
        strengths: [],
        weaknesses: [],
        specialRequirements: [],
        internalNotes: '',
        createdBy: 'admin', // TODO: Get from auth context
      };

      await onCreateCreator(newCreator);
      
      // Reset form
      setFormData({
        name: '',
        role: '' as CreatorRole,
        status: 'Active',
        availability: 'Free',
        rating: 0,
        email: '',
        phone: '',
        whatsapp: '',
        socialLinks: {
          instagram: '',
          youtube: '',
          portfolio: '',
        },
        preferredCommunication: 'WhatsApp',
        shippingAddress: {
          fullAddress: '',
          city: '',
          state: '',
          pincode: '',
          phone: '',
          alternatePhone: '',
        },
        baseRate: '' as any,
        unit: 'per deliverable',
        paymentCycle: 'Per Project',
        advancePercentage: 0,
        initialPayment: 0,
      });

      // Reset image states
      setProfileImage(null);
      setImagePreview('');

      setActiveTab('info');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating creator:', error);
      alert('Failed to create creator. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden rounded-none">
        <DialogHeader>
          <DialogTitle>Add New Creator</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none">
              <TabsTrigger value="info" className="rounded-none">Creator Info</TabsTrigger>
              <TabsTrigger value="rates" className="rounded-none">Rates & Payment</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="space-y-4">
              <Card className="rounded-none">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Profile Photo Upload */}
                  <div className="mb-4">
                    <h3 className="text-base font-medium text-white mb-3">Profile Photo</h3>
                    <div className="flex gap-4">
                      {/* Upload Area */}
                      <div className="flex-shrink-0">
                        {imagePreview ? (
                          <div className="relative">
                            <div className="w-24 h-24 border-2 border-dashed border-gray-600 rounded-none flex items-center justify-center bg-gray-800 relative overflow-hidden">
                              <img
                                src={imagePreview}
                                alt="Profile preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={removeImage}
                                className="rounded-none bg-white/90 hover:bg-white text-xs px-2 py-1"
                              >
                                Remove
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById('profile-upload')?.click()}
                                className="rounded-none bg-white/90 hover:bg-white text-xs px-2 py-1"
                              >
                                Change
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="w-24 h-24 border-2 border-dashed border-gray-600 rounded-none flex flex-col items-center justify-center bg-gray-800 cursor-pointer hover:bg-gray-700 transition-colors"
                            onClick={() => document.getElementById('profile-upload')?.click()}
                          >
                            <Camera className="h-6 w-6 text-gray-400 mb-1" />
                            <p className="text-gray-300 text-xs font-medium">Add Image</p>
                          </div>
                        )}
                        <input
                          id="profile-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>

                      {/* Instructions */}
                      <div className="flex-1">
                        <p className="text-gray-300 text-sm mb-2">Click the image area to upload a profile photo</p>
                        <ul className="text-gray-400 text-xs space-y-0.5">
                          <li>• Recommended size: 400×400 pixels</li>
                          <li>• Formats: JPG, PNG, WebP</li>
                          <li>• Maximum size: 5MB</li>
                          <li>• Hover over existing image to edit or delete</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter full name"
                        className="rounded-none"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value as CreatorRole)}>
                        <SelectTrigger className="rounded-none">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {CREATOR_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status *</Label>
                      <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value as CreatorStatus)} required>
                        <SelectTrigger className="rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {CREATOR_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="availability">Availability *</Label>
                      <Select value={formData.availability} onValueChange={(value) => handleInputChange('availability', value as CreatorAvailability)} required>
                        <SelectTrigger className="rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {CREATOR_AVAILABILITIES.map((availability) => (
                            <SelectItem key={availability} value={availability}>{availability}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rating">Initial Rating *</Label>
                      <Input
                        id="rating"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={formData.rating}
                        onChange={(e) => handleInputChange('rating', parseFloat(e.target.value) || 0)}
                        placeholder="0.0"
                        className="rounded-none"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-none">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="email@example.com"
                        className="rounded-none"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+91 12345 67890"
                        className="rounded-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp *</Label>
                      <Input
                        id="whatsapp"
                        value={formData.whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                        placeholder="+91 12345 67890"
                        className="rounded-none"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredCommunication">Preferred Communication *</Label>
                      <Select
                        value={formData.preferredCommunication}
                        onValueChange={(value) => handleInputChange('preferredCommunication', value as CommunicationChannel)}
                        required
                      >
                        <SelectTrigger className="rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {COMMUNICATION_CHANNELS.map((channel) => (
                            <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Social Media Links * (At least one required)</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="portfolio">Portfolio Website</Label>
                        <Input
                          id="portfolio"
                          value={formData.socialLinks.portfolio}
                          onChange={(e) => handleInputChange('socialLinks.portfolio', e.target.value)}
                          placeholder="https://portfolio.com"
                          className="rounded-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          value={formData.socialLinks.instagram}
                          onChange={(e) => handleInputChange('socialLinks.instagram', e.target.value)}
                          placeholder="@username or full URL"
                          className="rounded-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="youtube">YouTube</Label>
                        <Input
                          id="youtube"
                          value={formData.socialLinks.youtube}
                          onChange={(e) => handleInputChange('socialLinks.youtube', e.target.value)}
                          placeholder="@channel or full URL"
                          className="rounded-none"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Shipping Address</h4>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fullAddress">Street Address *</Label>
                        <Textarea
                          id="fullAddress"
                          value={formData.shippingAddress.fullAddress}
                          onChange={(e) => handleInputChange('shippingAddress.fullAddress', e.target.value)}
                          placeholder="House number, street name, area, locality"
                          className="rounded-none"
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={formData.shippingAddress.city}
                            onChange={(e) => handleInputChange('shippingAddress.city', e.target.value)}
                            placeholder="Mumbai"
                            className="rounded-none"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State *</Label>
                          <Select
                            value={formData.shippingAddress.state}
                            onValueChange={(value) => handleInputChange('shippingAddress.state', value)}
                          >
                            <SelectTrigger className="rounded-none">
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent className="rounded-none max-h-60">
                              {INDIAN_STATES.map((state) => (
                                <SelectItem key={state} value={state}>{state}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="pincode">Pincode *</Label>
                          <Input
                            id="pincode"
                            value={formData.shippingAddress.pincode}
                            onChange={(e) => handleInputChange('shippingAddress.pincode', e.target.value)}
                            placeholder="123456"
                            className="rounded-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="shippingPhone">Phone for Delivery *</Label>
                          <Input
                            id="shippingPhone"
                            value={formData.shippingAddress.phone}
                            onChange={(e) => handleInputChange('shippingAddress.phone', e.target.value)}
                            placeholder="+91 12345 67890"
                            className="rounded-none"
                          />
                        </div>
                        <div>
                          <Label htmlFor="alternatePhone">Alternate Phone (Optional)</Label>
                          <Input
                            id="alternatePhone"
                            value={formData.shippingAddress.alternatePhone}
                            onChange={(e) => handleInputChange('shippingAddress.alternatePhone', e.target.value)}
                            placeholder="+91 12345 67890"
                            className="rounded-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="rates" className="space-y-4">
              <Card className="rounded-none">
                <CardHeader>
                  <CardTitle>Rates & Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="baseRate">Base Rate (₹) *</Label>
                      <Input
                        id="baseRate"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.baseRate}
                        onChange={(e) => handleInputChange('baseRate', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                        placeholder="Enter base rate"
                        className="rounded-none"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Rate Unit *</Label>
                      <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)} required>
                        <SelectTrigger className="rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          <SelectItem value="per hour">Per Hour</SelectItem>
                          <SelectItem value="per project">Per Project</SelectItem>
                          <SelectItem value="per deliverable">Per Deliverable</SelectItem>
                          <SelectItem value="per day">Per Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentCycle">Payment Cycle *</Label>
                      <Select value={formData.paymentCycle} onValueChange={(value) => handleInputChange('paymentCycle', value as PaymentCycle)} required>
                        <SelectTrigger className="rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {PAYMENT_CYCLES.map((cycle) => (
                            <SelectItem key={cycle} value={cycle}>{cycle}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="advancePercentage">Advance Percentage (%)</Label>
                      <Input
                        id="advancePercentage"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.advancePercentage}
                        onChange={(e) => handleInputChange('advancePercentage', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="rounded-none"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="initialPayment">Initial Payment (₹)</Label>
                    <Input
                      id="initialPayment"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.initialPayment}
                      onChange={(e) => handleInputChange('initialPayment', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="rounded-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
          </Tabs>
          
          <div className="flex justify-between pt-4 border-t">
            <div className="flex space-x-2">
              {currentTabIndex > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab(tabs[currentTabIndex - 1])}
                  disabled={isSubmitting}
                  className="rounded-none"
                >
                  Previous
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="rounded-none"
              >
                Cancel
              </Button>
              {!isLastTab ? (
                <Button
                  type="button"
                  onClick={() => setActiveTab(tabs[currentTabIndex + 1])}
                  disabled={isSubmitting}
                  className="rounded-none"
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="rounded-none">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Creator'
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};