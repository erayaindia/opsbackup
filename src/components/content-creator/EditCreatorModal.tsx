import React, { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import {
  ContentCreator,
  CreatorRole,
  CreatorStatus,
  CreatorAvailability,
  PaymentCycle,
  CommunicationChannel,
} from '@/types/contentCreator';

interface EditCreatorModalProps {
  creator: ContentCreator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateCreator: (creator: ContentCreator) => Promise<void>;
}

const CREATOR_ROLES: CreatorRole[] = [
  'Videographer', 'Editor', 'Influencer', 'Agency', 'Model',
  'Designer', 'Photographer', 'Copywriter', 'Voice Actor', 'Animator'
];

const CREATOR_STATUSES: CreatorStatus[] = ['Active', 'Onboarding', 'Paused', 'Archived'];
const CREATOR_AVAILABILITIES: CreatorAvailability[] = ['Free', 'Limited', 'Busy'];
const PAYMENT_CYCLES: PaymentCycle[] = ['Per Project', 'Monthly', 'Weekly', 'Custom'];
const COMMUNICATION_CHANNELS: CommunicationChannel[] = ['Email', 'WhatsApp', 'Slack', 'Phone', 'Discord'];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry'
];

export const EditCreatorModal: React.FC<EditCreatorModalProps> = ({
  creator,
  open,
  onOpenChange,
  onUpdateCreator,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    role: 'Designer' as CreatorRole,
    status: 'Active' as CreatorStatus,
    availability: 'Free' as CreatorAvailability,
    rating: 0,
    
    // Profile
    profilePicture: '',
    bio: '',
    location: '',
    timezone: '',
    
    // Contact
    email: '',
    phone: '',
    whatsapp: '',
    socialLinks: {
      instagram: '',
      youtube: '',
      tiktok: '',
      linkedin: '',
      portfolio: '',
    },
    preferredCommunication: 'Email' as CommunicationChannel,
    
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
    baseRate: 0,
    currency: 'INR',
    unit: 'per hour',
    paymentCycle: 'Per Project' as PaymentCycle,
    advancePercentage: 0,
    
    // Collaboration
    strengths: '',
    weaknesses: '',
    specialRequirements: '',
    internalNotes: '',
  });

  // Populate form when creator changes
  useEffect(() => {
    if (creator && open) {
      setFormData({
        name: creator.name || '',
        role: creator.role || 'Designer',
        status: creator.status || 'Active',
        availability: creator.availability || 'Free',
        rating: creator.rating || 0,
        profilePicture: creator.profilePicture || '',
        bio: creator.bio || '',
        location: creator.location || '',
        timezone: creator.timezone || '',
        email: creator.email || '',
        phone: creator.phone || '',
        whatsapp: creator.whatsapp || '',
        socialLinks: {
          instagram: creator.socialLinks?.instagram || '',
          youtube: creator.socialLinks?.youtube || '',
          tiktok: creator.socialLinks?.tiktok || '',
          linkedin: creator.socialLinks?.linkedin || '',
          portfolio: creator.socialLinks?.portfolio || '',
        },
        preferredCommunication: creator.preferredCommunication || 'Email',
        shippingAddress: {
          fullAddress: creator.shippingAddress?.fullAddress || '',
          city: creator.shippingAddress?.city || '',
          state: creator.shippingAddress?.state || '',
          pincode: creator.shippingAddress?.pincode || '',
          phone: creator.shippingAddress?.phone || '',
          alternatePhone: creator.shippingAddress?.alternatePhone || '',
        },
        baseRate: creator.rateCard?.baseRate || 0,
        currency: creator.rateCard?.currency || 'INR',
        unit: creator.rateCard?.unit || 'per hour',
        paymentCycle: creator.paymentCycle || 'Per Project',
        advancePercentage: creator.advancePercentage || 0,
        strengths: creator.strengths?.join(', ') || '',
        weaknesses: creator.weaknesses?.join(', ') || '',
        specialRequirements: creator.specialRequirements?.join(', ') || '',
        internalNotes: creator.internalNotes || '',
      });
    }
  }, [creator, open]);

  const handleInputChange = (field: string, value: string | number) => {
    if (field.startsWith('socialLinks.')) {
      const socialField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value as string,
        },
      }));
    } else if (field.startsWith('shippingAddress.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          [addressField]: value as string,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator) return;

    setIsSubmitting(true);
    try {
      // Convert form data back to creator format
      const updatedCreator: ContentCreator = {
        ...creator,
        name: formData.name,
        role: formData.role,
        status: formData.status,
        availability: formData.availability,
        rating: formData.rating,
        profilePicture: formData.profilePicture || undefined,
        bio: formData.bio || undefined,
        location: formData.location,
        timezone: formData.timezone,
        email: formData.email,
        phone: formData.phone || undefined,
        whatsapp: formData.whatsapp || undefined,
        socialLinks: {
          instagram: formData.socialLinks.instagram || undefined,
          youtube: formData.socialLinks.youtube || undefined,
          tiktok: formData.socialLinks.tiktok || undefined,
          linkedin: formData.socialLinks.linkedin || undefined,
          portfolio: formData.socialLinks.portfolio || undefined,
        },
        preferredCommunication: formData.preferredCommunication,
        shippingAddress: {
          fullAddress: formData.shippingAddress.fullAddress,
          city: formData.shippingAddress.city,
          state: formData.shippingAddress.state,
          pincode: formData.shippingAddress.pincode,
          phone: formData.shippingAddress.phone,
          alternatePhone: formData.shippingAddress.alternatePhone || undefined,
        },
        rateCard: {
          baseRate: formData.baseRate,
          currency: formData.currency,
          unit: formData.unit,
        },
        paymentCycle: formData.paymentCycle,
        advancePercentage: formData.advancePercentage || undefined,
        strengths: formData.strengths ? formData.strengths.split(',').map(s => s.trim()).filter(s => s) : [],
        weaknesses: formData.weaknesses ? formData.weaknesses.split(',').map(s => s.trim()).filter(s => s) : [],
        specialRequirements: formData.specialRequirements ? formData.specialRequirements.split(',').map(s => s.trim()).filter(s => s) : [],
        internalNotes: formData.internalNotes,
        updatedAt: new Date(),
      };

      await onUpdateCreator(updatedCreator);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating creator:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    if (creator) {
      setFormData({
        name: creator.name || '',
        role: creator.role || 'Designer',
        status: creator.status || 'Active',
        availability: creator.availability || 'Free',
        rating: creator.rating || 0,
        profilePicture: creator.profilePicture || '',
        bio: creator.bio || '',
        location: creator.location || '',
        timezone: creator.timezone || '',
        email: creator.email || '',
        phone: creator.phone || '',
        whatsapp: creator.whatsapp || '',
        socialLinks: {
          instagram: creator.socialLinks?.instagram || '',
          youtube: creator.socialLinks?.youtube || '',
          tiktok: creator.socialLinks?.tiktok || '',
          linkedin: creator.socialLinks?.linkedin || '',
          portfolio: creator.socialLinks?.portfolio || '',
        },
        preferredCommunication: creator.preferredCommunication || 'Email',
        shippingAddress: {
          fullAddress: creator.shippingAddress?.fullAddress || '',
          city: creator.shippingAddress?.city || '',
          state: creator.shippingAddress?.state || '',
          pincode: creator.shippingAddress?.pincode || '',
          phone: creator.shippingAddress?.phone || '',
          alternatePhone: creator.shippingAddress?.alternatePhone || '',
        },
        baseRate: creator.rateCard?.baseRate || 0,
        currency: creator.rateCard?.currency || 'INR',
        unit: creator.rateCard?.unit || 'per hour',
        paymentCycle: creator.paymentCycle || 'Per Project',
        advancePercentage: creator.advancePercentage || 0,
        strengths: creator.strengths?.join(', ') || '',
        weaknesses: creator.weaknesses?.join(', ') || '',
        specialRequirements: creator.specialRequirements?.join(', ') || '',
        internalNotes: creator.internalNotes || '',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden rounded-none">
        <DialogHeader>
          <DialogTitle>Edit Creator: {creator?.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none">
              <TabsTrigger value="info" className="rounded-none">Creator Info</TabsTrigger>
              <TabsTrigger value="rates" className="rounded-none">Rates & Payment</TabsTrigger>
            </TabsList>

            {/* Creator Info Tab */}
            <TabsContent value="info" className="space-y-4">
              <Card className="rounded-none">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
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
                      <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
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
                      <Select value={formData.availability} onValueChange={(value) => handleInputChange('availability', value)}>
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
                      <Label htmlFor="rating">Rating *</Label>
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
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="creator@example.com"
                        className="rounded-none"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+91 12345 67890"
                        className="rounded-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={formData.whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                        placeholder="+91 12345 67890"
                        className="rounded-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredCommunication">Preferred Communication</Label>
                      <Select value={formData.preferredCommunication} onValueChange={(value) => handleInputChange('preferredCommunication', value)}>
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

                  <div className="space-y-2">
                    <Label className="text-base font-medium">Social Links & Portfolio</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          value={formData.socialLinks.instagram}
                          onChange={(e) => handleInputChange('socialLinks.instagram', e.target.value)}
                          placeholder="@username"
                          className="rounded-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="youtube">YouTube</Label>
                        <Input
                          id="youtube"
                          value={formData.socialLinks.youtube}
                          onChange={(e) => handleInputChange('socialLinks.youtube', e.target.value)}
                          placeholder="@channelname"
                          className="rounded-none"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="portfolio">Portfolio Website</Label>
                        <Input
                          id="portfolio"
                          value={formData.socialLinks.portfolio}
                          onChange={(e) => handleInputChange('socialLinks.portfolio', e.target.value)}
                          placeholder="https://..."
                          className="rounded-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-medium">Shipping Address</Label>
                    <div className="space-y-4">
                      <div className="space-y-2">
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
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={formData.shippingAddress.city}
                            onChange={(e) => handleInputChange('shippingAddress.city', e.target.value)}
                            placeholder="Mumbai"
                            className="rounded-none"
                          />
                        </div>
                        <div className="space-y-2">
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
                        <div className="space-y-2">
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
                        <div className="space-y-2">
                          <Label htmlFor="shippingPhone">Phone for Delivery *</Label>
                          <Input
                            id="shippingPhone"
                            value={formData.shippingAddress.phone}
                            onChange={(e) => handleInputChange('shippingAddress.phone', e.target.value)}
                            placeholder="+91 12345 67890"
                            className="rounded-none"
                          />
                        </div>
                        <div className="space-y-2">
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


            {/* Rates & Payment Tab */}
            <TabsContent value="rates" className="space-y-4">
              <Card className="rounded-none">
                <CardHeader>
                  <CardTitle>Rate Card</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="baseRate">Base Rate *</Label>
                      <Input
                        id="baseRate"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.baseRate}
                        onChange={(e) => handleInputChange('baseRate', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="rounded-none"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency *</Label>
                      <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                        <SelectTrigger className="rounded-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Rate Unit *</Label>
                      <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
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
                      <Label htmlFor="paymentCycle">Payment Cycle</Label>
                      <Select value={formData.paymentCycle} onValueChange={(value) => handleInputChange('paymentCycle', value)}>
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
                      <Label htmlFor="advancePercentage">Advance Percentage</Label>
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
                </CardContent>
              </Card>

              <Card className="rounded-none">
                <CardHeader>
                  <CardTitle>Additional Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="strengths">Strengths (comma-separated)</Label>
                    <Textarea
                      id="strengths"
                      value={formData.strengths}
                      onChange={(e) => handleInputChange('strengths', e.target.value)}
                      placeholder="Creative storytelling, Quick turnaround, Professional equipment"
                      className="rounded-none"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weaknesses">Areas for Improvement (comma-separated)</Label>
                    <Textarea
                      id="weaknesses"
                      value={formData.weaknesses}
                      onChange={(e) => handleInputChange('weaknesses', e.target.value)}
                      placeholder="Limited animation skills, Prefers outdoor shoots"
                      className="rounded-none"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialRequirements">Special Requirements (comma-separated)</Label>
                    <Textarea
                      id="specialRequirements"
                      value={formData.specialRequirements}
                      onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                      placeholder="Requires 48h notice, Not available Sundays"
                      className="rounded-none"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="internalNotes">Internal Notes</Label>
                    <Textarea
                      id="internalNotes"
                      value={formData.internalNotes}
                      onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                      placeholder="Internal team notes about this creator..."
                      className="rounded-none"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>

          <Separator />

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
            >
              Reset
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Creator
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};