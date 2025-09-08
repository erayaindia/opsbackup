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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Creator: {creator?.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="rates">Rates</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role *</Label>
                      <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {CREATOR_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {CREATOR_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="availability">Availability</Label>
                      <Select value={formData.availability} onValueChange={(value) => handleInputChange('availability', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select availability" />
                        </SelectTrigger>
                        <SelectContent>
                          {CREATOR_AVAILABILITIES.map((availability) => (
                            <SelectItem key={availability} value={availability}>{availability}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="rating">Rating (0-10)</Label>
                      <Input
                        id="rating"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={formData.rating}
                        onChange={(e) => handleInputChange('rating', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="profilePicture">Profile Picture URL</Label>
                    <Input
                      id="profilePicture"
                      value={formData.profilePicture}
                      onChange={(e) => handleInputChange('profilePicture', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Brief description..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone *</Label>
                      <Input
                        id="timezone"
                        value={formData.timezone}
                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={formData.whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="preferredCommunication">Preferred Communication</Label>
                      <Select value={formData.preferredCommunication} onValueChange={(value) => handleInputChange('preferredCommunication', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMUNICATION_CHANNELS.map((channel) => (
                            <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-base font-medium">Social Links & Portfolio</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          value={formData.socialLinks.instagram}
                          onChange={(e) => handleInputChange('socialLinks.instagram', e.target.value)}
                          placeholder="@username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="youtube">YouTube</Label>
                        <Input
                          id="youtube"
                          value={formData.socialLinks.youtube}
                          onChange={(e) => handleInputChange('socialLinks.youtube', e.target.value)}
                          placeholder="@channelname"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tiktok">TikTok</Label>
                        <Input
                          id="tiktok"
                          value={formData.socialLinks.tiktok}
                          onChange={(e) => handleInputChange('socialLinks.tiktok', e.target.value)}
                          placeholder="@username"
                        />
                      </div>
                      <div>
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={formData.socialLinks.linkedin}
                          onChange={(e) => handleInputChange('socialLinks.linkedin', e.target.value)}
                          placeholder="linkedin.com/in/..."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="portfolio">Portfolio Website</Label>
                        <Input
                          id="portfolio"
                          value={formData.socialLinks.portfolio}
                          onChange={(e) => handleInputChange('socialLinks.portfolio', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label className="text-base font-medium">Shipping Address</Label>
                    <div className="space-y-4 mt-3">
                      <div>
                        <Label htmlFor="fullAddress">Full Address *</Label>
                        <Textarea
                          id="fullAddress"
                          value={formData.shippingAddress.fullAddress}
                          onChange={(e) => handleInputChange('shippingAddress.fullAddress', e.target.value)}
                          placeholder="Complete shipping address with street, area, city, state"
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="pincode">Pincode *</Label>
                          <Input
                            id="pincode"
                            value={formData.shippingAddress.pincode}
                            onChange={(e) => handleInputChange('shippingAddress.pincode', e.target.value)}
                            placeholder="123456"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shippingPhone">Phone for Delivery *</Label>
                          <Input
                            id="shippingPhone"
                            value={formData.shippingAddress.phone}
                            onChange={(e) => handleInputChange('shippingAddress.phone', e.target.value)}
                            placeholder="+91 12345 67890"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="alternatePhone">Alternate Phone (Optional)</Label>
                        <Input
                          id="alternatePhone"
                          value={formData.shippingAddress.alternatePhone}
                          onChange={(e) => handleInputChange('shippingAddress.alternatePhone', e.target.value)}
                          placeholder="+91 12345 67890"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rates Tab */}
            <TabsContent value="rates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Rate Card & Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="baseRate">Base Rate *</Label>
                      <Input
                        id="baseRate"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.baseRate}
                        onChange={(e) => handleInputChange('baseRate', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="unit">Rate Unit</Label>
                      <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="per hour">Per Hour</SelectItem>
                          <SelectItem value="per project">Per Project</SelectItem>
                          <SelectItem value="per deliverable">Per Deliverable</SelectItem>
                          <SelectItem value="per day">Per Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentCycle">Payment Cycle</Label>
                      <Select value={formData.paymentCycle} onValueChange={(value) => handleInputChange('paymentCycle', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_CYCLES.map((cycle) => (
                            <SelectItem key={cycle} value={cycle}>{cycle}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="advancePercentage">Advance Percentage</Label>
                      <Input
                        id="advancePercentage"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.advancePercentage}
                        onChange={(e) => handleInputChange('advancePercentage', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Collaboration Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="strengths">Strengths (comma-separated)</Label>
                    <Textarea
                      id="strengths"
                      value={formData.strengths}
                      onChange={(e) => handleInputChange('strengths', e.target.value)}
                      placeholder="Creative storytelling, Quick turnaround, Professional equipment"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="weaknesses">Areas for Improvement (comma-separated)</Label>
                    <Textarea
                      id="weaknesses"
                      value={formData.weaknesses}
                      onChange={(e) => handleInputChange('weaknesses', e.target.value)}
                      placeholder="Limited animation skills, Prefers outdoor shoots"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="specialRequirements">Special Requirements (comma-separated)</Label>
                    <Textarea
                      id="specialRequirements"
                      value={formData.specialRequirements}
                      onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                      placeholder="Requires 48h notice, Not available Sundays"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="internalNotes">Internal Notes</Label>
                    <Textarea
                      id="internalNotes"
                      value={formData.internalNotes}
                      onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                      placeholder="Internal team notes about this creator..."
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