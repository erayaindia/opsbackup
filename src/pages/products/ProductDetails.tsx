import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Edit3,
  Save,
  Trash2,
  Package,
  Lightbulb,
  Factory,
  Camera,
  TrendingUp,
  X,
  ExternalLink,
  Plus,
  Link,
  Palette,
  Upload,
  FileText,
  Archive,
  Eye,
  CheckCircle,
  Clock,
  Tag,
  ChevronDown
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import RichEditor from '@/components/RichEditor'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

import {
  productLifecycleService,
  type LifecycleProduct,
  type CreateProductPayload
} from '@/services/productLifecycleService'
import { productDesignService, type ProductDesign } from '@/integrations/supabase/product-design-service'
import { productProductionService, type ProductProduction } from '@/integrations/supabase/product-production-service'
import { productScalingService, type ProductScaling } from '@/integrations/supabase/product-scaling-service'
import { supabase } from '@/integrations/supabase/client'
import { FormContent } from '@/components/products/FormContent'
import { useUsers } from '@/hooks/useUsers'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useCategories } from '@/hooks/useCategories'
import { useVendors } from '@/hooks/useSuppliers'
import type { ProductImage } from '@/services/productImagesService'

const STAGE_CONFIG = {
  idea: { name: 'Idea', icon: Lightbulb, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950' },
  design: { name: 'Design', icon: Palette, color: 'text-pink-600', bgColor: 'bg-pink-50 dark:bg-pink-950' },
  production: { name: 'Production', icon: Factory, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950' },
  content: { name: 'Content', icon: Camera, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950' },
  scaling: { name: 'Scaling', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950' },
  inventory: { name: 'Inventory', icon: Package, color: 'text-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-950' }
}

// Generate URL-friendly slug from product title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Find product by slug (generated from title)
const findProductBySlug = (products: LifecycleProduct[], slug: string): LifecycleProduct | null => {
  return products.find(product => {
    const productSlug = generateSlug(product.workingTitle || product.name || `product-${product.internalCode}`)
    return productSlug === slug
  }) || null
}

export default function ProductDetails() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [product, setProduct] = useState<LifecycleProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState('idea')

  // Database records state
  const [designData, setDesignData] = useState<ProductDesign | null>(null)
  const [productionData, setProductionData] = useState<ProductProduction | null>(null)
  const [scalingData, setScalingData] = useState<ProductScaling | null>(null)

  // Form state for editing
  const [editForm, setEditForm] = useState({
    title: '',
    tags: '',
    category: '',
    competitorLinks: '',
    adLinks: '',
    notes: '',
    problemStatement: '',
    opportunityStatement: '',
    estimatedSourcePriceMin: '',
    estimatedSourcePriceMax: '',
    estimatedSellingPrice: '',
    selectedSupplierId: '',
    priority: 'medium',
    stage: 'idea',
    assignedTo: ''
  })

  // Edit-specific state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [referenceLinks, setReferenceLinks] = useState<Array<{url: string, type: 'competitor' | 'ad'}>>([])
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [uploadedVideos, setUploadedVideos] = useState<File[]>([])
  const [uploadedProductImage, setUploadedProductImage] = useState<File | null>(null)
  const [currentProductImage, setCurrentProductImage] = useState<string | null>(null)
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Multiple suppliers state
  const [selectedSuppliers, setSelectedSuppliers] = useState<Array<{
    id: string,
    name: string,
    sourcePrice?: string,
    sellingPrice?: string,
    quality?: 'excellent' | 'good' | 'average' | 'poor',
    notes?: string
  }>>([])
  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false)

  // Multiple links state
  const [productLinks, setProductLinks] = useState<Array<{
    id: string,
    url: string,
    title: string,
    type: 'reference' | 'competitor' | 'inspiration' | 'documentation' | 'other'
  }>>([])
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkType, setNewLinkType] = useState<'reference' | 'competitor' | 'inspiration' | 'documentation' | 'other'>('reference')

  // Packing section state
  const [packingFiles, setPackingFiles] = useState<File[]>([])
  const [packingInstructions, setPackingInstructions] = useState('')

  // Design Brief state - connecting to product_design table
  const [productVision, setProductVision] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [designStyle, setDesignStyle] = useState('')

  // Production Details state - connecting to product_production table
  const [productionDetails, setProductionDetails] = useState('')

  // Visual Identity state - connecting to product_design table
  const [primaryColors, setPrimaryColors] = useState('')
  const [secondaryColors, setSecondaryColors] = useState('')
  const [materialPreferences, setMaterialPreferences] = useState('')

  // Design Assets state - connecting to product_design table
  const [moodBoardUrl, setMoodBoardUrl] = useState('')
  const [designFilesUrl, setDesignFilesUrl] = useState('')
  const [technicalDrawings, setTechnicalDrawings] = useState('')
  const [cadFiles, setCadFiles] = useState('')

  // Design Progress state - connecting to product_design table
  const [designStatus, setDesignStatus] = useState('')
  const [currentPhase, setCurrentPhase] = useState('')
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [nextMilestone, setNextMilestone] = useState('')

  // Design Feedback state - connecting to product_design table
  const [designFeedback, setDesignFeedback] = useState('')

  // Production state - connecting to product_production table
  // Supplier & Pricing state
  const [supplierComparisonNotes, setSupplierComparisonNotes] = useState('')
  const [preferredSupplierId, setPreferredSupplierId] = useState('')

  // Sample Management state
  const [sampleRequestDate, setSampleRequestDate] = useState('')
  const [sampleReceivedDate, setSampleReceivedDate] = useState('')
  const [sampleStatus, setSampleStatus] = useState('')
  const [sampleNotes, setSampleNotes] = useState('')
  const [sampleQualityRating, setSampleQualityRating] = useState(0)

  // Production Timeline state
  const [productionStartDate, setProductionStartDate] = useState('')
  const [productionCompletionDate, setProductionCompletionDate] = useState('')
  const [productionMilestones, setProductionMilestones] = useState('')
  const [productionStatus, setProductionStatus] = useState('')

  // Materials & Specifications state
  const [dimensions, setDimensions] = useState('')
  const [weight, setWeight] = useState('')
  const [materialsSpecification, setMaterialsSpecification] = useState('')

  // Manufacturing details state
  const [manufacturingMethod, setManufacturingMethod] = useState('')
  const [qualityStandards, setQualityStandards] = useState('')
  const [complianceRequirements, setComplianceRequirements] = useState('')

  // Cost tracking state
  const [estimatedUnitCost, setEstimatedUnitCost] = useState(0)
  const [actualUnitCost, setActualUnitCost] = useState(0)
  const [toolingCost, setToolingCost] = useState(0)
  const [setupCost, setSetupCost] = useState(0)

  // Quality control state
  const [qcRequirements, setQcRequirements] = useState('')
  const [qcStatus, setQcStatus] = useState('')
  const [qcNotes, setQcNotes] = useState('')

  // Lead times state
  const [leadTimeDays, setLeadTimeDays] = useState(0)
  const [minimumOrderQuantity, setMinimumOrderQuantity] = useState(0)

  // Scaling state - connecting to product_scaling table
  // Launch Details state
  const [launchDate, setLaunchDate] = useState('')
  const [marketingChannels, setMarketingChannels] = useState<string[]>([])
  const [launchStatus, setLaunchStatus] = useState('')
  const [launchNotes, setLaunchNotes] = useState('')

  // Budget Allocation state
  const [totalBudget, setTotalBudget] = useState(0)
  const [facebookBudget, setFacebookBudget] = useState(0)
  const [instagramBudget, setInstagramBudget] = useState(0)
  const [googleBudget, setGoogleBudget] = useState(0)
  const [youtubeBudget, setYoutubeBudget] = useState(0)
  const [budgetAllocationNotes, setBudgetAllocationNotes] = useState('')
  const [otherBudget, setOtherBudget] = useState(0)
  const [budgetPeriod, setBudgetPeriod] = useState('')
  const [budgetStartDate, setBudgetStartDate] = useState('')
  const [budgetEndDate, setBudgetEndDate] = useState('')

  // Performance Targets state
  const [targetRevenue, setTargetRevenue] = useState(0)
  const [actualRevenue, setActualRevenue] = useState(0)
  const [targetRoas, setTargetRoas] = useState(0)
  const [actualRoas, setActualRoas] = useState(0)
  const [targetConversions, setTargetConversions] = useState(0)
  const [actualConversions, setActualConversions] = useState(0)
  const [targetCpc, setTargetCpc] = useState(0)
  const [actualCpc, setActualCpc] = useState(0)
  const [targetCtr, setTargetCtr] = useState(0)
  const [actualCtr, setActualCtr] = useState(0)
  const [performanceNotes, setPerformanceNotes] = useState('')

  // Additional Performance Metrics state
  const [targetCpa, setTargetCpa] = useState(0)
  const [actualCpa, setActualCpa] = useState(0)
  const [targetAov, setTargetAov] = useState(0)
  const [actualAov, setActualAov] = useState(0)
  const [targetLtv, setTargetLtv] = useState(0)
  const [actualLtv, setActualLtv] = useState(0)

  // Campaign Data state
  const [campaignDuration, setCampaignDuration] = useState(0)
  const [campaignStatus, setCampaignStatus] = useState('')
  const [actualSpend, setActualSpend] = useState(0)
  const [impressions, setImpressions] = useState(0)
  const [clicks, setClicks] = useState(0)
  const [conversions, setConversions] = useState(0)
  const [adSpendTotal, setAdSpendTotal] = useState(0)
  const [impressionsTotal, setImpressionsTotal] = useState(0)
  const [clicksTotal, setClicksTotal] = useState(0)
  const [ordersTotal, setOrdersTotal] = useState(0)

  // Learnings & Insights state
  const [learningsInsights, setLearningsInsights] = useState('')
  const [campaignNotes, setCampaignNotes] = useState('')
  const [optimizationNotes, setOptimizationNotes] = useState('')
  const [recommendations, setRecommendations] = useState('')

  // Scaling Strategy state
  const [scalingStage, setScalingStage] = useState('')
  const [nextScalingAction, setNextScalingAction] = useState('')
  const [scalingConstraints, setScalingConstraints] = useState('')

  // Video Scripts state
  const [heroVideoScript, setHeroVideoScript] = useState('')
  const [lifestyleScript, setLifestyleScript] = useState('')
  const [unboxingScript, setUnboxingScript] = useState('')
  const [script15s, setScript15s] = useState('')
  const [script30s, setScript30s] = useState('')

  // Market Analysis state
  const [marketSizeEstimate, setMarketSizeEstimate] = useState('')
  const [marketPenetration, setMarketPenetration] = useState('')
  const [competitiveAdvantage, setCompetitiveAdvantage] = useState('')
  const [marketFeedback, setMarketFeedback] = useState('')

  // Growth Strategy state
  const [growthStrategy, setGrowthStrategy] = useState('')
  const [expansionPlans, setExpansionPlans] = useState('')
  const [optimizationOpportunities, setOptimizationOpportunities] = useState('')

  // Packing Design Section state
  const [packagingConcept, setPackagingConcept] = useState('')
  const [packagingFiles, setPackagingFiles] = useState<File[]>([])
  const [printVendorLinks, setPrintVendorLinks] = useState<Array<{
    id: string,
    name: string,
    url: string,
    contact: string
  }>>([])
  const [packagingApprovalStatus, setPackagingApprovalStatus] = useState('pending')
  const [packagingApprovalDate, setPackagingApprovalDate] = useState('')
  const [newVendorName, setNewVendorName] = useState('')
  const [newVendorUrl, setNewVendorUrl] = useState('')
  const [newVendorContact, setNewVendorContact] = useState('')

  // Product Design Ideas Repository state
  const [designIdeas, setDesignIdeas] = useState<Array<{
    id: string,
    title: string,
    description: string,
    links: string[],
    files: File[],
    status: 'new' | 'under-review' | 'approved' | 'archived',
    tags: string[]
  }>>([])
  const [newIdeaTitle, setNewIdeaTitle] = useState('')
  const [newIdeaDescription, setNewIdeaDescription] = useState('')
  const [newIdeaLinks, setNewIdeaLinks] = useState<string[]>([])
  const [newIdeaFiles, setNewIdeaFiles] = useState<File[]>([])
  const [newIdeaTags, setNewIdeaTags] = useState<string[]>([])
  const [showAddIdeaForm, setShowAddIdeaForm] = useState(false)
  const [ideaLinkInput, setIdeaLinkInput] = useState('')
  const [ideaTagInput, setIdeaTagInput] = useState('')

  // Design tab toggles state
  const [showDesignBrief, setShowDesignBrief] = useState(false)
  const [showVisualIdentity, setShowVisualIdentity] = useState(false)
  const [showDesignAssets, setShowDesignAssets] = useState(false)
  const [showDesignProgress, setShowDesignProgress] = useState(false)
  const [showDesignFeedback, setShowDesignFeedback] = useState(false)
  const [showPackingDesign, setShowPackingDesign] = useState(false)
  const [showDesignIdeasRepository, setShowDesignIdeasRepository] = useState(false)

  // Production tab toggles state
  const [showSupplierPricing, setShowSupplierPricing] = useState(false)
  const [showProductLinks, setShowProductLinks] = useState(false)
  const [showSampleManagement, setShowSampleManagement] = useState(false)
  const [showProductionTimeline, setShowProductionTimeline] = useState(false)
  const [showMaterialsSpecs, setShowMaterialsSpecs] = useState(false)
  const [showManufacturingDetails, setShowManufacturingDetails] = useState(false)
  const [showCostTracking, setShowCostTracking] = useState(false)
  const [showQualityControl, setShowQualityControl] = useState(false)
  const [showLeadTimes, setShowLeadTimes] = useState(false)

  // Idea tab toggles state
  const [showBasics, setShowBasics] = useState(false)
  const [showMarketResearch, setShowMarketResearch] = useState(false)
  const [showReferencesMedia, setShowReferencesMedia] = useState(false)

  // Product images state
  const [productImages, setProductImages] = useState<ProductImage[]>([])

  // Scaling tab toggles state
  const [showLaunchDetails, setShowLaunchDetails] = useState(false)
  const [showBudgetAllocation, setShowBudgetAllocation] = useState(false)
  const [showPerformanceTargets, setShowPerformanceTargets] = useState(false)
  const [showLearningsInsights, setShowLearningsInsights] = useState(false)

  // Accordion state with persistence
  const [openAccordionItems, setOpenAccordionItems] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`production-accordion-${slug}`)
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  // Save accordion state to localStorage
  const handleAccordionChange = (value: string[]) => {
    setOpenAccordionItems(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`production-accordion-${slug}`, JSON.stringify(value))
    }
  }

  // Hooks
  const { users: availableUsers, loading: usersLoading } = useUsers()
  const { suppliers, loading: suppliersLoading } = useSuppliers()
  const { allCategories: databaseCategories, loading: categoriesLoading } = useCategories()
  const { data: vendors = [], isLoading: vendorsLoading } = useVendors()

  // Use database categories
  const availableCategories = databaseCategories.map(cat => cat.name).sort()

  // No automatic supplier initialization - users must manually select suppliers

  // Load tab-specific data from database
  const loadTabData = async (productId: string) => {
    console.log('🔍 Loading tab data for product ID:', productId)

    try {
      // First, verify the product exists in the database
      const { data: productExists, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('id', productId)
        .single()

      if (productError || !productExists) {
        console.error('❌ Product not found in database:', productError?.message)
        toast({
          title: 'Product not found',
          description: 'This product does not exist in the database. Please check the product ID.',
          variant: 'destructive'
        })
        return
      }

      console.log('✅ Product exists in database')

      // Load design data
      console.log('🔍 Loading design data...')
      const design = await productDesignService.getOrCreateProductDesign(productId)
      if (design) {
        setDesignData(design)
        // Update state with design data - Design Brief
        setProductVision(design.product_vision || '')
        setTargetAudience(design.target_audience || '')
        setDesignStyle(design.design_style || '')

        // Visual Identity
        setPrimaryColors(design.primary_colors || '')
        setSecondaryColors(design.secondary_colors || '')
        setMaterialPreferences(design.material_preferences || '')

        // Design Assets
        setMoodBoardUrl(design.mood_board_url || '')
        setDesignFilesUrl(design.design_files_url || '')
        setTechnicalDrawings(design.technical_drawings || '')
        setCadFiles(design.cad_files || '')

        // Design Progress
        setDesignStatus(design.design_status || '')
        setCurrentPhase(design.current_phase || '')
        setCompletionPercentage(design.completion_percentage || 0)
        setNextMilestone(design.next_milestone || '')

        // Design Feedback & Other
        setDesignFeedback(design.design_feedback || '')
        setPackagingConcept(design.packaging_concept || '')
        setPackagingApprovalStatus(design.packaging_approval_status || 'pending')
        setPackagingApprovalDate(design.packaging_approval_date || '')
        setDesignIdeas(design.design_ideas || [])
        console.log('✅ Design data loaded successfully:', {
          product_vision: design.product_vision ? 'has data' : 'empty',
          target_audience: design.target_audience ? 'has data' : 'empty',
          design_style: design.design_style ? 'has data' : 'empty',
          primary_colors: design.primary_colors ? 'has data' : 'empty',
          secondary_colors: design.secondary_colors ? 'has data' : 'empty',
          material_preferences: design.material_preferences ? 'has data' : 'empty',
          mood_board_url: design.mood_board_url ? 'has data' : 'empty',
          design_files_url: design.design_files_url ? 'has data' : 'empty',
          technical_drawings: design.technical_drawings ? 'has data' : 'empty',
          cad_files: design.cad_files ? 'has data' : 'empty',
          design_status: design.design_status ? 'has data' : 'empty',
          current_phase: design.current_phase ? 'has data' : 'empty',
          completion_percentage: design.completion_percentage || 0,
          next_milestone: design.next_milestone ? 'has data' : 'empty',
          design_feedback: design.design_feedback ? 'has data' : 'empty',
          packaging_concept: design.packaging_concept ? 'has data' : 'empty'
        })
        console.log('🔍 Raw design data from database:', design)
      } else {
        console.log('❌ Design data not loaded')
      }

      // Load production data
      console.log('🔍 Loading production data...')
      const production = await productProductionService.getOrCreateProductProduction(productId)
      if (production) {
        setProductionData(production)
        // Update state with production data - Production Details (main rich text)
        console.log('🔄 Loading production_details from database:', production.production_details)
        setProductionDetails(production.production_details || '')

        // Supplier & Pricing
        setSelectedSuppliers(production.selected_suppliers || [])
        setSupplierComparisonNotes(production.supplier_comparison_notes || '')
        setPreferredSupplierId(production.preferred_supplier_id || '')

        // Product Links
        setProductLinks(production.product_links || [])

        // Sample Management
        setSampleRequestDate(production.sample_request_date || '')
        setSampleReceivedDate(production.sample_received_date || '')
        setSampleStatus(production.sample_status || '')
        setSampleNotes(production.sample_notes || '')
        setSampleQualityRating(production.sample_quality_rating || 0)

        // Production Timeline
        setProductionStartDate(production.production_start_date || '')
        setProductionCompletionDate(production.production_completion_date || '')
        setProductionMilestones(production.production_milestones || '')
        setProductionStatus(production.production_status || '')

        // Materials & Specifications
        setDimensions(production.dimensions || '')
        setWeight(production.weight || '')
        setMaterialsSpecification(production.materials_specification || '')

        // Manufacturing details
        setManufacturingMethod(production.manufacturing_method || '')
        setQualityStandards(production.quality_standards || '')
        setComplianceRequirements(production.compliance_requirements || '')

        // Cost tracking
        setEstimatedUnitCost(production.estimated_unit_cost || 0)
        setActualUnitCost(production.actual_unit_cost || 0)
        setToolingCost(production.tooling_cost || 0)
        setSetupCost(production.setup_cost || 0)

        // Quality control
        setQcRequirements(production.qc_requirements || '')
        setQcStatus(production.qc_status || '')
        setQcNotes(production.qc_notes || '')

        // Lead times
        setLeadTimeDays(production.lead_time_days || 0)
        setMinimumOrderQuantity(production.minimum_order_quantity || 0)

        console.log('✅ Production data loaded successfully:', {
          supplier_comparison_notes: production.supplier_comparison_notes ? 'has data' : 'empty',
          sample_status: production.sample_status ? 'has data' : 'empty',
          production_status: production.production_status ? 'has data' : 'empty',
          materials_specification: production.materials_specification ? 'has data' : 'empty'
        })
        console.log('🔍 Raw production data from database:', production)
      } else {
        console.log('❌ Production data not loaded')
      }

      // Load scaling data
      console.log('🔍 Loading scaling data...')
      const scaling = await productScalingService.getOrCreateProductScaling(productId)
      if (scaling) {
        setScalingData(scaling)

        // Update state with scaling data - Launch Details
        setLaunchDate(scaling.launch_date || '')
        setMarketingChannels(scaling.launch_channels || [])
        setLaunchStatus(scaling.launch_status || '')
        setLaunchNotes(scaling.launch_notes || '')

        // Budget Allocation
        setFacebookBudget(scaling.facebook_budget || 0)
        setInstagramBudget(scaling.instagram_budget || 0)
        setGoogleBudget(scaling.google_budget || 0)
        setYoutubeBudget(scaling.youtube_budget || 0)
        setTotalBudget(scaling.total_budget || 0)
        setBudgetAllocationNotes(scaling.budget_allocation_notes || '')

        // Performance Targets
        setTargetRevenue(scaling.revenue_target || 0)
        setTargetRoas(scaling.roas_target || 0)
        setTargetConversions(scaling.conversions_target || 0)
        setTargetCpc(scaling.cpc_target || 0)
        setTargetCtr(scaling.ctr_target || 0)
        setPerformanceNotes(scaling.performance_notes || '')

        // Campaign Performance
        setCampaignDuration(scaling.campaign_duration || 0)
        setCampaignStatus(scaling.campaign_status || '')
        setActualSpend(scaling.actual_spend || 0)
        setImpressions(scaling.impressions || 0)
        setClicks(scaling.clicks || 0)
        setConversions(scaling.conversions || 0)
        setActualRoas(scaling.actual_roas || 0)
        setActualCpc(scaling.actual_cpc || 0)
        setActualCtr(scaling.actual_ctr || 0)

        // Market Analysis
        setMarketSizeEstimate(scaling.market_size_estimate || '')
        setMarketPenetration(scaling.market_penetration || '')
        setCompetitiveAdvantage(scaling.competitive_advantage || '')
        setMarketFeedback(scaling.market_feedback || '')

        // Growth Strategy
        setGrowthStrategy(scaling.growth_strategy || '')
        setExpansionPlans(scaling.expansion_plans || '')
        setOptimizationOpportunities(scaling.optimization_opportunities || '')
        setLearningsInsights(scaling.learnings_insights || '')

        console.log('✅ Scaling data loaded successfully:', {
          launch_status: scaling.launch_status ? 'has data' : 'empty',
          launch_channels: scaling.launch_channels ? `${scaling.launch_channels.length} channels` : 'empty',
          campaign_status: scaling.campaign_status ? 'has data' : 'empty',
          total_budget: scaling.total_budget || 0,
          facebook_budget: scaling.facebook_budget || 0,
          revenue_target: scaling.revenue_target || 0,
          roas_target: scaling.roas_target || 0,
          conversions_target: scaling.conversions_target || 0,
          market_size_estimate: scaling.market_size_estimate ? 'has data' : 'empty',
          growth_strategy: scaling.growth_strategy ? 'has data' : 'empty',
          learnings_insights: scaling.learnings_insights ? 'has data' : 'empty'
        })
        console.log('🔍 Raw scaling data from database:', scaling)
      } else {
        console.log('❌ Scaling data not loaded')
      }
    } catch (error) {
      console.error('❌ Error loading tab data:', error)
      if (error.message && error.message.includes('foreign key constraint')) {
        toast({
          title: 'Product data error',
          description: 'Unable to load product data. This product may not exist in the database.',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Database error',
          description: error.message || 'An unexpected error occurred while loading product data.',
          variant: 'destructive'
        })
      }
    }
  }

  // Save tab-specific data to database
  const saveTabData = async () => {
    if (!product?.id) return

    try {
      // Save design data
      const designRecord = await productDesignService.getOrCreateProductDesign(product.id)
      if (designRecord) {
        await productDesignService.updateProductDesignByProductId(product.id, {
          // Design Brief fields
          product_vision: productVision,
          target_audience: targetAudience,
          design_style: designStyle,
          // Visual Identity fields
          primary_colors: primaryColors,
          secondary_colors: secondaryColors,
          material_preferences: materialPreferences,
          // Design Assets fields
          mood_board_url: moodBoardUrl,
          design_files_url: designFilesUrl,
          technical_drawings: technicalDrawings,
          cad_files: cadFiles,
          // Design Progress fields
          design_status: designStatus,
          current_phase: currentPhase,
          completion_percentage: completionPercentage,
          next_milestone: nextMilestone,
          // Design Feedback & Other fields
          design_feedback: designFeedback,
          packaging_concept: packagingConcept,
          packaging_approval_status: packagingApprovalStatus,
          packaging_approval_date: packagingApprovalDate,
          design_ideas: designIdeas
        })
      }

      // Save production data
      const productionRecord = await productProductionService.getOrCreateProductProduction(product.id)
      if (productionRecord) {
        await productProductionService.updateProductProductionByProductId(product.id, {
          // Production Details (main rich text field)
          production_details: productionDetails,
          // Supplier & Pricing fields
          selected_suppliers: selectedSuppliers,
          supplier_comparison_notes: supplierComparisonNotes,
          preferred_supplier_id: preferredSupplierId || null,
          // Product Links
          product_links: productLinks,
          // Sample Management fields
          sample_request_date: sampleRequestDate || null,
          sample_received_date: sampleReceivedDate || null,
          sample_status: sampleStatus,
          sample_notes: sampleNotes,
          sample_quality_rating: sampleQualityRating || null,
          // Production Timeline fields
          production_start_date: productionStartDate || null,
          production_completion_date: productionCompletionDate || null,
          production_milestones: productionMilestones,
          production_status: productionStatus,
          // Materials & Specifications fields
          dimensions: dimensions,
          weight: weight,
          materials_specification: materialsSpecification,
          // Manufacturing details fields
          manufacturing_method: manufacturingMethod,
          quality_standards: qualityStandards,
          compliance_requirements: complianceRequirements,
          // Cost tracking fields
          estimated_unit_cost: estimatedUnitCost || null,
          actual_unit_cost: actualUnitCost || null,
          tooling_cost: toolingCost || null,
          setup_cost: setupCost || null,
          // Quality control fields
          qc_requirements: qcRequirements,
          qc_status: qcStatus,
          qc_notes: qcNotes,
          // Lead times fields
          lead_time_days: leadTimeDays || null,
          minimum_order_quantity: minimumOrderQuantity || null
        })
      }

      // Save scaling data
      if (scalingData) {
        await productScalingService.updateProductScalingByProductId(product.id, {
          learnings_insights: learningsInsights
        })
      }
    } catch (error) {
      console.error('Error saving tab data:', error)
    }
  }

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      if (!slug) {
        navigate('/products')
        return
      }

      try {
        setLoading(true)

        // Get all products and find by slug
        const products = await productLifecycleService.listProducts()
        const foundProduct = findProductBySlug(products, slug)

        if (!foundProduct) {
          toast({
            title: 'Product not found',
            description: 'The requested product could not be found.',
            variant: 'destructive'
          })
          navigate('/products')
          return
        }

        setProduct(foundProduct)

        // Initialize form data
        setEditForm({
          title: foundProduct.workingTitle || foundProduct.name || '',
          tags: foundProduct.tags.join(', '),
          category: foundProduct.category.join(', '),
          competitorLinks: foundProduct.ideaData?.competitorLinks?.join('\n') || '',
          adLinks: foundProduct.ideaData?.adLinks?.join('\n') || '',
          notes: foundProduct.ideaData?.notes || '',
          problemStatement: foundProduct.ideaData?.problemStatement || '',
          opportunityStatement: foundProduct.ideaData?.opportunityStatement || '',
          estimatedSourcePriceMin: foundProduct.ideaData?.estimatedSourcePriceMin?.toString() || '',
          estimatedSourcePriceMax: foundProduct.ideaData?.estimatedSourcePriceMax?.toString() || '',
          estimatedSellingPrice: foundProduct.ideaData?.estimatedSellingPrice?.toString() || '',
          selectedSupplierId: foundProduct.ideaData?.selectedSupplierId || '',
          priority: foundProduct.priority,
          stage: foundProduct.stage,
          assignedTo: foundProduct.teamLead.id
        })

        setSelectedCategories(foundProduct.category)
        setTags(foundProduct.tags)

        // Load existing reference links from database
        const existingReferenceLinks: Array<{url: string, type: 'competitor' | 'ad'}> = [
          ...(foundProduct.ideaData?.competitorLinks || []).map(url => ({ url, type: 'competitor' as const })),
          ...(foundProduct.ideaData?.adLinks || []).map(url => ({ url, type: 'ad' as const }))
        ]
        setReferenceLinks(existingReferenceLinks)

        // Initialize current product image and reset upload states
        setCurrentProductImage(foundProduct.thumbnail || foundProduct.thumbnailUrl || null)
        setRemoveCurrentImage(false)
        setUploadedImages([])
        setUploadedVideos([])
        setUploadedProductImage(null)
        setActiveTab('idea') // Always open the idea tab by default

        // Initialize packing data (reset for now, will be loaded from database when implemented)
        setPackingFiles([])
        setPackingInstructions('')

        // Load tab-specific data from database
        await loadTabData(foundProduct.id)

      } catch (error) {
        console.error('Failed to load product:', error)
        toast({
          title: 'Error loading product',
          description: 'Please try again.',
          variant: 'destructive'
        })
        navigate('/products')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [slug, navigate])

  // Auto-save design data when it changes
  useEffect(() => {
    if (product?.id) {
      const timer = setTimeout(async () => {
        try {
          console.log('💾 Auto-saving design data for product:', product.id)
          console.log('📝 Data being saved:', {
            product_vision: productVision,
            target_audience: targetAudience,
            design_style: designStyle,
            primary_colors: primaryColors,
            secondary_colors: secondaryColors,
            material_preferences: materialPreferences,
            design_status: designStatus
          })
          // Always try to get or create the design record first, then update
          const designRecord = await productDesignService.getOrCreateProductDesign(product.id)
          if (designRecord) {
            const updateData = {
              // Design Brief fields
              product_vision: productVision,
              target_audience: targetAudience,
              design_style: designStyle,
              // Visual Identity fields
              primary_colors: primaryColors,
              secondary_colors: secondaryColors,
              material_preferences: materialPreferences,
              // Design Assets fields
              mood_board_url: moodBoardUrl,
              design_files_url: designFilesUrl,
              technical_drawings: technicalDrawings,
              cad_files: cadFiles,
              // Design Progress fields
              design_status: designStatus,
              current_phase: currentPhase,
              completion_percentage: completionPercentage,
              next_milestone: nextMilestone,
              // Design Feedback & Other fields
              design_feedback: designFeedback,
              packaging_concept: packagingConcept,
              packaging_approval_status: packagingApprovalStatus,
              packaging_approval_date: packagingApprovalDate,
              design_ideas: designIdeas
            }
            await productDesignService.updateProductDesignByProductId(product.id, updateData)
            console.log('✅ Auto-saved design data successfully')
          } else {
            console.log('❌ Could not create design record for auto-save')
          }
        } catch (error) {
          console.error('❌ Error auto-saving design data:', error)
          if (error.message && error.message.includes('foreign key constraint')) {
            console.error('❌ Product does not exist in database, cannot auto-save')
          }
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [
    // Design Brief fields
    productVision, targetAudience, designStyle,
    // Visual Identity fields
    primaryColors, secondaryColors, materialPreferences,
    // Design Assets fields
    moodBoardUrl, designFilesUrl, technicalDrawings, cadFiles,
    // Design Progress fields
    designStatus, currentPhase, completionPercentage, nextMilestone,
    // Design Feedback & Other fields
    designFeedback, packagingConcept, packagingApprovalStatus, packagingApprovalDate, designIdeas,
    product?.id
  ])

  // Auto-save production data when it changes
  useEffect(() => {
    if (product?.id) {
      const timer = setTimeout(async () => {
        try {
          console.log('💾 Auto-saving production data for product:', product.id)
          console.log('📝 Production data being saved:', {
            production_details: productionDetails,
            supplier_comparison_notes: supplierComparisonNotes,
            sample_status: sampleStatus,
            production_status: productionStatus,
            materials_specification: materialsSpecification
          })
          // Always try to get or create the production record first, then update
          const productionRecord = await productProductionService.getOrCreateProductProduction(product.id)
          if (productionRecord) {
            const updateData = {
              // Production Details (main rich text field)
              production_details: productionDetails,
              // Supplier & Pricing fields
              selected_suppliers: selectedSuppliers,
              supplier_comparison_notes: supplierComparisonNotes,
              preferred_supplier_id: preferredSupplierId || null,
              // Product Links
              product_links: productLinks,
              // Sample Management fields
              sample_request_date: sampleRequestDate || null,
              sample_received_date: sampleReceivedDate || null,
              sample_status: sampleStatus,
              sample_notes: sampleNotes,
              sample_quality_rating: sampleQualityRating || null,
              // Production Timeline fields
              production_start_date: productionStartDate || null,
              production_completion_date: productionCompletionDate || null,
              production_milestones: productionMilestones,
              production_status: productionStatus,
              // Materials & Specifications fields
              dimensions: dimensions,
              weight: weight,
              materials_specification: materialsSpecification,
              // Manufacturing details fields
              manufacturing_method: manufacturingMethod,
              quality_standards: qualityStandards,
              compliance_requirements: complianceRequirements,
              // Cost tracking fields
              estimated_unit_cost: estimatedUnitCost || null,
              actual_unit_cost: actualUnitCost || null,
              tooling_cost: toolingCost || null,
              setup_cost: setupCost || null,
              // Quality control fields
              qc_requirements: qcRequirements,
              qc_status: qcStatus,
              qc_notes: qcNotes,
              // Lead times fields
              lead_time_days: leadTimeDays || null,
              minimum_order_quantity: minimumOrderQuantity || null
            }
            const result = await productProductionService.updateProductProductionByProductId(product.id, updateData)
            console.log('✅ Auto-saved production data successfully')
            console.log('💾 Saved production_details:', result?.production_details)
          }
        } catch (error) {
          console.error('Error auto-saving production data:', error)
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [
    // Production Details (main rich text field)
    productionDetails,
    // Supplier & Pricing fields
    selectedSuppliers, supplierComparisonNotes, preferredSupplierId,
    // Product Links
    productLinks,
    // Sample Management fields
    sampleRequestDate, sampleReceivedDate, sampleStatus, sampleNotes, sampleQualityRating,
    // Production Timeline fields
    productionStartDate, productionCompletionDate, productionMilestones, productionStatus,
    // Materials & Specifications fields
    dimensions, weight, materialsSpecification,
    // Manufacturing details fields
    manufacturingMethod, qualityStandards, complianceRequirements,
    // Cost tracking fields
    estimatedUnitCost, actualUnitCost, toolingCost, setupCost,
    // Quality control fields
    qcRequirements, qcStatus, qcNotes,
    // Lead times fields
    leadTimeDays, minimumOrderQuantity,
    product?.id
  ])

  // Auto-save scaling data when it changes
  useEffect(() => {
    if (product?.id) {
      const timer = setTimeout(async () => {
        try {
          console.log('💾 Auto-saving scaling data for product:', product.id)
          console.log('📝 Scaling data being saved:', {
            launch_date: launchDate,
            launch_status: launchStatus,
            launch_channels: marketingChannels,
            campaign_status: campaignStatus,
            total_budget: totalBudget,
            facebook_budget: facebookBudget,
            instagram_budget: instagramBudget,
            google_budget: googleBudget,
            youtube_budget: youtubeBudget,
            revenue_target: targetRevenue,
            roas_target: targetRoas,
            conversions_target: targetConversions,
            market_size_estimate: marketSizeEstimate,
            growth_strategy: growthStrategy,
            learnings_insights: learningsInsights
          })
          // Always try to get or create the scaling record first, then update
          const scalingRecord = await productScalingService.getOrCreateProductScaling(product.id)
          if (scalingRecord) {
            const updateData = {
              // Launch Details fields
              launch_date: launchDate,
              launch_channels: marketingChannels,
              launch_status: launchStatus,
              launch_notes: launchNotes,
              // Budget Allocation fields
              facebook_budget: facebookBudget,
              instagram_budget: instagramBudget,
              google_budget: googleBudget,
              youtube_budget: youtubeBudget,
              total_budget: totalBudget,
              budget_allocation_notes: budgetAllocationNotes,
              // Performance Targets fields
              revenue_target: targetRevenue,
              roas_target: targetRoas,
              conversions_target: targetConversions,
              cpc_target: targetCpc,
              ctr_target: targetCtr,
              performance_notes: performanceNotes,
              // Campaign Performance fields
              campaign_duration: campaignDuration,
              campaign_status: campaignStatus,
              actual_spend: actualSpend,
              impressions: impressions,
              clicks: clicks,
              conversions: conversions,
              actual_roas: actualRoas,
              actual_cpc: actualCpc,
              actual_ctr: actualCtr,
              // Market Analysis fields
              market_size_estimate: marketSizeEstimate,
              market_penetration: marketPenetration,
              competitive_advantage: competitiveAdvantage,
              market_feedback: marketFeedback,
              // Growth Strategy fields
              growth_strategy: growthStrategy,
              expansion_plans: expansionPlans,
              optimization_opportunities: optimizationOpportunities,
              learnings_insights: learningsInsights
            }
            await productScalingService.updateProductScalingByProductId(product.id, updateData)
            console.log('✅ Auto-saved scaling data successfully')
          }
        } catch (error) {
          console.error('❌ Error auto-saving scaling data:', error)
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [
    // Launch Details fields
    launchDate, marketingChannels, launchStatus, launchNotes,
    // Budget Allocation fields
    facebookBudget, instagramBudget, googleBudget, youtubeBudget, totalBudget, budgetAllocationNotes,
    // Performance Targets fields
    targetRevenue, targetRoas, targetConversions, targetCpc, targetCtr, performanceNotes,
    // Campaign Performance fields
    campaignDuration, campaignStatus, actualSpend, impressions, clicks, conversions, actualRoas, actualCpc, actualCtr,
    // Market Analysis fields
    marketSizeEstimate, marketPenetration, competitiveAdvantage, marketFeedback,
    // Growth Strategy fields
    growthStrategy, expansionPlans, optimizationOpportunities, learningsInsights,
    product?.id
  ])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-6 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded-none w-64 mb-6" />
            <div className="h-12 bg-muted rounded-none mb-6" />
            <div className="h-96 bg-muted rounded-none" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-6 py-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Product not found</p>
            <Button onClick={() => navigate('/products')} className="mt-4">
              Back to Products
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const stageConfig = STAGE_CONFIG[product.stage]
  const StageIcon = stageConfig?.icon || Package

  // Helper function to extract text from RichEditor HTML content
  const getTextFromHTML = (htmlContent: any) => {
    if (typeof htmlContent === 'string') return htmlContent.trim();
    if (typeof htmlContent === 'object' && htmlContent) {
      // For HTML content object, extract text content
      const div = document.createElement('div');
      div.innerHTML = typeof htmlContent === 'string' ? htmlContent : JSON.stringify(htmlContent);
      return div.textContent || div.innerText || '';
    }
    return '';
  };

  const handleUpdateProduct = async () => {
    try {
      setIsUpdating(true)

      // Validate required fields
      if (!editForm.title.trim()) {
        toast({
          title: 'Product Name required',
          description: 'Please enter a product name.',
          variant: 'destructive'
        })
        return
      }

      if (!editForm.assignedTo) {
        toast({
          title: 'Assigned To required',
          description: 'Please select a team member to assign this product to.',
          variant: 'destructive'
        })
        return
      }

      // Prepare update payload with all fields
      const updatePayload: Partial<CreateProductPayload> = {
        title: editForm.title.trim(),
        tags: tags.length > 0 ? tags : [],
        category: selectedCategories.length > 0 ? selectedCategories : [],
        competitorLinks: referenceLinks.filter(link => link.type === 'competitor').map(link => link.url),
        adLinks: referenceLinks.filter(link => link.type === 'ad').map(link => link.url),
        notes: editForm.notes || undefined,
        problemStatement: editForm.problemStatement || undefined,
        opportunityStatement: editForm.opportunityStatement || undefined,
        estimatedSourcePriceMin: editForm.estimatedSourcePriceMin.trim() || undefined,
        estimatedSourcePriceMax: editForm.estimatedSourcePriceMax.trim() || undefined,
        estimatedSellingPrice: editForm.estimatedSellingPrice.trim() || undefined,
        selectedSupplierId: selectedSuppliers.length > 0 ? selectedSuppliers[0].id : undefined,
        priority: editForm.priority as 'low' | 'medium' | 'high',
        stage: editForm.stage as 'idea' | 'design' | 'production' | 'content' | 'scaling' | 'inventory',
        assignedTo: editForm.assignedTo,
        // Add uploaded files to the payload
        uploadedImages: uploadedImages,
        uploadedVideos: uploadedVideos,
        // Handle product image: new upload, removal, or keep current
        thumbnail: uploadedProductImage
          ? uploadedProductImage // New image uploaded
          : removeCurrentImage
            ? null // Remove current image
            : undefined // Keep current image unchanged
      }

      console.log('Updating product with payload:', updatePayload)

      const updatedProduct = await productLifecycleService.updateProduct(product.id, updatePayload)

      setProduct(updatedProduct)

      // Save tab-specific data
      await saveTabData()

      toast({
        title: 'Product updated successfully!',
        description: `"${updatedProduct.workingTitle}" has been updated.`
      })

      // If title changed, redirect to new URL
      const newSlug = generateSlug(updatedProduct.workingTitle || updatedProduct.name || `product-${updatedProduct.internalCode}`)
      if (newSlug !== slug) {
        navigate(`/products/${newSlug}`, { replace: true })
      }

    } catch (error) {
      console.error('Failed to update product:', error)
      toast({
        title: 'Failed to update product',
        description: 'Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteProduct = async () => {
    if (!product) return

    try {
      setIsDeleting(true)

      await productLifecycleService.deleteProduct(product.id)

      setShowDeleteDialog(false)

      toast({
        title: 'Product deleted successfully!',
        description: `"${product.workingTitle}" has been permanently deleted.`
      })

      // Navigate back to products list
      navigate('/products')

    } catch (error) {
      console.error('Failed to delete product:', error)
      toast({
        title: 'Failed to delete product',
        description: 'Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Form helper functions
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const totalImages = uploadedImages.length + files.length

    if (totalImages > 10) {
      toast({
        title: 'Too many images',
        description: 'You can upload up to 10 images maximum.',
        variant: 'destructive'
      })
      return
    }

    setUploadedImages(prev => [...prev, ...files])
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const totalVideos = uploadedVideos.length + files.length

    if (totalVideos > 5) {
      toast({
        title: 'Too many videos',
        description: 'You can upload up to 5 videos maximum.',
        variant: 'destructive'
      })
      return
    }

    setUploadedVideos(prev => [...prev, ...files])
  }

  const handleProductImageUpload = (file: File) => {
    setUploadedProductImage(file)
    setRemoveCurrentImage(false) // If uploading new image, don't remove current
  }

  const removeProductImage = () => {
    setUploadedProductImage(null)
  }

  const handleRemoveCurrentImage = () => {
    setRemoveCurrentImage(true)
    setUploadedProductImage(null) // Also clear any new upload
  }

  // Handle product images change from carousel
  const handleProductImagesChange = (images: ProductImage[]) => {
    setProductImages(images)
    // Update the main product thumbnail if a primary image is set
    const primaryImage = images.find(img => img.is_primary)
    if (primaryImage) {
      setCurrentProductImage(primaryImage.image_url)
    } else if (images.length === 0) {
      setCurrentProductImage(null)
    }
  }

  const handleChangeCurrentImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleProductImageUpload(file)
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeVideo = (index: number) => {
    setUploadedVideos(prev => prev.filter((_, i) => i !== index))
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    const videoFiles = files.filter(file => file.type.startsWith('video/'))

    if (uploadedImages.length + imageFiles.length > 10) {
      toast({
        title: 'Too many images',
        description: 'You can upload up to 10 images maximum.',
        variant: 'destructive'
      })
      return
    }

    if (uploadedVideos.length + videoFiles.length > 5) {
      toast({
        title: 'Too many videos',
        description: 'You can upload up to 5 videos maximum.',
        variant: 'destructive'
      })
      return
    }

    if (imageFiles.length > 0) {
      setUploadedImages(prev => [...prev, ...imageFiles])
    }
    if (videoFiles.length > 0) {
      setUploadedVideos(prev => [...prev, ...videoFiles])
    }
  }

  const extractDomainFromUrl = (url: string): string => {
    try {
      const domain = new URL(url).hostname
      return domain.replace('www.', '')
    } catch {
      return url
    }
  }

  const autoResizeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.max(textarea.scrollHeight, 72) + 'px'
  }

  // Multiple suppliers helper functions
  const addSupplier = async (supplierId: string) => {
    const supplier = vendors.find(v => v.id === supplierId)
    if (supplier && !selectedSuppliers.some(s => s.id === supplierId) && product?.id) {
      const newSupplier = {
        id: supplier.id,
        name: supplier.name,
        pricing: '',
        quality: 'good',
        contact: '',
        url: ''
      }

      try {
        await productProductionService.addSupplier(product.id, newSupplier)
        setSelectedSuppliers(prev => [...prev, {
          id: supplier.id,
          name: supplier.name,
          sourcePrice: '',
          sellingPrice: '',
          quality: 'good',
          notes: ''
        }])
      } catch (error) {
        console.error('Error adding supplier:', error)
      }
    }
    setSupplierDropdownOpen(false)
  }

  const removeSupplier = (supplierId: string) => {
    setSelectedSuppliers(prev => prev.filter(s => s.id !== supplierId))
  }

  const updateSupplierField = (supplierId: string, field: string, value: string) => {
    setSelectedSuppliers(prev => prev.map(supplier =>
      supplier.id === supplierId
        ? { ...supplier, [field]: value }
        : supplier
    ))
  }

  // Multiple links helper functions
  const addProductLink = async () => {
    if (newLinkUrl.trim() && newLinkTitle.trim() && product?.id) {
      const newLink = {
        id: Date.now().toString(),
        url: newLinkUrl.trim(),
        title: newLinkTitle.trim(),
        type: newLinkType
      }

      try {
        await productProductionService.addProductLink(product.id, newLink)
        setProductLinks(prev => [...prev, newLink])
        setNewLinkUrl('')
        setNewLinkTitle('')
        setNewLinkType('reference')
      } catch (error) {
        console.error('Error adding product link:', error)
      }
    }
  }

  const removeProductLink = (linkId: string) => {
    setProductLinks(prev => prev.filter(link => link.id !== linkId))
  }

  const updateProductLink = (linkId: string, field: string, value: string) => {
    setProductLinks(prev => prev.map(link =>
      link.id === linkId
        ? { ...link, [field]: value }
        : link
    ))
  }

  // Packing files helper functions
  const handlePackingFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isValidImage = file.type.startsWith('image/')
      const isValidPDF = file.type === 'application/pdf'
      const isValidVideo = file.type.startsWith('video/') && file.type === 'video/mp4'
      return isValidImage || isValidPDF || isValidVideo
    })

    const totalFiles = packingFiles.length + validFiles.length
    if (totalFiles > 20) {
      toast({
        title: 'Too many files',
        description: 'You can upload up to 20 packing files maximum.',
        variant: 'destructive'
      })
      return
    }

    setPackingFiles(prev => [...prev, ...validFiles])
  }

  const removePackingFile = (index: number) => {
    setPackingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileTypeIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️'
    if (file.type === 'application/pdf') return '📄'
    if (file.type.startsWith('video/')) return '🎥'
    return '📁'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Packing Design helper functions
  const handlePackagingFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isValidPDF = file.type === 'application/pdf'
      const isValidImage = file.type.startsWith('image/')
      const isValidVideo = file.type.startsWith('video/')
      return isValidPDF || isValidImage || isValidVideo
    })

    const totalFiles = packagingFiles.length + validFiles.length
    if (totalFiles > 15) {
      toast({
        title: 'Too many files',
        description: 'You can upload up to 15 packaging files maximum.',
        variant: 'destructive'
      })
      return
    }

    setPackagingFiles(prev => [...prev, ...validFiles])
  }

  const removePackagingFile = (index: number) => {
    setPackagingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const addPrintVendor = () => {
    if (newVendorName.trim() && newVendorUrl.trim()) {
      const newVendor = {
        id: Date.now().toString(),
        name: newVendorName.trim(),
        url: newVendorUrl.trim(),
        contact: newVendorContact.trim()
      }
      setPrintVendorLinks(prev => [...prev, newVendor])
      setNewVendorName('')
      setNewVendorUrl('')
      setNewVendorContact('')
    }
  }

  const removePrintVendor = (vendorId: string) => {
    setPrintVendorLinks(prev => prev.filter(vendor => vendor.id !== vendorId))
  }

  // Design Ideas helper functions
  const addIdeaLink = () => {
    if (ideaLinkInput.trim() && !newIdeaLinks.includes(ideaLinkInput.trim())) {
      setNewIdeaLinks(prev => [...prev, ideaLinkInput.trim()])
      setIdeaLinkInput('')
    }
  }

  const removeIdeaLink = (index: number) => {
    setNewIdeaLinks(prev => prev.filter((_, i) => i !== index))
  }

  const addIdeaTag = () => {
    if (ideaTagInput.trim() && !newIdeaTags.includes(ideaTagInput.trim())) {
      setNewIdeaTags(prev => [...prev, ideaTagInput.trim()])
      setIdeaTagInput('')
    }
  }

  const removeIdeaTag = (index: number) => {
    setNewIdeaTags(prev => prev.filter((_, i) => i !== index))
  }

  const handleIdeaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const totalFiles = newIdeaFiles.length + files.length
    if (totalFiles > 10) {
      toast({
        title: 'Too many files',
        description: 'You can upload up to 10 files per idea.',
        variant: 'destructive'
      })
      return
    }
    setNewIdeaFiles(prev => [...prev, ...files])
  }

  const removeIdeaFile = (index: number) => {
    setNewIdeaFiles(prev => prev.filter((_, i) => i !== index))
  }

  const saveDesignIdea = async () => {
    if (newIdeaTitle.trim() && product?.id) {
      const newIdea = {
        id: Date.now().toString(),
        title: newIdeaTitle.trim(),
        description: newIdeaDescription.trim(),
        links: [...newIdeaLinks],
        files: [...newIdeaFiles],
        status: 'new' as const,
        tags: [...newIdeaTags]
      }

      try {
        await productDesignService.addDesignIdea(product.id, newIdea)
        setDesignIdeas(prev => [...prev, newIdea])

        // Reset form
        setNewIdeaTitle('')
        setNewIdeaDescription('')
        setNewIdeaLinks([])
        setNewIdeaFiles([])
        setNewIdeaTags([])
        setShowAddIdeaForm(false)
      } catch (error) {
        console.error('Error saving design idea:', error)
      }
    }
  }

  const updateIdeaStatus = (ideaId: string, status: 'new' | 'under-review' | 'approved' | 'archived') => {
    setDesignIdeas(prev => prev.map(idea =>
      idea.id === ideaId ? { ...idea, status } : idea
    ))
  }

  const removeDesignIdea = (ideaId: string) => {
    setDesignIdeas(prev => prev.filter(idea => idea.id !== ideaId))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Plus className="h-3 w-3" />
      case 'under-review': return <Eye className="h-3 w-3" />
      case 'approved': return <CheckCircle className="h-3 w-3" />
      case 'archived': return <Archive className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'under-review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  // Section summary helpers
  const getSectionSummaries = () => {
    return {
      suppliers: selectedSuppliers.length > 0
        ? `${selectedSuppliers.length} supplier${selectedSuppliers.length > 1 ? 's' : ''}`
        : 'No suppliers selected',

      links: productLinks.length > 0
        ? `${productLinks.length} link${productLinks.length > 1 ? 's' : ''}`
        : 'No links added',

      samples: 'Status pending',
      timeline: 'Not scheduled',
      materials: 'Not specified',

      packing: packingFiles.length > 0 || packingInstructions.trim()
        ? `${packingFiles.length} files${packingInstructions.trim() ? ', instructions added' : ''}`
        : 'No assets or instructions'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-6 py-6">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 mb-6">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/products')}
                  className="gap-1.5 rounded-none text-muted-foreground hover:text-foreground h-8 px-2"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="text-xs">Back</span>
                </Button>

                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-none ${stageConfig?.bgColor}`}>
                    <Edit3 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                      {product.workingTitle || product.name || 'Untitled Product'}
                    </h1>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium bg-muted/40 px-1.5 py-0.5 rounded-none">
                        {product.internalCode}
                      </span>
                      <span>•</span>
                      <span>{stageConfig?.name} Stage</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 rounded-none text-muted-foreground hover:text-destructive h-8 px-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="text-xs">Delete</span>
                </Button>
                <Button
                  onClick={handleUpdateProduct}
                  disabled={isUpdating}
                  size="sm"
                  className="gap-1.5 rounded-none h-8 px-3 text-xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  {isUpdating ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab Navigation */}
            <div className="mb-6">
              <TabsList className="grid w-full max-w-2xl grid-cols-5 bg-muted rounded-none">
                <TabsTrigger value="idea" className="flex items-center gap-2 rounded-none data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Lightbulb className="h-4 w-4" />
                  Idea
                </TabsTrigger>
                <TabsTrigger value="design" className="flex items-center gap-2 rounded-none data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Palette className="h-4 w-4" />
                  Design
                </TabsTrigger>
                <TabsTrigger value="production" className="flex items-center gap-2 rounded-none data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Factory className="h-4 w-4" />
                  Production
                </TabsTrigger>
                <TabsTrigger value="content" className="flex items-center gap-2 rounded-none data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Camera className="h-4 w-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="scaling" className="flex items-center gap-2 rounded-none data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <TrendingUp className="h-4 w-4" />
                  Scaling
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            {/* Idea Tab */}
            <TabsContent value="idea" className="mt-0">
              <div className="bg-card rounded-none border shadow-sm p-6">
                  <FormContent
                  newIdeaForm={editForm}
                  setNewIdeaForm={setEditForm}
                  selectedCategories={selectedCategories}
                  setSelectedCategories={setSelectedCategories}
                  availableCategories={availableCategories}
                  categoriesLoading={categoriesLoading}
                  tagInput={tagInput}
                  setTagInput={setTagInput}
                  tags={tags}
                  setTags={setTags}
                  referenceLinks={referenceLinks}
                  setReferenceLinks={setReferenceLinks}
                  uploadedImages={uploadedImages}
                  uploadedVideos={uploadedVideos}
                  handleImageUpload={handleImageUpload}
                  handleVideoUpload={handleVideoUpload}
                  removeImage={removeImage}
                  removeVideo={removeVideo}
                  handleDrop={handleDrop}
                  handleDragOver={handleDragOver}
                  handleDragEnter={handleDragEnter}
                  handleDragLeave={handleDragLeave}
                  dragActive={dragActive}
                  extractDomainFromUrl={extractDomainFromUrl}
                  autoResizeTextarea={autoResizeTextarea}
                  vendors={vendors}
                  vendorsLoading={vendorsLoading}
                  availableOwners={availableUsers}
                  // Product image props
                  currentProductImage={currentProductImage}
                  uploadedProductImage={uploadedProductImage}
                  onChangeProductImage={handleChangeCurrentImage}
                  onRemoveCurrentImage={handleRemoveCurrentImage}
                  onRemoveUploadedImage={removeProductImage}
                  // Toggle states for collapsible sections
                  showBasics={showBasics}
                  setShowBasics={setShowBasics}
                  showMarketResearch={showMarketResearch}
                  setShowMarketResearch={setShowMarketResearch}
                  showReferencesMedia={showReferencesMedia}
                  setShowReferencesMedia={setShowReferencesMedia}
                  productId={product?.id}
                  onProductImagesChange={handleProductImagesChange}
                  />
              </div>
            </TabsContent>

            {/* Design Tab */}
            <TabsContent value="design" className="mt-0">
              <div className="bg-card rounded-none border shadow-sm p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4">
                    <div className="p-2 rounded-none bg-pink-50 dark:bg-pink-950">
                      <Palette className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Design Details</h3>
                      <p className="text-sm text-muted-foreground">All design information, files, and progress tracking</p>
                    </div>
                  </div>

                  {/* Design Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Design Status</Label>
                      <Select value={designStatus} onValueChange={setDesignStatus}>
                        <SelectTrigger className="rounded-none">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="concept">Concept Phase</SelectItem>
                          <SelectItem value="sketching">Sketching</SelectItem>
                          <SelectItem value="prototyping">Prototyping</SelectItem>
                          <SelectItem value="refinement">Refinement</SelectItem>
                          <SelectItem value="finalized">Finalized</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Design Style</Label>
                      <Select value={designStyle} onValueChange={setDesignStyle}>
                        <SelectTrigger className="rounded-none">
                          <SelectValue placeholder="Select design style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="vintage">Vintage</SelectItem>
                          <SelectItem value="industrial">Industrial</SelectItem>
                          <SelectItem value="luxury">Luxury</SelectItem>
                          <SelectItem value="playful">Playful</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Main Design Details */}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">Design Details</Label>
                    <RichEditor
                      value={productVision}
                      onChange={setProductVision}
                      placeholder="Document all design details including vision, target audience, colors, materials, assets (mood boards, CAD files, technical drawings), feedback, revisions, and any other design-related information..."
                      className="min-h-[300px]"
                      hideToolbar={false}
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">Design Files</Label>
                    <div className="border-2 border-dashed border-border rounded-none p-4">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Upload design files, mock-ups, CAD files, technical drawings</p>
                        <input
                          id="packaging-files"
                          type="file"
                          multiple
                          accept=".pdf,image/*,video/*"
                          onChange={handlePackagingFileUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('packaging-files')?.click()}
                        >
                          Choose Files
                        </Button>
                      </div>
                    </div>

                    {/* Files Preview */}
                    {packagingFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Uploaded Files ({packagingFiles.length}/15)
                        </p>
                        <div className="space-y-1">
                          {packagingFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded-none">
                              <div className="flex items-center gap-2">
                                <span>{getFileTypeIcon(file)}</span>
                                <span className="text-xs font-medium truncate max-w-[200px]">{file.name}</span>
                                <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:text-destructive"
                                onClick={() => removePackagingFile(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Production Tab */}
            <TabsContent value="production" className="mt-0">
              <div className="bg-card rounded-none border shadow-sm p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4">
                    <div className="p-2 rounded-none bg-orange-50 dark:bg-orange-950">
                      <Factory className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Production Details</h3>
                      <p className="text-sm text-muted-foreground">All production information, suppliers, and timeline</p>
                    </div>
                  </div>

                  {/* Production Status & Sample Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Production Status</Label>
                      <Select value={productionStatus} onValueChange={setProductionStatus}>
                        <SelectTrigger className="rounded-none">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="in_production">In Production</SelectItem>
                          <SelectItem value="quality_check">Quality Check</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Sample Status</Label>
                      <Select value={sampleStatus} onValueChange={setSampleStatus}>
                        <SelectTrigger className="rounded-none">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_requested">Not Requested</SelectItem>
                          <SelectItem value="requested">Requested</SelectItem>
                          <SelectItem value="received">Received</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Main Production Details */}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">Production Details</Label>
                    <RichEditor
                      value={productionDetails}
                      onChange={setProductionDetails}
                      placeholder="Document all production details including suppliers, pricing, quality ratings, sample information, manufacturing process, timeline, milestones, and any other production-related information..."
                      className="min-h-[300px]"
                      hideToolbar={false}
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">Production Files</Label>
                    <div className="border-2 border-dashed border-border rounded-none p-4">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Upload sample photos, quality reports, production specs</p>
                        <input
                          id="production-files"
                          type="file"
                          multiple
                          accept=".pdf,image/*,video/*"
                          onChange={handlePackagingFileUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('production-files')?.click()}
                        >
                          Choose Files
                        </Button>
                      </div>
                    </div>

                    {/* Files Preview */}
                    {packagingFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Uploaded Files ({packagingFiles.length}/15)
                        </p>
                        <div className="space-y-1">
                          {packagingFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded-none">
                              <div className="flex items-center gap-2">
                                <span>{getFileTypeIcon(file)}</span>
                                <span className="text-xs font-medium truncate max-w-[200px]">{file.name}</span>
                                <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:text-destructive"
                                onClick={() => removePackagingFile(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="mt-0">
              <div className="bg-card rounded-none border shadow-sm p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4">
                    <div className="p-2 rounded-none bg-blue-50 dark:bg-blue-950">
                      <Camera className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Content Details</h3>
                      <p className="text-sm text-muted-foreground">All content information, scripts, and assets</p>
                    </div>
                  </div>

                  {/* Main Content Details */}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">Content Details</Label>
                    <RichEditor
                      value={heroVideoScript}
                      onChange={setHeroVideoScript}
                      placeholder="Document all content details including scripts (hero video, lifestyle, unboxing, 15s, 30s), creative briefs, moodboards, team assignments, photographer/videographer info, and any other content-related information..."
                      className="min-h-[300px]"
                      hideToolbar={false}
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-2 block">Content Files</Label>
                    <div className="border-2 border-dashed border-border rounded-none p-4">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Upload videos, photos, scripts, creative briefs</p>
                        <input
                          id="content-files"
                          type="file"
                          multiple
                          accept=".pdf,image/*,video/*"
                          onChange={handlePackagingFileUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('content-files')?.click()}
                        >
                          Choose Files
                        </Button>
                      </div>
                    </div>

                    {/* Files Preview */}
                    {packagingFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Uploaded Files ({packagingFiles.length}/15)
                        </p>
                        <div className="space-y-1">
                          {packagingFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded-none">
                              <div className="flex items-center gap-2">
                                <span>{getFileTypeIcon(file)}</span>
                                <span className="text-xs font-medium truncate max-w-[200px]">{file.name}</span>
                                <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:text-destructive"
                                onClick={() => removePackagingFile(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Scaling Tab */}
            <TabsContent value="scaling" className="mt-0">
              <div className="bg-card rounded-none border shadow-sm p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4">
                    <div className="p-2 rounded-none bg-green-50 dark:bg-green-950">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Scaling & Marketing</h3>
                      <p className="text-sm text-muted-foreground">Manage launch, budget allocation, and performance metrics</p>
                    </div>
                  </div>

                  {/* Launch Details - Collapsible */}
                  <div className="border rounded-none bg-background overflow-hidden">
                    <div
                      className={`flex items-center justify-between cursor-pointer p-3 bg-muted/10 hover:bg-muted/20 transition-colors ${
                        showLaunchDetails ? 'border-b border-border' : ''
                      }`}
                      onClick={() => setShowLaunchDetails(!showLaunchDetails)}
                    >
                      <Label className="text-sm font-medium text-foreground cursor-pointer">Launch Details</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {showLaunchDetails ? 'Hide details' : 'Date, channels'}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            showLaunchDetails ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {showLaunchDetails && (
                      <div className="space-y-4 p-4 bg-muted/5">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Launch Date</Label>
                      <Input
                        type="date"
                        value={launchDate}
                        onChange={(e) => setLaunchDate(e.target.value)}
                        className="rounded-none"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Marketing Channels</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded-none"
                            checked={marketingChannels.includes('Facebook')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMarketingChannels([...marketingChannels, 'Facebook'])
                              } else {
                                setMarketingChannels(marketingChannels.filter(ch => ch !== 'Facebook'))
                              }
                            }}
                          />
                          <span className="text-sm">Facebook</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded-none"
                            checked={marketingChannels.includes('Instagram')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMarketingChannels([...marketingChannels, 'Instagram'])
                              } else {
                                setMarketingChannels(marketingChannels.filter(ch => ch !== 'Instagram'))
                              }
                            }}
                          />
                          <span className="text-sm">Instagram</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded-none"
                            checked={marketingChannels.includes('Google Ads')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMarketingChannels([...marketingChannels, 'Google Ads'])
                              } else {
                                setMarketingChannels(marketingChannels.filter(ch => ch !== 'Google Ads'))
                              }
                            }}
                          />
                          <span className="text-sm">Google Ads</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded-none"
                            checked={marketingChannels.includes('YouTube')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMarketingChannels([...marketingChannels, 'YouTube'])
                              } else {
                                setMarketingChannels(marketingChannels.filter(ch => ch !== 'YouTube'))
                              }
                            }}
                          />
                          <span className="text-sm">YouTube</span>
                        </label>
                      </div>
                    </div>
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />

                  {/* Budget Allocation - Collapsible */}
                  <div className="border rounded-none bg-background overflow-hidden">
                    <div
                      className={`flex items-center justify-between cursor-pointer p-3 bg-muted/10 hover:bg-muted/20 transition-colors ${
                        showBudgetAllocation ? 'border-b border-border' : ''
                      }`}
                      onClick={() => setShowBudgetAllocation(!showBudgetAllocation)}
                    >
                      <Label className="text-sm font-medium text-foreground cursor-pointer">Budget Allocation</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {showBudgetAllocation ? 'Hide details' : 'Total, platform budgets'}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            showBudgetAllocation ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {showBudgetAllocation && (
                      <div className="space-y-4 p-4 bg-muted/5">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Total Budget</Label>
                      <Input
                        type="number"
                        value={totalBudget}
                        onChange={(e) => setTotalBudget(Number(e.target.value))}
                        placeholder="0.00"
                        className="rounded-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Facebook Budget</Label>
                        <Input
                          type="number"
                          value={facebookBudget}
                          onChange={(e) => setFacebookBudget(Number(e.target.value))}
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Instagram Budget</Label>
                        <Input
                          type="number"
                          value={instagramBudget}
                          onChange={(e) => setInstagramBudget(Number(e.target.value))}
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Google Budget</Label>
                        <Input
                          type="number"
                          value={googleBudget}
                          onChange={(e) => setGoogleBudget(Number(e.target.value))}
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">YouTube Budget</Label>
                        <Input
                          type="number"
                          value={youtubeBudget}
                          onChange={(e) => setYoutubeBudget(Number(e.target.value))}
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                    </div>
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />

                  {/* Performance Targets - Collapsible */}
                  <div className="border rounded-none bg-background overflow-hidden">
                    <div
                      className={`flex items-center justify-between cursor-pointer p-3 bg-muted/10 hover:bg-muted/20 transition-colors ${
                        showPerformanceTargets ? 'border-b border-border' : ''
                      }`}
                      onClick={() => setShowPerformanceTargets(!showPerformanceTargets)}
                    >
                      <Label className="text-sm font-medium text-foreground cursor-pointer">Performance Targets</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {showPerformanceTargets ? 'Hide details' : 'Revenue, ROAS, conversions'}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            showPerformanceTargets ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {showPerformanceTargets && (
                      <div className="space-y-4 p-4 bg-muted/5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Target Revenue</Label>
                        <Input
                          type="number"
                          value={targetRevenue}
                          onChange={(e) => setTargetRevenue(Number(e.target.value))}
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Actual Revenue</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="rounded-none"
                          readOnly
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Target ROAS</Label>
                        <Input
                          type="number"
                          value={targetRoas}
                          onChange={(e) => setTargetRoas(Number(e.target.value))}
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Actual ROAS</Label>
                        <Input
                          type="number"
                          value={actualRoas}
                          onChange={(e) => setActualRoas(Number(e.target.value))}
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Target Conversions</Label>
                        <Input
                          type="number"
                          value={targetConversions}
                          onChange={(e) => setTargetConversions(Number(e.target.value))}
                          placeholder="0"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Actual Conversions</Label>
                        <Input
                          type="number"
                          value={actualConversions}
                          onChange={(e) => setActualConversions(Number(e.target.value))}
                          placeholder="0"
                          className="rounded-none"
                        />
                      </div>
                    </div>
                    </div>
                    )}
                  </div>

                  <Separator className="my-6" />

                  {/* Learnings & Notes - Collapsible */}
                  <div className="border rounded-none bg-background overflow-hidden">
                    <div
                      className={`flex items-center justify-between cursor-pointer p-3 bg-muted/10 hover:bg-muted/20 transition-colors ${
                        showLearningsInsights ? 'border-b border-border' : ''
                      }`}
                      onClick={() => setShowLearningsInsights(!showLearningsInsights)}
                    >
                      <Label className="text-sm font-medium text-foreground cursor-pointer">Learnings & Insights</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {showLearningsInsights ? 'Hide details' : 'Campaign insights'}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            showLearningsInsights ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {showLearningsInsights && (
                      <div className="space-y-4 p-4 bg-muted/5">
                    <div>
                      <RichEditor
                        value={learningsInsights}
                        onChange={setLearningsInsights}
                        placeholder="Key learnings, insights, and notes from this campaign..."
                        className="min-h-[120px]"
                        hideToolbar={true}
                      />
                    </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{product?.workingTitle || product?.name}"?
              This action cannot be undone and will permanently remove:
              <br />
              <br />
              • Product details and metadata
              <br />
              • All associated categories and tags
              <br />
              • Idea data and notes
              <br />
              • Activity history
              <br />
              • Reference links
              <br />
              • Product media (if any)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Product'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}