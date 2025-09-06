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
import { Loader2 } from 'lucide-react';
import {
  ContentCreator,
  CreatorRole,
  CreatorStatus,
  CreatorCapacity,
  PaymentCycle,
  CommunicationChannel,
} from '@/types/contentCreator';

interface AddCreatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCreator: (creator: Omit<ContentCreator, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const CREATOR_ROLES: CreatorRole[] = [
  'Videographer', 'Editor', 'Influencer', 'Agency', 'Model', 
  'Designer', 'Photographer', 'Copywriter', 'Voice Actor', 'Animator'
];

const CREATOR_STATUSES: CreatorStatus[] = ['Active', 'Onboarding', 'Paused', 'Archived'];
const CREATOR_CAPACITIES: CreatorCapacity[] = ['Free', 'Limited', 'Busy'];
const PAYMENT_CYCLES: PaymentCycle[] = ['Per Project', 'Monthly', 'Weekly', 'Custom'];
const COMMUNICATION_CHANNELS: CommunicationChannel[] = ['Email', 'WhatsApp', 'Slack', 'Phone', 'Discord'];

export const AddCreatorModal: React.FC<AddCreatorModalProps> = ({
  open,
  onOpenChange,
  onCreateCreator,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    role: '' as CreatorRole,
    status: 'Active' as CreatorStatus,
    capacity: 'Free' as CreatorCapacity,
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
    
    // Rate Card
    baseRate: 0,
    currency: 'USD',
    unit: 'per hour',
    paymentCycle: 'Per Project' as PaymentCycle,
    advancePercentage: 0,
    
    // Collaboration
    strengths: '',
    weaknesses: '',
    specialRequirements: '',
    internalNotes: '',
  });

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('socialLinks.')) {
      const socialField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value,
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
    
    if (!formData.name || !formData.role || !formData.email || !formData.location || !formData.timezone) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const newCreator: Omit<ContentCreator, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        role: formData.role,
        status: formData.status,
        capacity: formData.capacity,
        rating: formData.rating,
        profilePicture: formData.profilePicture || undefined,
        bio: formData.bio || undefined,
        location: formData.location,
        timezone: formData.timezone,
        email: formData.email,
        phone: formData.phone || undefined,
        whatsapp: formData.whatsapp || undefined,
        socialLinks: Object.fromEntries(
          Object.entries(formData.socialLinks).filter(([_, value]) => value.trim() !== '')
        ),
        preferredCommunication: formData.preferredCommunication,
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
          baseRate: formData.baseRate,
          currency: formData.currency,
          unit: formData.unit,
        },
        paymentCycle: formData.paymentCycle,
        advancePercentage: formData.advancePercentage || undefined,
        payments: [],
        strengths: formData.strengths ? formData.strengths.split(',').map(s => s.trim()).filter(s => s) : [],
        weaknesses: formData.weaknesses ? formData.weaknesses.split(',').map(s => s.trim()).filter(s => s) : [],
        specialRequirements: formData.specialRequirements ? formData.specialRequirements.split(',').map(s => s.trim()).filter(s => s) : [],
        internalNotes: formData.internalNotes,
        createdBy: 'admin', // TODO: Get from auth context
      };

      await onCreateCreator(newCreator);
      
      // Reset form
      setFormData({
        name: '',
        role: '' as CreatorRole,
        status: 'Active',
        capacity: 'Free',
        rating: 0,
        profilePicture: '',
        bio: '',
        location: '',
        timezone: '',
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
        preferredCommunication: 'Email',
        baseRate: 0,
        currency: 'USD',
        unit: 'per hour',
        paymentCycle: 'Per Project',
        advancePercentage: 0,
        strengths: '',
        weaknesses: '',
        specialRequirements: '',
        internalNotes: '',
      });
      
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add New Creator</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="rates">Rates & Payment</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <Card>
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
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value as CreatorRole)}>
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
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value as CreatorStatus)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CREATOR_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacity</Label>
                      <Select value={formData.capacity} onValueChange={(value) => handleInputChange('capacity', value as CreatorCapacity)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CREATOR_CAPACITIES.map((capacity) => (
                            <SelectItem key={capacity} value={capacity}>{capacity}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rating">Initial Rating</Label>
                      <Input
                        id="rating"
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={formData.rating}
                        onChange={(e) => handleInputChange('rating', parseFloat(e.target.value) || 0)}
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="City, State/Country"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone *</Label>
                      <Input
                        id="timezone"
                        value={formData.timezone}
                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                        placeholder="EST, PST, GMT, etc."
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profilePicture">Profile Picture URL</Label>
                    <Input
                      id="profilePicture"
                      value={formData.profilePicture}
                      onChange={(e) => handleInputChange('profilePicture', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Brief description about the creator..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="contact" className="space-y-4">
              <Card>
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
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={formData.whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preferredCommunication">Preferred Communication</Label>
                      <Select 
                        value={formData.preferredCommunication} 
                        onValueChange={(value) => handleInputChange('preferredCommunication', value as CommunicationChannel)}
                      >
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
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Social Media Links</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          value={formData.socialLinks.instagram}
                          onChange={(e) => handleInputChange('socialLinks.instagram', e.target.value)}
                          placeholder="@username or full URL"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="youtube">YouTube</Label>
                        <Input
                          id="youtube"
                          value={formData.socialLinks.youtube}
                          onChange={(e) => handleInputChange('socialLinks.youtube', e.target.value)}
                          placeholder="@channel or full URL"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tiktok">TikTok</Label>
                        <Input
                          id="tiktok"
                          value={formData.socialLinks.tiktok}
                          onChange={(e) => handleInputChange('socialLinks.tiktok', e.target.value)}
                          placeholder="@username or full URL"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={formData.socialLinks.linkedin}
                          onChange={(e) => handleInputChange('socialLinks.linkedin', e.target.value)}
                          placeholder="profile name or full URL"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="portfolio">Portfolio Website</Label>
                        <Input
                          id="portfolio"
                          value={formData.socialLinks.portfolio}
                          onChange={(e) => handleInputChange('socialLinks.portfolio', e.target.value)}
                          placeholder="https://portfolio.com"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="rates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Rates & Payment</CardTitle>
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
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Input
                        id="currency"
                        value={formData.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                        placeholder="USD"
                      />
                    </div>
                    <div className="space-y-2">
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentCycle">Payment Cycle</Label>
                      <Select value={formData.paymentCycle} onValueChange={(value) => handleInputChange('paymentCycle', value as PaymentCycle)}>
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
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Collaboration Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="strengths">Strengths (comma-separated)</Label>
                    <Textarea
                      id="strengths"
                      value={formData.strengths}
                      onChange={(e) => handleInputChange('strengths', e.target.value)}
                      placeholder="Creative storytelling, Quick turnaround, Professional equipment"
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
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specialRequirements">Special Requirements (comma-separated)</Label>
                    <Textarea
                      id="specialRequirements"
                      value={formData.specialRequirements}
                      onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                      placeholder="Requires 48h notice for shoots, Not available Sundays"
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="internalNotes">Internal Notes</Label>
                    <Textarea
                      id="internalNotes"
                      value={formData.internalNotes}
                      onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                      placeholder="Any additional notes about working with this creator..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Creator'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};