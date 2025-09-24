import React, { useState } from 'react';
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
import { Loader2, Camera, CheckCircle, User, FileText, CreditCard } from 'lucide-react';
import {
  ContentCreator,
  CreatorRole,
  CreatorStatus,
  CreatorAvailability,
  PaymentCycle,
  CommunicationChannel,
} from '@/types/contentCreator';
import { CreatorService } from '@/services/creatorService';

const CREATOR_ROLES: CreatorRole[] = [
  'Videographer', 'Editor', 'UGC Creator', 'Influencer', 'Agency', 'Model',
  'Designer', 'Photographer', 'Copywriter', 'Voice Actor', 'Animator'
];

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

export default function CreatorOnboard() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const tabs = ['info', 'rates'];
  const tabNames = ['Your Information', 'Rates & Payment'];
  const currentTabIndex = tabs.indexOf(activeTab);
  const isLastTab = currentTabIndex === tabs.length - 1;

  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    role: '' as CreatorRole,
    status: 'Onboarding' as CreatorStatus,
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview('');
    const input = document.getElementById('profile-upload') as HTMLInputElement;
    if (input) input.value = '';
  };

  const nextTab = () => {
    if (currentTabIndex < tabs.length - 1) {
      setActiveTab(tabs[currentTabIndex + 1]);
    }
  };

  const prevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check required fields
    if (!formData.name || !formData.role || !formData.email || !formData.phone || !formData.whatsapp ||
        !formData.shippingAddress.fullAddress || !formData.shippingAddress.city || !formData.shippingAddress.state ||
        !formData.shippingAddress.pincode || !formData.shippingAddress.phone ||
        !formData.baseRate) {
      alert('Please fill in all required fields');
      return;
    }

    // Check at least one social media link is provided
    const hasSocialLink = formData.socialLinks.portfolio?.trim() || formData.socialLinks.instagram?.trim() || formData.socialLinks.youtube?.trim();
    if (!hasSocialLink) {
      alert('Please provide at least one social media link or portfolio website.');
      return;
    }

    setIsSubmitting(true);
    try {
      const creatorData: Omit<ContentCreator, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        role: formData.role,
        status: 'Onboarding',
        availability: formData.availability,
        rating: 0, // New creators start with 0 rating
        profilePicture: undefined, // TODO: Handle image upload
        bio: undefined,
        location: `${formData.shippingAddress.city}, ${formData.shippingAddress.state}`,
        timezone: 'Asia/Kolkata',
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
          avgRating: 0,
          engagementMetrics: {},
        },
        rateCard: {
          baseRate: parseFloat(formData.baseRate),
          currency: 'INR',
          unit: formData.unit,
        },
        paymentCycle: formData.paymentCycle,
        advancePercentage: formData.advancePercentage || undefined,
        payments: [],
        strengths: [],
        weaknesses: [],
        specialRequirements: [],
        internalNotes: `Self-registered creator on ${new Date().toLocaleDateString()}`,
        createdBy: 'self-registration',
      };

      await CreatorService.createCreator(creatorData);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error creating creator:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      if (errorMessage.includes('already exists')) {
        alert('⚠️ A creator with this email address already exists. Please use a different email or contact support if this is your email.');
      } else {
        alert(`❌ Failed to submit application: ${errorMessage}. Please try again or contact support.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success page
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-none">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Application Submitted!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your interest in joining our creator network. We've received your application and will review it within 2-3 business days.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              You'll receive an email notification once your application has been reviewed. If approved, you'll get access to our creator portal and can start working on projects.
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              className="rounded-none"
            >
              Back to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Join Our Creator Network</h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Become part of our growing community of content creators. Fill out the form below to get started.
          </p>
        </div>

        <Card className="max-w-4xl mx-auto rounded-none">
          <CardHeader>
            <CardTitle className="text-2xl">Creator Application</CardTitle>
            <p className="text-muted-foreground">
              Please provide accurate information as this will be used for project assignments and payments.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-none">
                  <TabsTrigger value="info" className="rounded-none flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Your Information
                  </TabsTrigger>
                  <TabsTrigger value="rates" className="rounded-none flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Rates & Payment
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-6 mt-6">
                  <Card className="rounded-none">
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Profile Photo Upload */}
                      <div className="mb-4">
                        <h3 className="text-base font-medium text-foreground mb-3">Profile Photo (Optional)</h3>
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            {imagePreview ? (
                              <div className="relative">
                                <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-none flex items-center justify-center bg-gray-50 relative overflow-hidden">
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
                                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-none flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => document.getElementById('profile-upload')?.click()}
                              >
                                <Camera className="h-6 w-6 text-gray-400 mb-1" />
                                <p className="text-gray-500 text-xs font-medium">Add Photo</p>
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

                          <div className="flex-1">
                            <p className="text-gray-600 text-sm mb-2">Click to upload a profile photo</p>
                            <ul className="text-gray-500 text-xs space-y-0.5">
                              <li>• Recommended size: 400×400 pixels</li>
                              <li>• Formats: JPG, PNG, WebP</li>
                              <li>• Maximum size: 5MB</li>
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
                            placeholder="Enter your full name"
                            className="rounded-none"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Role *</Label>
                          <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value as CreatorRole)}>
                            <SelectTrigger className="rounded-none">
                              <SelectValue placeholder="Select your primary role" />
                            </SelectTrigger>
                            <SelectContent className="rounded-none">
                              {CREATOR_ROLES.map((role) => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                            placeholder="your@email.com"
                            className="rounded-none"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="+91 12345 67890"
                            className="rounded-none"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="whatsapp">WhatsApp Number *</Label>
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

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Social Links & Portfolio *</h4>
                        <p className="text-sm text-muted-foreground">Please provide at least one social media link or portfolio website</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="instagram">Instagram</Label>
                            <Input
                              id="instagram"
                              value={formData.socialLinks.instagram}
                              onChange={(e) => handleInputChange('socialLinks.instagram', e.target.value)}
                              placeholder="@yourusername"
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
                              placeholder="https://yourwebsite.com"
                              className="rounded-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Shipping Address</h4>
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
                              required
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
                                required
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
                                required
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
                                required
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

                <TabsContent value="rates" className="space-y-6 mt-6">
                  <Card className="rounded-none">
                    <CardHeader>
                      <CardTitle>Rate Card</CardTitle>
                      <p className="text-sm text-muted-foreground">Set your pricing for different types of work</p>
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
                            placeholder="Enter your rate"
                            className="rounded-none"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="currency">Currency</Label>
                          <Select value="INR" disabled>
                            <SelectTrigger className="rounded-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-none">
                              <SelectItem value="INR">INR (₹)</SelectItem>
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
                            placeholder="50"
                            className="rounded-none"
                          />
                          <p className="text-xs text-muted-foreground">Percentage of payment you'd like to receive upfront</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-none">
                    <CardHeader>
                      <CardTitle>Application Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>• Your application will be reviewed within 2-3 business days</p>
                        <p>• You'll receive an email notification about the status</p>
                        <p>• If approved, you'll get access to our creator portal</p>
                        <p>• Make sure all information is accurate as it will be used for payments</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Separator />

              <div className="flex justify-between">
                <div className="flex gap-3">
                  {currentTabIndex > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevTab}
                      className="rounded-none"
                    >
                      Previous
                    </Button>
                  )}
                </div>
                <div className="flex gap-3">
                  {!isLastTab ? (
                    <Button
                      type="button"
                      onClick={nextTab}
                      className="rounded-none"
                    >
                      Next: {tabNames[currentTabIndex + 1]}
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} className="rounded-none">
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Application
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}