import { v4 as uuidv4 } from 'uuid'

// Types
export type Stage = 'idea' | 'production' | 'content' | 'scaling'
export type Priority = 'low' | 'medium' | 'high'
export type SampleStatus = 'requested' | 'received' | 'approved'
export type DeliverableStatus = 'planned' | 'in-progress' | 'done'

export interface User {
  id: string
  name: string
  avatar?: string
  email: string
}

export interface Supplier {
  id: string
  name: string
  contact: string
  quoteLink?: string
  moq?: number
  targetLandedCost?: number
}

export interface Deliverable {
  id: string
  name: string
  status: DeliverableStatus
  assignee?: User
  dueDate?: Date
}

export interface ActivityEntry {
  id: string
  actor: User
  action: string
  timestamp: Date
  details?: string
}

export interface Task {
  id: string
  title: string
  assignee?: User
  dueDate?: Date
  completed: boolean
  createdAt: Date
}

export interface TargetPersona {
  demographics: string
  keyInterests: string[]
  painPoints: string[]
}

export interface FeasibilityScore {
  demand: number // 1-5
  difficulty: number // 1-5
  profitPotential: number // 1-5
}

export interface CostSheet {
  landedCost: number
  shippingEstimate: number
  breakdown: Array<{ item: string; cost: number }>
}

export interface SampleTracking {
  requestDate?: Date
  receivedDate?: Date
  approvalStatus: 'pending' | 'approved' | 'rejected'
  notes: string
}

export interface ProductSpecifications {
  dimensions: string
  weight: string
  finishOptions: string[]
  technicalDrawings: Array<{ name: string; url: string }>
}

export interface ComplianceInfo {
  certificationsNeeded: string[]
  certificationsReceived: string[]
}

export interface ProductionTimeline {
  start?: Date
  end?: Date
  milestones: Array<{ name: string; date: Date; status: string }>
}

export interface EnhancedSupplier extends Supplier {
  location: string
  leadTime: string
  costSheet?: CostSheet
}

export interface LifecycleCard {
  id: string
  internalCode: string
  workingTitle: string
  thumbnail?: string
  tags: string[]
  category: string[]
  owner: User
  teamLead: User
  priority: Priority
  stage: Stage
  createdAt: Date
  updatedAt: Date
  idleDays: number
  potentialScore: number
  
  // Stage-specific data
  ideaData?: {
    notes: string
    competitorLinks: string[]
    adLinks: string[]
    media: string[]
    problemStatement: string
    opportunityStatement: string
    marketResearchNotes: string
    referenceImages: string[]
    referenceVideos: string[]
    targetPersona: TargetPersona
    estimatedSourcePriceMin: number
    estimatedSourcePriceMax: number
    selectedSupplierId?: string
    marginRange: { min: number; max: number }
    feasibilityScore: FeasibilityScore
  }
  
  productionData?: {
    suppliers: EnhancedSupplier[]
    sampleTracking: SampleTracking
    materials: string[]
    specifications: ProductSpecifications
    compliance: ComplianceInfo
    productionTimeline: ProductionTimeline
    specAttachments: Array<{ name: string; url: string }>
  }
  
  contentData?: {
    shootPlan?: {
      moodboardLink?: string
      briefLink?: string
    }
    scripts: {
      hero?: string
      lifestyle?: string
      unboxing?: string
      fifteenSec?: string
      thirtySec?: string
    }
    deliverables: Deliverable[]
    assetLinks: Array<{ name: string; url: string; type: 'drive' | 'dropbox' | 'other' }>
    agency?: User
    influencer?: User
  }
  
  scalingData?: {
    launchDate?: Date
    channels: string[] // 'facebook', 'instagram', 'google', 'youtube'
    budgetPlan?: {
      total: number
      facebook?: number
      instagram?: number
      google?: number
      youtube?: number
    }
    kpis?: {
      targetRevenue?: number
      actualRevenue?: number
      targetRoas?: number
      actualRoas?: number
      targetConversions?: number
      actualConversions?: number
    }
    experiments: Array<{
      id: string
      title: string
      description: string
      startDate: Date
      endDate?: Date
      result?: string
    }>
    learnings: string
  }
  
  activities: ActivityEntry[]
  tasks: Task[]
}

export interface SavedView {
  id: string
  name: string
  filters: FilterOptions
  search: string
  view: ViewType
  createdAt: Date
}

export interface FilterOptions {
  stages: Stage[]
  tags: string[]
  categories: string[]
  owners: string[]
  teamLeads: string[]
  priority?: Priority[]
  potentialScoreMin?: number
  potentialScoreMax?: number
  idleDaysMin?: number
  internalCodePattern?: string
  createdDateRange?: { start: Date; end: Date }
  updatedDateRange?: { start: Date; end: Date }
  marginRange?: { min: number; max: number }
  supplierLocations?: string[]
}

export type ViewType = 'table' | 'gallery'
export type SortField = 'title' | 'createdAt' | 'updatedAt' | 'potentialScore' | 'idleDays'
export type SortDirection = 'asc' | 'desc'

// Mock users
const mockUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john@company.com', avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=john' },
  { id: '2', name: 'Sarah Chen', email: 'sarah@company.com', avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=sarah' },
  { id: '3', name: 'Mike Johnson', email: 'mike@company.com', avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=mike' },
  { id: '4', name: 'Emily Davis', email: 'emily@company.com', avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=emily' },
  { id: '5', name: 'Alex Kim', email: 'alex@company.com', avatar: 'https://api.dicebear.com/7.x/avatars/svg?seed=alex' }
]

// Helper to generate internal product codes
function generateInternalCode(category: string, index: number): string {
  const categoryPrefix = category.substring(0, 3).toUpperCase()
  const year = new Date().getFullYear().toString().slice(-2)
  const sequence = (index + 1).toString().padStart(3, '0')
  return `${categoryPrefix}${year}${sequence}`
}

// Helper to calculate potential score from feasibility scores
function calculatePotentialScore(feasibilityScore: FeasibilityScore): number {
  const { demand, difficulty, profitPotential } = feasibilityScore
  return Math.round((demand * 0.4 + profitPotential * 0.35 + (6 - difficulty) * 0.25) / 5 * 100)
}

// Helper to calculate idle days
function calculateIdleDays(updatedAt: Date): number {
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - updatedAt.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Mock data
const mockCards: LifecycleCard[] = [
  // Idea stage cards
  {
    id: uuidv4(),
    internalCode: generateInternalCode('lifestyle', 0),
    workingTitle: 'Smart Water Bottle with Temperature Control',
    thumbnail: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400',
    tags: ['smart-tech', 'lifestyle', 'health'],
    category: ['Lifestyle', 'Smart Tech'],
    owner: mockUsers[0],
    teamLead: mockUsers[0],
    priority: 'high',
    stage: 'idea',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-18'),
    idleDays: calculateIdleDays(new Date('2024-01-18')),
    potentialScore: 0,
    ideaData: {
      notes: '# Smart Water Bottle Concept\n\n## Key Features\n- Temperature control (hot/cold)\n- App connectivity\n- Hydration tracking\n- Premium materials',
      competitorLinks: ['https://example.com/competitor1', 'https://example.com/competitor2'],
      adLinks: ['https://facebook.com/ads/library/123', 'https://tiktok.com/ads/456'],
      media: ['https://images.unsplash.com/photo-1523362628745-0c100150b504'],
      problemStatement: 'People struggle to maintain proper hydration and prefer beverages at specific temperatures throughout the day',
      opportunityStatement: 'Smart hydration market growing 15% annually with premium segment showing highest margins',
      marketResearchNotes: 'TAM: $2.1B, competitor analysis shows gap in premium temperature-controlled segment',
      referenceImages: ['https://images.unsplash.com/photo-1523362628745-0c100150b504'],
      referenceVideos: ['https://youtube.com/watch?v=sample'],
      targetPersona: {
        demographics: 'Health-conscious professionals, 25-45, $50K+ income',
        keyInterests: ['fitness', 'wellness', 'technology', 'sustainability'],
        painPoints: ['forgetting to drink water', 'beverage temperature inconsistency', 'lack of hydration tracking']
      },
      estimatedSourcePriceMin: 1200,
      estimatedSourcePriceMax: 1800,
      marginRange: { min: 55, max: 65 },
      feasibilityScore: {
        demand: 4,
        difficulty: 4,
        profitPotential: 4
      }
    },
    activities: [],
    tasks: []
  },
  {
    id: uuidv4(),
    internalCode: generateInternalCode('accessories', 1),
    workingTitle: 'Eco-Friendly Phone Case Line',
    thumbnail: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400',
    tags: ['eco-friendly', 'phone-accessories', 'sustainability'],
    category: ['Accessories', 'Eco-Friendly'],
    owner: mockUsers[1],
    teamLead: mockUsers[1],
    priority: 'medium',
    stage: 'idea',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-22'),
    idleDays: calculateIdleDays(new Date('2024-01-22')),
    potentialScore: 0,
    ideaData: {
      notes: 'Biodegradable phone cases made from plant-based materials',
      competitorLinks: ['https://example.com/eco-competitor'],
      adLinks: [],
      media: [],
      problemStatement: 'Plastic phone cases contribute to environmental waste, consumers want sustainable alternatives',
      opportunityStatement: 'Eco-friendly accessories market growing 25% YoY, high consumer willingness to pay premium for sustainable products',
      marketResearchNotes: 'Market research shows 73% of millennials willing to pay more for sustainable products',
      referenceImages: ['https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400'],
      referenceVideos: [],
      targetPersona: {
        demographics: 'Environmentally conscious consumers, 18-35, diverse income levels',
        keyInterests: ['sustainability', 'environmental protection', 'minimalism', 'social responsibility'],
        painPoints: ['guilt about environmental impact', 'lack of durable eco alternatives', 'limited design options in sustainable products']
      },
      estimatedSourcePriceMin: 400,
      estimatedSourcePriceMax: 600,
      marginRange: { min: 60, max: 70 },
      feasibilityScore: {
        demand: 3,
        difficulty: 2,
        profitPotential: 4
      }
    },
    activities: [],
    tasks: []
  },
  // Production stage cards
  {
    id: uuidv4(),
    internalCode: generateInternalCode('office', 2),
    workingTitle: 'Wireless Charging Desk Organizer',
    thumbnail: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
    tags: ['office', 'wireless-charging', 'organization'],
    category: ['Office', 'Electronics'],
    owner: mockUsers[2],
    teamLead: mockUsers[2],
    priority: 'high',
    stage: 'production',
    createdAt: new Date('2023-12-10'),
    updatedAt: new Date('2024-01-10'),
    idleDays: calculateIdleDays(new Date('2024-01-10')),
    potentialScore: 78,
    productionData: {
      suppliers: [
        {
          id: uuidv4(),
          name: 'TechCorp Manufacturing',
          contact: 'supplier@techcorp.com',
          location: 'Shenzhen, China',
          leadTime: '15-20 days',
          quoteLink: 'https://example.com/quote1',
          moq: 500,
          targetLandedCost: 25.50,
          costSheet: {
            landedCost: 25.50,
            shippingEstimate: 3.50,
            breakdown: [
              { item: 'Manufacturing', cost: 18.00 },
              { item: 'Materials', cost: 4.00 },
              { item: 'Shipping', cost: 3.50 }
            ]
          }
        }
      ],
      sampleTracking: {
        requestDate: new Date('2023-12-15'),
        receivedDate: new Date('2024-01-05'),
        approvalStatus: 'approved',
        notes: 'Sample approved with minor adjustments to charging pad positioning'
      },
      materials: ['ABS Plastic', 'Bamboo Wood', 'Wireless Charging Coil', 'LED Indicators'],
      specifications: {
        dimensions: '250mm x 150mm x 80mm',
        weight: '450g',
        finishOptions: ['Natural Bamboo', 'Dark Walnut', 'White Oak'],
        technicalDrawings: [
          { name: 'Technical Specifications.pdf', url: 'https://example.com/specs.pdf' },
          { name: 'Design Guidelines.pdf', url: 'https://example.com/design.pdf' }
        ]
      },
      compliance: {
        certificationsNeeded: ['FCC', 'CE', 'Qi Wireless Charging'],
        certificationsReceived: ['FCC', 'CE']
      },
      productionTimeline: {
        start: new Date('2024-02-01'),
        end: new Date('2024-03-15'),
        milestones: [
          { name: 'Production Start', date: new Date('2024-02-01'), status: 'completed' },
          { name: 'First Article Inspection', date: new Date('2024-02-10'), status: 'completed' },
          { name: 'Bulk Production', date: new Date('2024-02-20'), status: 'in-progress' },
          { name: 'Quality Testing', date: new Date('2024-03-05'), status: 'pending' },
          { name: 'Delivery', date: new Date('2024-03-15'), status: 'pending' }
        ]
      },
      specAttachments: [
        { name: 'Technical Specifications.pdf', url: 'https://example.com/specs.pdf' },
        { name: 'Design Guidelines.pdf', url: 'https://example.com/design.pdf' }
      ]
    },
    activities: [],
    tasks: []
  },
  // Content stage cards
  {
    id: uuidv4(),
    internalCode: generateInternalCode('lighting', 3),
    workingTitle: 'LED Strip Lights Kit',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    tags: ['lighting', 'home-decor', 'smart-home'],
    category: ['Lighting', 'Home Decor'],
    owner: mockUsers[3],
    teamLead: mockUsers[3],
    priority: 'medium',
    stage: 'content',
    createdAt: new Date('2023-11-20'),
    updatedAt: new Date('2024-01-08'),
    idleDays: calculateIdleDays(new Date('2024-01-08')),
    potentialScore: 65,
    contentData: {
      shootPlan: {
        moodboardLink: 'https://pinterest.com/moodboard/123',
        briefLink: 'https://docs.google.com/document/brief'
      },
      scripts: {
        hero: 'Transform your space with customizable LED lighting...',
        lifestyle: 'Create the perfect ambiance for any occasion...',
        unboxing: 'Unboxing the ultimate LED lighting solution...'
      },
      deliverables: [
        { id: uuidv4(), name: 'Hero Image', status: 'done', assignee: mockUsers[3] },
        { id: uuidv4(), name: 'Lifestyle Photos', status: 'in-progress', assignee: mockUsers[3] },
        { id: uuidv4(), name: 'Unboxing Video', status: 'planned' },
        { id: uuidv4(), name: '15s Ad', status: 'planned' },
        { id: uuidv4(), name: '30s Ad', status: 'planned' }
      ],
      assetLinks: [
        { name: 'Hero Images Folder', url: 'https://drive.google.com/folder1', type: 'drive' },
        { name: 'Video Assets', url: 'https://dropbox.com/folder2', type: 'dropbox' }
      ],
      agency: mockUsers[4]
    },
    activities: [],
    tasks: []
  },
  // Scaling stage cards
  {
    id: uuidv4(),
    internalCode: generateInternalCode('audio', 4),
    workingTitle: 'Bluetooth Sleep Headphones',
    thumbnail: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400',
    tags: ['audio', 'sleep', 'wellness', 'bluetooth'],
    category: ['Audio', 'Wellness'],
    owner: mockUsers[0],
    teamLead: mockUsers[0],
    priority: 'high',
    stage: 'scaling',
    createdAt: new Date('2023-10-01'),
    updatedAt: new Date('2024-01-12'),
    idleDays: calculateIdleDays(new Date('2024-01-12')),
    potentialScore: 85,
    scalingData: {
      launchDate: new Date('2023-12-01'),
      channels: ['facebook', 'instagram', 'google'],
      budgetPlan: {
        total: 50000,
        facebook: 20000,
        instagram: 15000,
        google: 15000
      },
      kpis: {
        targetRevenue: 100000,
        actualRevenue: 85000,
        targetRoas: 3.0,
        actualRoas: 2.8,
        targetConversions: 500,
        actualConversions: 425
      },
      experiments: [
        {
          id: uuidv4(),
          title: 'Video vs Image Creative Test',
          description: 'Testing video ads vs static image ads performance',
          startDate: new Date('2023-12-15'),
          endDate: new Date('2024-01-05'),
          result: 'Video ads performed 23% better in conversion rate'
        }
      ],
      learnings: 'Video content significantly outperforms static images. Sleep-related messaging resonates better than general comfort messaging.'
    },
    activities: [],
    tasks: []
  }
]

// Calculate potential scores for cards with idea data
mockCards.forEach(card => {
  if (card.ideaData && card.ideaData.feasibilityScore) {
    card.potentialScore = calculatePotentialScore(card.ideaData.feasibilityScore)
  }
})

let savedViews: SavedView[] = [
  {
    id: uuidv4(),
    name: 'High Priority Items',
    filters: { stages: [], tags: [], owners: [], priority: ['high'] },
    search: '',
    view: 'gallery',
    createdAt: new Date()
  },
  {
    id: uuidv4(),
    name: 'Smart Tech Products',
    filters: { stages: [], tags: ['smart-tech', 'smart-home'], owners: [] },
    search: '',
    view: 'gallery',
    createdAt: new Date()
  }
]

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class MockLifecycleAdapter {
  async listCards(options?: {
    filters?: FilterOptions
    search?: string
    sort?: { field: SortField; direction: SortDirection }
    viewPrefs?: Record<string, unknown>
  }): Promise<LifecycleCard[]> {
    // TODO: wire to Supabase later - implement real filtering and sorting
    await delay(Math.random() * 200 + 100)
    
    let filtered = [...mockCards]
    
    if (options?.search) {
      const searchLower = options.search.toLowerCase()
      filtered = filtered.filter(card => 
        card.title.toLowerCase().includes(searchLower) ||
        card.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        card.owner.name.toLowerCase().includes(searchLower) ||
        (card.ideaData?.competitorLinks.some(link => link.toLowerCase().includes(searchLower))) ||
        (card.ideaData?.adLinks.some(link => link.toLowerCase().includes(searchLower)))
      )
    }
    
    if (options?.filters) {
      const { stages, tags, owners, priority, potentialScoreMin, potentialScoreMax, idleDaysMin } = options.filters
      
      if (stages?.length) {
        filtered = filtered.filter(card => stages.includes(card.stage))
      }
      
      if (tags?.length) {
        filtered = filtered.filter(card => 
          tags.some(tag => card.tags.includes(tag))
        )
      }
      
      if (owners?.length) {
        filtered = filtered.filter(card => owners.includes(card.owner.id))
      }
      
      if (priority?.length) {
        filtered = filtered.filter(card => priority.includes(card.priority))
      }
      
      if (potentialScoreMin !== undefined) {
        filtered = filtered.filter(card => card.potentialScore >= potentialScoreMin)
      }
      
      if (potentialScoreMax !== undefined) {
        filtered = filtered.filter(card => card.potentialScore <= potentialScoreMax)
      }
      
      if (idleDaysMin !== undefined) {
        filtered = filtered.filter(card => card.idleDays >= idleDaysMin)
      }
    }
    
    // Sorting
    if (options?.sort) {
      const { field, direction } = options.sort
      filtered.sort((a, b) => {
        let aVal: unknown = a[field]
        let bVal: unknown = b[field]
        
        if (field === 'title') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        } else if (field === 'createdAt' || field === 'updatedAt') {
          aVal = aVal.getTime()
          bVal = bVal.getTime()
        }
        
        if (direction === 'desc') {
          return bVal > aVal ? 1 : -1
        }
        return aVal > bVal ? 1 : -1
      })
    }
    
    return filtered
  }
  
  async createIdea(payload: {
    title: string
    tags?: string[]
    category?: string[]
    competitorLinks?: string[]
    adLinks?: string[]
    notes?: string
    thumbnail?: string
    estimatedSourcePriceMin?: string
    estimatedSourcePriceMax?: string
    selectedSupplierId?: string
  }): Promise<LifecycleCard> {
    // TODO: wire to Supabase later - implement real card creation
    await delay(Math.random() * 200 + 50)
    
    const feasibilityScore: FeasibilityScore = {
      demand: 3,
      difficulty: 3,
      profitPotential: 3
    }
    
    const newCard: LifecycleCard = {
      id: uuidv4(),
      internalCode: generateInternalCode(payload.category?.[0] || 'product', mockCards.length),
      workingTitle: payload.title,
      thumbnail: payload.thumbnail,
      tags: payload.tags || [],
      category: payload.category || ['General'],
      owner: mockUsers[0], // Default to first user
      teamLead: mockUsers[0],
      priority: 'medium',
      stage: 'idea',
      createdAt: new Date(),
      updatedAt: new Date(),
      idleDays: 0,
      potentialScore: calculatePotentialScore(feasibilityScore),
      ideaData: {
        notes: payload.notes || '',
        competitorLinks: payload.competitorLinks || [],
        adLinks: payload.adLinks || [],
        media: [],
        problemStatement: '',
        opportunityStatement: '',
        marketResearchNotes: '',
        referenceImages: [],
        referenceVideos: [],
        targetPersona: {
          demographics: '',
          keyInterests: [],
          painPoints: []
        },
        estimatedSourcePriceMin: payload.estimatedSourcePriceMin ? parseFloat(payload.estimatedSourcePriceMin) : 0,
        estimatedSourcePriceMax: payload.estimatedSourcePriceMax ? parseFloat(payload.estimatedSourcePriceMax) : 0,
        selectedSupplierId: payload.selectedSupplierId,
        marginRange: { min: 50, max: 70 },
        feasibilityScore
      },
      activities: [{
        id: uuidv4(),
        actor: mockUsers[0],
        action: 'Created new idea',
        timestamp: new Date()
      }],
      tasks: []
    }
    
    mockCards.unshift(newCard)
    return newCard
  }
  
  async updateCard(id: string, patch: Partial<LifecycleCard>): Promise<LifecycleCard> {
    // TODO: wire to Supabase later - implement real card updates
    await delay(Math.random() * 150 + 50)
    
    const cardIndex = mockCards.findIndex(card => card.id === id)
    if (cardIndex === -1) {
      throw new Error('Card not found')
    }
    
    const updatedCard = {
      ...mockCards[cardIndex],
      ...patch,
      updatedAt: new Date(),
      idleDays: 0
    }
    
    // Recalculate potential score if idea data changed
    if (patch.ideaData && updatedCard.ideaData && updatedCard.ideaData.feasibilityScore) {
      updatedCard.potentialScore = calculatePotentialScore(updatedCard.ideaData.feasibilityScore)
    }
    
    mockCards[cardIndex] = updatedCard
    return updatedCard
  }
  
  async moveStage(id: string, stage: Stage): Promise<LifecycleCard> {
    // TODO: wire to Supabase later - implement real stage moves
    await delay(Math.random() * 100 + 30)
    
    const cardIndex = mockCards.findIndex(card => card.id === id)
    if (cardIndex === -1) {
      throw new Error('Card not found')
    }
    
    const oldStage = mockCards[cardIndex].stage
    mockCards[cardIndex] = {
      ...mockCards[cardIndex],
      stage,
      updatedAt: new Date(),
      idleDays: 0
    }
    
    // Add activity entry
    await this.appendActivity(id, {
      id: uuidv4(),
      actor: mockUsers[0],
      action: `Moved from ${oldStage} to ${stage}`,
      timestamp: new Date()
    })
    
    return mockCards[cardIndex]
  }
  
  async appendActivity(id: string, activityEntry: ActivityEntry): Promise<void> {
    // TODO: wire to Supabase later - implement real activity logging
    await delay(20)
    
    const card = mockCards.find(card => card.id === id)
    if (card) {
      card.activities.unshift(activityEntry)
    }
  }
  
  async listSavedViews(): Promise<SavedView[]> {
    // TODO: wire to Supabase later - implement real saved views
    await delay(50)
    return [...savedViews]
  }
  
  async saveView(viewDef: Omit<SavedView, 'id' | 'createdAt'>): Promise<SavedView> {
    // TODO: wire to Supabase later - implement real view saving
    await delay(100)
    
    const newView: SavedView = {
      ...viewDef,
      id: uuidv4(),
      createdAt: new Date()
    }
    
    savedViews.push(newView)
    return newView
  }
  
  async deleteView(id: string): Promise<void> {
    // TODO: wire to Supabase later - implement real view deletion
    await delay(50)
    
    savedViews = savedViews.filter(view => view.id !== id)
  }
  
  async listOwners(): Promise<User[]> {
    // TODO: wire to Supabase later - fetch real users
    await delay(30)
    return [...mockUsers]
  }
}

export const mockLifecycleAdapter = new MockLifecycleAdapter()