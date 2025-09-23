import { ContentCreator } from '@/types/contentCreator';

// Indian Content Creators Mock Data
export const INDIAN_MOCK_CREATORS: ContentCreator[] = [
  {
    id: '1',
    name: 'Arjun Sharma',
    role: 'Videographer',
    status: 'Active',
    availability: 'Free',
    rating: 9.2,
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Professional videographer with 6+ years experience in commercial and wedding content creation. Based in Mumbai.',
    location: 'Mumbai, Maharashtra',
    timezone: 'IST',
    email: 'arjun.sharma@gmail.com',
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    socialLinks: {
      instagram: '@arjun_visuals',
      youtube: '@arjunsharmafilms',
      portfolio: 'arjunsharmavisuals.com'
    },
    preferredCommunication: 'WhatsApp',
    shippingAddress: {
      fullAddress: 'A-405, Sunrise Apartments, Bandra West, Mumbai, Maharashtra',
      pincode: '400050',
      phone: '+91 98765 43210',
      alternatePhone: '+91 98765 43211'
    },
    currentProjects: [
      {
        id: 'p1',
        name: 'Bollywood Music Video',
        status: 'Active',
        startDate: new Date('2024-01-15'),
        rating: 9.0
      }
    ],
    pastProjects: [
      {
        id: 'p2',
        name: 'E-commerce Product Shoot',
        status: 'Completed',
        startDate: new Date('2023-11-01'),
        endDate: new Date('2023-12-15'),
        rating: 9.5
      },
      {
        id: 'p3',
        name: 'Corporate Documentary',
        status: 'Completed',
        startDate: new Date('2023-09-01'),
        endDate: new Date('2023-10-30'),
        rating: 9.2
      }
    ],
    performance: {
      avgTurnaroundDays: 4.0,
      qualityHistory: [9.5, 9.2, 9.0, 9.3, 9.1],
      totalProjects: 18,
      completionRate: 95,
      avgRating: 9.2,
      engagementMetrics: {
        ctr: 4.5,
        roas: 4.2,
        impressions: 180000
      }
    },
    rateCard: {
      baseRate: 8000,
      currency: 'INR',
      unit: 'per day'
    },
    paymentCycle: 'Per Project',
    advancePercentage: 40,
    payments: [
      {
        id: 'pay1',
        amount: 45000,
        currency: 'INR',
        status: 'Paid',
        dueDate: new Date('2024-01-30'),
        paidDate: new Date('2024-01-28'),
        description: 'Bollywood Music Video - Advance Payment'
      }
    ],
    strengths: ['Cinematic storytelling', 'Drone videography', 'Post-production'],
    weaknesses: ['Limited animation skills', 'Prefers natural lighting'],
    specialRequirements: ['Requires 72h notice for outdoor shoots', 'Not available during monsoons'],
    internalNotes: 'Excellent for Bollywood and commercial content. Very reliable and creative.',
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2024-01-20'),
    createdBy: 'admin'
  },
  {
    id: '2',
    name: 'Priya Patel',
    role: 'UGC Creator',
    status: 'Active',
    availability: 'Limited',
    rating: 8.9,
    profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b332e234?w=150&h=150&fit=crop&crop=face',
    bio: 'UGC creator specializing in lifestyle, beauty, and food content. 200K+ followers on Instagram.',
    location: 'Bangalore, Karnataka',
    timezone: 'IST',
    email: 'priya.patel@gmail.com',
    phone: '+91 87654 32109',
    whatsapp: '+91 87654 32109',
    socialLinks: {
      instagram: '@priya_lifestyle',
      youtube: '@priyapatelugc',
      portfolio: 'priyapatel.in'
    },
    preferredCommunication: 'WhatsApp',
    shippingAddress: {
      fullAddress: 'B-302, Tech Park Residency, Whitefield, Bangalore, Karnataka',
      pincode: '560066',
      phone: '+91 87654 32109'
    },
    currentProjects: [
      {
        id: 'p4',
        name: 'Beauty Brand Collaboration',
        status: 'Active',
        startDate: new Date('2024-01-10'),
      },
      {
        id: 'p5',
        name: 'Food Delivery App UGC',
        status: 'Active',
        startDate: new Date('2024-01-20'),
      }
    ],
    pastProjects: [
      {
        id: 'p6',
        name: 'Fashion E-commerce Campaign',
        status: 'Completed',
        startDate: new Date('2023-12-01'),
        endDate: new Date('2023-12-20'),
        rating: 9.0
      }
    ],
    performance: {
      avgTurnaroundDays: 2.5,
      qualityHistory: [9.0, 8.8, 9.1, 8.9, 9.0],
      totalProjects: 32,
      completionRate: 98,
      avgRating: 8.9
    },
    rateCard: {
      baseRate: 3500,
      currency: 'INR',
      unit: 'per deliverable'
    },
    paymentCycle: 'Per Project',
    advancePercentage: 25,
    payments: [
      {
        id: 'pay2',
        amount: 15000,
        currency: 'INR',
        status: 'Pending',
        dueDate: new Date('2024-02-05'),
        description: 'Beauty Brand Collaboration - Final Payment'
      }
    ],
    strengths: ['Authentic content', 'Quick delivery', 'High engagement rates'],
    weaknesses: ['Limited video editing skills'],
    specialRequirements: ['Prefers weekday shoots', 'Needs product samples 5 days prior'],
    internalNotes: 'Great for authentic lifestyle content. Very responsive and professional.',
    createdAt: new Date('2023-08-15'),
    updatedAt: new Date('2024-01-22'),
    createdBy: 'admin'
  },
  {
    id: '3',
    name: 'Rohit Gupta',
    role: 'Editor',
    status: 'Active',
    availability: 'Free',
    rating: 9.5,
    profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Expert video editor specializing in YouTube content, reels, and motion graphics. 8+ years experience.',
    location: 'Delhi, Delhi',
    timezone: 'IST',
    email: 'rohit.gupta@gmail.com',
    phone: '+91 76543 21098',
    whatsapp: '+91 76543 21098',
    socialLinks: {
      instagram: '@rohit_edits',
      youtube: '@rohitguptaeditor',
      portfolio: 'rohitguptaedits.com'
    },
    preferredCommunication: 'Email',
    shippingAddress: {
      fullAddress: 'C-45, Green Park Extension, New Delhi, Delhi',
      pincode: '110016',
      phone: '+91 76543 21098'
    },
    currentProjects: [
      {
        id: 'p7',
        name: 'YouTube Channel Management',
        status: 'Active',
        startDate: new Date('2024-01-01'),
      }
    ],
    pastProjects: [
      {
        id: 'p8',
        name: 'Brand Documentary Series',
        status: 'Completed',
        startDate: new Date('2023-10-01'),
        endDate: new Date('2023-12-30'),
        rating: 9.8
      },
      {
        id: 'p9',
        name: 'Social Media Campaign',
        status: 'Completed',
        startDate: new Date('2023-11-15'),
        endDate: new Date('2023-12-15'),
        rating: 9.2
      }
    ],
    performance: {
      avgTurnaroundDays: 1.5,
      qualityHistory: [9.8, 9.2, 9.5, 9.3, 9.6],
      totalProjects: 45,
      completionRate: 100,
      avgRating: 9.5
    },
    rateCard: {
      baseRate: 2500,
      currency: 'INR',
      unit: 'per hour'
    },
    paymentCycle: 'Weekly',
    advancePercentage: 20,
    payments: [
      {
        id: 'pay3',
        amount: 25000,
        currency: 'INR',
        status: 'Paid',
        dueDate: new Date('2024-01-15'),
        paidDate: new Date('2024-01-14'),
        description: 'YouTube Channel Management - Week 2'
      }
    ],
    strengths: ['Motion graphics', 'Color grading', 'Sound design', 'Fast turnaround'],
    weaknesses: ['Limited 3D animation'],
    specialRequirements: ['Works 9 AM to 6 PM IST', 'Prefers cloud collaboration'],
    internalNotes: 'Top-tier editor, extremely reliable. Great for YouTube and social media content.',
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'admin'
  },
  {
    id: '4',
    name: 'Kavya Nair',
    role: 'Influencer',
    status: 'Active',
    availability: 'Busy',
    rating: 9.0,
    profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bio: 'Fashion and lifestyle influencer with 350K+ followers. Specializes in ethnic and western wear content.',
    location: 'Kochi, Kerala',
    timezone: 'IST',
    email: 'kavya.nair@gmail.com',
    phone: '+91 65432 10987',
    whatsapp: '+91 65432 10987',
    socialLinks: {
      instagram: '@kavya_fashion',
      youtube: '@kavyanairofficial',
      portfolio: 'kavyanair.in'
    },
    preferredCommunication: 'WhatsApp',
    shippingAddress: {
      fullAddress: 'D-12, Marine Drive Apartments, Ernakulam, Kochi, Kerala',
      pincode: '682031',
      phone: '+91 65432 10987',
      alternatePhone: '+91 65432 10988'
    },
    currentProjects: [
      {
        id: 'p10',
        name: 'Saree Brand Partnership',
        status: 'Active',
        startDate: new Date('2024-01-08'),
      },
      {
        id: 'p11',
        name: 'Jewelry Collection Launch',
        status: 'Active',
        startDate: new Date('2024-01-22'),
      }
    ],
    pastProjects: [
      {
        id: 'p12',
        name: 'Diwali Collection Campaign',
        status: 'Completed',
        startDate: new Date('2023-10-15'),
        endDate: new Date('2023-11-15'),
        rating: 9.2
      }
    ],
    performance: {
      avgTurnaroundDays: 3.0,
      qualityHistory: [9.2, 8.8, 9.0, 9.1, 8.9],
      totalProjects: 25,
      completionRate: 96,
      avgRating: 9.0,
      engagementMetrics: {
        ctr: 5.2,
        roas: 4.8,
        impressions: 420000
      }
    },
    rateCard: {
      baseRate: 25000,
      currency: 'INR',
      unit: 'per project'
    },
    paymentCycle: 'Per Project',
    advancePercentage: 50,
    payments: [
      {
        id: 'pay4',
        amount: 40000,
        currency: 'INR',
        status: 'Partial',
        dueDate: new Date('2024-02-10'),
        description: 'Saree Brand Partnership - Advance + Milestone 1'
      }
    ],
    strengths: ['Authentic engagement', 'Quality photography', 'Traditional wear expertise'],
    weaknesses: ['Limited video content', 'Prefers natural settings'],
    specialRequirements: ['Requires 1 week notice for shoots', 'Not available during festival seasons'],
    internalNotes: 'Excellent for ethnic wear campaigns. Very professional and high engagement rates.',
    createdAt: new Date('2023-07-20'),
    updatedAt: new Date('2024-01-25'),
    createdBy: 'admin'
  },
  {
    id: '5',
    name: 'Aman Singh',
    role: 'Photographer',
    status: 'Active',
    availability: 'Free',
    rating: 8.7,
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Professional photographer specializing in product photography, portraits, and events.',
    location: 'Jaipur, Rajasthan',
    timezone: 'IST',
    email: 'aman.singh@gmail.com',
    phone: '+91 54321 09876',
    whatsapp: '+91 54321 09876',
    socialLinks: {
      instagram: '@aman_photography',
      portfolio: 'amansinghphotography.com'
    },
    preferredCommunication: 'Phone',
    shippingAddress: {
      fullAddress: 'E-78, Malviya Nagar, Jaipur, Rajasthan',
      pincode: '302017',
      phone: '+91 54321 09876'
    },
    currentProjects: [
      {
        id: 'p13',
        name: 'Wedding Photography',
        status: 'Active',
        startDate: new Date('2024-01-28'),
      }
    ],
    pastProjects: [
      {
        id: 'p14',
        name: 'Product Catalog Shoot',
        status: 'Completed',
        startDate: new Date('2023-12-10'),
        endDate: new Date('2023-12-20'),
        rating: 8.8
      }
    ],
    performance: {
      avgTurnaroundDays: 5.0,
      qualityHistory: [8.8, 8.5, 8.7, 8.9, 8.6],
      totalProjects: 22,
      completionRate: 95,
      avgRating: 8.7
    },
    rateCard: {
      baseRate: 5000,
      currency: 'INR',
      unit: 'per day'
    },
    paymentCycle: 'Per Project',
    advancePercentage: 30,
    payments: [
      {
        id: 'pay5',
        amount: 12000,
        currency: 'INR',
        status: 'Pending',
        dueDate: new Date('2024-02-15'),
        description: 'Wedding Photography - Final Payment'
      }
    ],
    strengths: ['Natural light photography', 'Portrait expertise', 'Event coverage'],
    weaknesses: ['Limited studio setup', 'Prefers outdoor shoots'],
    specialRequirements: ['Requires assistant for large events', 'Travel charges for outstation'],
    internalNotes: 'Great for traditional photography needs. Very punctual and professional.',
    createdAt: new Date('2023-09-05'),
    updatedAt: new Date('2024-01-28'),
    createdBy: 'admin'
  },
  {
    id: '6',
    name: 'Neha Agarwal',
    role: 'Copywriter',
    status: 'Active',
    availability: 'Limited',
    rating: 9.3,
    profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b332e234?w=150&h=150&fit=crop&crop=face',
    bio: 'Creative copywriter with expertise in brand storytelling, social media content, and advertising campaigns.',
    location: 'Pune, Maharashtra',
    timezone: 'IST',
    email: 'neha.agarwal@gmail.com',
    phone: '+91 43210 98765',
    whatsapp: '+91 43210 98765',
    socialLinks: {
      instagram: '@neha_writes',
      portfolio: 'nehaagarwalwrites.com'
    },
    preferredCommunication: 'Email',
    shippingAddress: {
      fullAddress: 'F-204, Seasons Mall Complex, Magarpatta, Pune, Maharashtra',
      pincode: '411028',
      phone: '+91 43210 98765'
    },
    currentProjects: [
      {
        id: 'p15',
        name: 'Tech Startup Content Strategy',
        status: 'Active',
        startDate: new Date('2024-01-12'),
      }
    ],
    pastProjects: [
      {
        id: 'p16',
        name: 'E-commerce Website Copy',
        status: 'Completed',
        startDate: new Date('2023-11-20'),
        endDate: new Date('2023-12-25'),
        rating: 9.5
      }
    ],
    performance: {
      avgTurnaroundDays: 2.0,
      qualityHistory: [9.5, 9.1, 9.3, 9.2, 9.4],
      totalProjects: 35,
      completionRate: 100,
      avgRating: 9.3
    },
    rateCard: {
      baseRate: 1500,
      currency: 'INR',
      unit: 'per hour'
    },
    paymentCycle: 'Monthly',
    advancePercentage: 25,
    payments: [
      {
        id: 'pay6',
        amount: 18000,
        currency: 'INR',
        status: 'Paid',
        dueDate: new Date('2024-01-31'),
        paidDate: new Date('2024-01-30'),
        description: 'Tech Startup Content Strategy - January'
      }
    ],
    strengths: ['Brand storytelling', 'SEO writing', 'Creative campaigns', 'Research skills'],
    weaknesses: ['Limited technical writing'],
    specialRequirements: ['Prefers detailed briefs', 'Needs access to brand guidelines'],
    internalNotes: 'Exceptional writer with great turnaround time. Perfect for brand campaigns.',
    createdAt: new Date('2023-05-15'),
    updatedAt: new Date('2024-01-30'),
    createdBy: 'admin'
  }
];