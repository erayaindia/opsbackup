export type CreatorRole =
  | 'Videographer'
  | 'Editor'
  | 'UGC Creator'
  | 'Influencer'
  | 'Agency'
  | 'Model'
  | 'Designer'
  | 'Photographer'
  | 'Copywriter'
  | 'Voice Actor'
  | 'Animator';

export type CreatorStatus = 'Active' | 'Onboarding' | 'Paused' | 'Rejected';

export type CreatorAvailability = 'Free' | 'Limited' | 'Busy';

export type PaymentStatus = 'Pending' | 'Paid' | 'Partial' | 'Overdue';

export type PaymentCycle = 'Per Project' | 'Monthly' | 'Weekly' | 'Custom';

export type CommunicationChannel = 'Email' | 'WhatsApp' | 'Slack' | 'Phone' | 'Discord';

export interface CreatorProject {
  id: string;
  name: string;
  status: 'Active' | 'Completed' | 'Cancelled';
  startDate: Date;
  endDate?: Date;
  rating?: number;
  notes?: string;
}

export interface CreatorPayment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  dueDate: Date;
  paidDate?: Date;
  invoiceUrl?: string;
  description: string;
}

export interface CreatorPerformance {
  avgTurnaroundDays: number;
  qualityHistory: number[]; // Last 5 project ratings
  totalProjects: number;
  completionRate: number;
  avgRating: number;
  engagementMetrics?: {
    ctr?: number;
    roas?: number;
    impressions?: number;
  };
}

export interface ContentCreator {
  id: string;
  name: string;
  role: CreatorRole;
  status: CreatorStatus;
  availability: CreatorAvailability;
  rating: number; // 1-10 scale
  
  // Profile
  profilePicture?: string;
  bio?: string;
  location: string;
  timezone: string;
  
  // Contact
  email: string;
  phone?: string;
  whatsapp?: string;
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    linkedin?: string;
    portfolio?: string;
  };
  preferredCommunication: CommunicationChannel;
  
  // Shipping Address
  shippingAddress?: {
    fullAddress: string;
    pincode: string;
    phone: string;
    alternatePhone?: string;
  };
  
  // Projects
  currentProjects: CreatorProject[];
  pastProjects: CreatorProject[];
  performance: CreatorPerformance;
  
  // Payments
  rateCard: {
    baseRate: number;
    currency: string;
    unit: string; // 'per hour', 'per project', 'per deliverable'
  };
  paymentCycle: PaymentCycle;
  advancePercentage?: number;
  payments: CreatorPayment[];
  
  // Collaboration
  strengths: string[];
  weaknesses: string[];
  specialRequirements: string[];
  internalNotes: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreatorFilters {
  role: CreatorRole | 'All';
  status: CreatorStatus | 'All';
  availability: CreatorAvailability | 'All';
  minRating: number;
  searchQuery: string;
}

export type CreatorView = 
  | 'All Creators'
  | 'Active Only'
  | 'Available Now'
  | 'By Role'
  | 'Top Rated';

export interface CreatorDrawerProps {
  creator: ContentCreator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (creator: ContentCreator) => void;
  onDelete: (creatorId: string) => Promise<void>;
}