import React, { useState, useEffect } from 'react';
import { ContentLayout } from '@/components/ContentLayout';
import { CreatorTable } from '@/components/content-creator/CreatorTable';
import { CreatorDrawer } from '@/components/content-creator/CreatorDrawer';
import { AddCreatorModal } from '@/components/content-creator/AddCreatorModal';
import { ContentCreator } from '@/types/contentCreator';
import { CreatorService } from '@/services/creatorService';

const MOCK_CREATORS: ContentCreator[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Videographer',
    status: 'Active',
    capacity: 'Free',
    rating: 9.2,
    profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b332e234?w=150&h=150&fit=crop&crop=face',
    bio: 'Professional videographer with 8+ years experience in commercial and lifestyle content creation.',
    location: 'Los Angeles, CA',
    timezone: 'PST',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    whatsapp: '+1 (555) 123-4567',
    socialLinks: {
      instagram: '@sarahj_visuals',
      youtube: '@sarahjohnsonfilms',
      portfolio: 'sarahjohnsonvisuals.com'
    },
    preferredCommunication: 'WhatsApp',
    currentProjects: [
      {
        id: 'p1',
        name: 'Summer Fashion Campaign',
        status: 'Active',
        startDate: new Date('2024-01-15'),
        rating: 9.0
      }
    ],
    pastProjects: [
      {
        id: 'p2',
        name: 'Product Launch Video',
        status: 'Completed',
        startDate: new Date('2023-11-01'),
        endDate: new Date('2023-12-15'),
        rating: 9.5
      },
      {
        id: 'p3',
        name: 'Brand Story Series',
        status: 'Completed',
        startDate: new Date('2023-09-01'),
        endDate: new Date('2023-10-30'),
        rating: 9.2
      }
    ],
    performance: {
      avgTurnaroundDays: 3.5,
      qualityHistory: [9.5, 9.2, 9.0, 9.3, 9.1],
      totalProjects: 15,
      completionRate: 98,
      avgRating: 9.2,
      engagementMetrics: {
        ctr: 4.2,
        roas: 3.8,
        impressions: 250000
      }
    },
    rateCard: {
      baseRate: 150,
      currency: 'USD',
      unit: 'per hour'
    },
    paymentCycle: 'Per Project',
    advancePercentage: 30,
    payments: [
      {
        id: 'pay1',
        amount: 2400,
        currency: 'USD',
        status: 'Paid',
        dueDate: new Date('2024-01-30'),
        paidDate: new Date('2024-01-28'),
        description: 'Summer Fashion Campaign - Phase 1'
      }
    ],
    strengths: ['Creative storytelling', 'Quick turnaround', 'Professional equipment'],
    weaknesses: ['Limited animation skills', 'Prefers outdoor shoots'],
    specialRequirements: ['Requires 48h notice for shoots', 'Not available Sundays'],
    internalNotes: 'Excellent collaborator, highly recommended for lifestyle content. Always delivers on time.',
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2024-01-20'),
    createdBy: 'admin'
  },
  {
    id: '2',
    name: 'Marcus Chen',
    role: 'Editor',
    status: 'Active',
    capacity: 'Limited',
    rating: 8.9,
    profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Expert video editor specializing in social media content and motion graphics.',
    location: 'New York, NY',
    timezone: 'EST',
    email: 'marcus.chen@email.com',
    phone: '+1 (555) 987-6543',
    preferredCommunication: 'Email',
    currentProjects: [
      {
        id: 'p4',
        name: 'TikTok Content Series',
        status: 'Active',
        startDate: new Date('2024-01-10'),
      },
      {
        id: 'p5',
        name: 'YouTube Ads Campaign',
        status: 'Active',
        startDate: new Date('2024-01-20'),
      }
    ],
    pastProjects: [
      {
        id: 'p6',
        name: 'Brand Commercial',
        status: 'Completed',
        startDate: new Date('2023-12-01'),
        endDate: new Date('2023-12-20'),
        rating: 9.0
      }
    ],
    performance: {
      avgTurnaroundDays: 2.8,
      qualityHistory: [9.0, 8.8, 9.1, 8.9, 9.0],
      totalProjects: 28,
      completionRate: 96,
      avgRating: 8.9
    },
    rateCard: {
      baseRate: 75,
      currency: 'USD',
      unit: 'per hour'
    },
    paymentCycle: 'Weekly',
    payments: [
      {
        id: 'pay2',
        amount: 1800,
        currency: 'USD',
        status: 'Pending',
        dueDate: new Date('2024-02-05'),
        description: 'TikTok Content Series - Week 3'
      }
    ],
    strengths: ['Motion graphics', 'Color grading', 'Fast delivery'],
    weaknesses: ['Limited live-action experience'],
    specialRequirements: ['Prefers batch work', 'Works EST hours only'],
    internalNotes: 'Very reliable for social media content. Great attention to brand guidelines.',
    createdAt: new Date('2023-08-15'),
    updatedAt: new Date('2024-01-22'),
    createdBy: 'admin'
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    role: 'Influencer',
    status: 'Active',
    capacity: 'Busy',
    rating: 9.7,
    profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bio: 'Lifestyle influencer with 500K+ followers across platforms. Specializes in fashion and beauty content.',
    location: 'Miami, FL',
    timezone: 'EST',
    email: 'emma.rodriguez@email.com',
    phone: '+1 (555) 456-7890',
    whatsapp: '+1 (555) 456-7890',
    socialLinks: {
      instagram: '@emma_lifestyle',
      tiktok: '@emmarodriguez',
      youtube: '@EmmaRodriguezOfficial'
    },
    preferredCommunication: 'WhatsApp',
    currentProjects: [
      {
        id: 'p7',
        name: 'Beauty Brand Partnership',
        status: 'Active',
        startDate: new Date('2024-01-01'),
      },
      {
        id: 'p8',
        name: 'Fashion Week Coverage',
        status: 'Active',
        startDate: new Date('2024-01-25'),
      },
      {
        id: 'p9',
        name: 'Skincare Campaign',
        status: 'Active',
        startDate: new Date('2024-01-18'),
      }
    ],
    pastProjects: [
      {
        id: 'p10',
        name: 'Holiday Collection Launch',
        status: 'Completed',
        startDate: new Date('2023-11-15'),
        endDate: new Date('2023-12-31'),
        rating: 9.8
      }
    ],
    performance: {
      avgTurnaroundDays: 1.5,
      qualityHistory: [9.8, 9.7, 9.6, 9.7, 9.8],
      totalProjects: 12,
      completionRate: 100,
      avgRating: 9.7,
      engagementMetrics: {
        ctr: 5.8,
        roas: 4.2,
        impressions: 2500000
      }
    },
    rateCard: {
      baseRate: 5000,
      currency: 'USD',
      unit: 'per project'
    },
    paymentCycle: 'Per Project',
    advancePercentage: 50,
    payments: [
      {
        id: 'pay3',
        amount: 8000,
        currency: 'USD',
        status: 'Paid',
        dueDate: new Date('2024-01-15'),
        paidDate: new Date('2024-01-14'),
        description: 'Beauty Brand Partnership - Month 1'
      }
    ],
    strengths: ['High engagement rates', 'Professional content', 'Brand alignment'],
    weaknesses: ['Limited availability', 'Higher rates'],
    specialRequirements: ['Requires content approval', 'Books 2 weeks in advance'],
    internalNotes: 'Top performer with excellent ROI. Premium pricing but worth it for major campaigns.',
    createdAt: new Date('2023-05-01'),
    updatedAt: new Date('2024-01-25'),
    createdBy: 'admin'
  },
  {
    id: '4',
    name: 'David Park',
    role: 'Designer',
    status: 'Onboarding',
    capacity: 'Free',
    rating: 8.5,
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Creative designer with expertise in branding, UI/UX, and digital marketing materials.',
    location: 'San Francisco, CA',
    timezone: 'PST',
    email: 'david.park@email.com',
    phone: '+1 (555) 321-0987',
    socialLinks: {
      portfolio: 'davidparkdesign.com',
      instagram: '@davidpark_design'
    },
    preferredCommunication: 'Email',
    currentProjects: [],
    pastProjects: [
      {
        id: 'p11',
        name: 'Brand Identity Project',
        status: 'Completed',
        startDate: new Date('2023-10-01'),
        endDate: new Date('2023-11-15'),
        rating: 8.5
      }
    ],
    performance: {
      avgTurnaroundDays: 5.2,
      qualityHistory: [8.5, 8.3, 8.7, 8.4, 8.6],
      totalProjects: 6,
      completionRate: 95,
      avgRating: 8.5
    },
    rateCard: {
      baseRate: 85,
      currency: 'USD',
      unit: 'per hour'
    },
    paymentCycle: 'Per Project',
    payments: [
      {
        id: 'pay4',
        amount: 3400,
        currency: 'USD',
        status: 'Paid',
        dueDate: new Date('2023-12-01'),
        paidDate: new Date('2023-11-30'),
        description: 'Brand Identity Project - Final Payment'
      }
    ],
    strengths: ['Brand strategy', 'Clean aesthetics', 'Client communication'],
    weaknesses: ['New to team processes', 'Learning our style guide'],
    specialRequirements: ['Needs detailed briefs', 'Prefers milestone payments'],
    internalNotes: 'Promising new addition. Currently in onboarding phase with strong portfolio.',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-25'),
    createdBy: 'admin'
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    role: 'Photographer',
    status: 'Paused',
    capacity: 'Free',
    rating: 8.8,
    profilePicture: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    bio: 'Professional photographer specializing in product and lifestyle photography.',
    location: 'Chicago, IL',
    timezone: 'CST',
    email: 'lisa.thompson@email.com',
    phone: '+1 (555) 654-3210',
    preferredCommunication: 'Phone',
    currentProjects: [],
    pastProjects: [
      {
        id: 'p12',
        name: 'Product Catalog Shoot',
        status: 'Completed',
        startDate: new Date('2023-08-01'),
        endDate: new Date('2023-09-15'),
        rating: 9.0
      },
      {
        id: 'p13',
        name: 'Lifestyle Brand Photos',
        status: 'Completed',
        startDate: new Date('2023-06-15'),
        endDate: new Date('2023-07-30'),
        rating: 8.7
      }
    ],
    performance: {
      avgTurnaroundDays: 4.0,
      qualityHistory: [9.0, 8.7, 8.8, 8.9, 8.6],
      totalProjects: 9,
      completionRate: 100,
      avgRating: 8.8
    },
    rateCard: {
      baseRate: 200,
      currency: 'USD',
      unit: 'per hour'
    },
    paymentCycle: 'Per Project',
    payments: [
      {
        id: 'pay5',
        amount: 4800,
        currency: 'USD',
        status: 'Paid',
        dueDate: new Date('2023-10-01'),
        paidDate: new Date('2023-09-28'),
        description: 'Product Catalog Shoot - Full Payment'
      }
    ],
    strengths: ['Product photography', 'Studio lighting', 'Post-processing'],
    weaknesses: ['Limited travel availability', 'Studio-focused'],
    specialRequirements: ['Studio access required', 'Equipment rental covered'],
    internalNotes: 'Currently on maternity leave. Expected return March 2024. Excellent work quality.',
    createdAt: new Date('2023-04-01'),
    updatedAt: new Date('2023-12-01'),
    createdBy: 'admin'
  }
];

export default function ContentCreator() {
  const [creators, setCreators] = useState<ContentCreator[]>(MOCK_CREATORS);
  const [selectedCreator, setSelectedCreator] = useState<ContentCreator | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load creators from backend
  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    try {
      setLoading(true);
      const backendCreators = await CreatorService.getAllCreators();
      // If we have backend data, use it; otherwise fallback to mock data
      if (backendCreators.length > 0) {
        setCreators(backendCreators);
      }
    } catch (error) {
      console.error('Failed to load creators from backend:', error);
      // Keep using mock data if backend fails
    } finally {
      setLoading(false);
    }
  };

  const handleCreatorSelect = (creator: ContentCreator) => {
    setSelectedCreator(creator);
    setDrawerOpen(true);
  };

  const handleAddCreator = () => {
    setAddModalOpen(true);
  };

  const handleCreateCreator = async (newCreatorData: Omit<ContentCreator, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Try to create in backend first
      const createdCreator = await CreatorService.createCreator(newCreatorData);
      setCreators(prev => [createdCreator, ...prev]);
    } catch (error) {
      console.error('Failed to create creator in backend:', error);
      
      // Fallback: Create locally with mock ID
      const mockCreator: ContentCreator = {
        ...newCreatorData,
        id: `mock-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCreators(prev => [mockCreator, ...prev]);
    }
  };

  const handleUpdateCreator = async (updatedCreator: ContentCreator) => {
    try {
      // Try to update in backend first
      const updated = await CreatorService.updateCreator(updatedCreator.id, updatedCreator);
      setCreators(prev => prev.map(creator => 
        creator.id === updated.id ? updated : creator
      ));
      setSelectedCreator(updated);
    } catch (error) {
      console.error('Failed to update creator in backend:', error);
      
      // Fallback: Update locally
      setCreators(prev => prev.map(creator => 
        creator.id === updatedCreator.id ? updatedCreator : creator
      ));
      setSelectedCreator(updatedCreator);
    }
  };

  if (loading) {
    return (
      <ContentLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading creators...</p>
          </div>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout>
      <div className="h-full overflow-hidden">
        <CreatorTable
          creators={creators}
          onCreatorSelect={handleCreatorSelect}
          onAddCreator={handleAddCreator}
        />
        
        <CreatorDrawer
          creator={selectedCreator}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onUpdate={handleUpdateCreator}
        />

        <AddCreatorModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          onCreateCreator={handleCreateCreator}
        />
      </div>
    </ContentLayout>
  );
}