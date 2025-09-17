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
import { RichTextEditor } from '@/components/ui/rich-text-editor'
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

  // Production Materials & Specifications state
  const [materialsSpecification, setMaterialsSpecification] = useState('')

  // Scaling Learning & Insights state
  const [learningsInsights, setLearningsInsights] = useState('')

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

  // Idea tab toggles state
  const [showBasics, setShowBasics] = useState(false)
  const [showMarketResearch, setShowMarketResearch] = useState(false)
  const [showReferencesMedia, setShowReferencesMedia] = useState(false)

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
          material_preferences: design.material_preferences ? 'has data' : 'empty',
          design_feedback: design.design_feedback ? 'has data' : 'empty',
          packaging_concept: design.packaging_concept ? 'has data' : 'empty'
        })
      } else {
        console.log('❌ Design data not loaded')
      }

      // Load production data
      console.log('🔍 Loading production data...')
      const production = await productProductionService.getOrCreateProductProduction(productId)
      if (production) {
        setProductionData(production)
        // Update state with production data
        setSelectedSuppliers(production.selected_suppliers || [])
        setProductLinks(production.product_links || [])
        setMaterialsSpecification(production.materials_specification || '')
        console.log('✅ Production data loaded successfully')
      } else {
        console.log('❌ Production data not loaded')
      }

      // Load scaling data
      console.log('🔍 Loading scaling data...')
      const scaling = await productScalingService.getOrCreateProductScaling(productId)
      if (scaling) {
        setScalingData(scaling)
        // Update state with scaling data
        setLearningsInsights(scaling.learnings_insights || '')
        console.log('✅ Scaling data loaded successfully')
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
      if (productionData) {
        await productProductionService.updateProductProductionByProductId(product.id, {
          selected_suppliers: selectedSuppliers,
          product_links: productLinks,
          materials_specification: materialsSpecification
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
          // Always try to get or create the design record first, then update
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
          // Always try to get or create the production record first, then update
          const productionRecord = await productProductionService.getOrCreateProductProduction(product.id)
          if (productionRecord) {
            await productProductionService.updateProductProductionByProductId(product.id, {
              selected_suppliers: selectedSuppliers,
              product_links: productLinks,
              materials_specification: materialsSpecification
            })
            console.log('✅ Auto-saved production data')
          }
        } catch (error) {
          console.error('Error auto-saving production data:', error)
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [selectedSuppliers, productLinks, materialsSpecification, product?.id])

  // Auto-save scaling data when it changes
  useEffect(() => {
    if (product?.id) {
      const timer = setTimeout(async () => {
        try {
          // Always try to get or create the scaling record first, then update
          const scalingRecord = await productScalingService.getOrCreateProductScaling(product.id)
          if (scalingRecord) {
            await productScalingService.updateProductScalingByProductId(product.id, {
              learnings_insights: learningsInsights
            })
            console.log('✅ Auto-saved scaling data')
          }
        } catch (error) {
          console.error('Error auto-saving scaling data:', error)
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [learningsInsights, product?.id])

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
        notes: editForm.notes.trim() || undefined,
        problemStatement: editForm.problemStatement.trim() || undefined,
        opportunityStatement: editForm.opportunityStatement.trim() || undefined,
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
                      <h3 className="text-lg font-semibold text-foreground">Design Management</h3>
                      <p className="text-sm text-muted-foreground">Manage product design, prototypes, and visual specifications</p>
                    </div>
                  </div>

                  {/* Design Brief - Collapsible */}
                  <div className="border rounded-none bg-background overflow-hidden">
                    <div
                      className={`flex items-center justify-between cursor-pointer p-3 bg-muted/10 hover:bg-muted/20 transition-colors ${
                        showDesignBrief ? 'border-b border-border' : ''
                      }`}
                      onClick={() => setShowDesignBrief(!showDesignBrief)}
                    >
                      <Label className="text-sm font-medium text-foreground cursor-pointer">Design Brief</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {showDesignBrief ? 'Hide details' : 'Vision, audience, style'}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            showDesignBrief ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {showDesignBrief && (
                      <div className="space-y-4 p-4 bg-muted/5">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-2 block">Product Vision</Label>
                          <RichTextEditor
                            value={productVision}
                            onChange={setProductVision}
                            placeholder="Describe the overall design vision and aesthetic goals..."
                            className="min-h-[100px]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Target Audience</Label>
                            <Input
                              value={targetAudience}
                              onChange={(e) => setTargetAudience(e.target.value)}
                              placeholder="e.g., Young professionals, families..."
                              className="rounded-none"
                            />
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
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />

                  {/* Visual Identity - Collapsible */}
                  <div className="border rounded-none bg-background overflow-hidden">
                    <div
                      className={`flex items-center justify-between cursor-pointer p-3 bg-muted/10 hover:bg-muted/20 transition-colors ${
                        showVisualIdentity ? 'border-b border-border' : ''
                      }`}
                      onClick={() => setShowVisualIdentity(!showVisualIdentity)}
                    >
                      <Label className="text-sm font-medium text-foreground cursor-pointer">Visual Identity</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {showVisualIdentity ? 'Hide details' : 'Colors, materials'}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            showVisualIdentity ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {showVisualIdentity && (
                      <div className="space-y-4 p-4 bg-muted/5">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Primary Colors</Label>
                            <Input
                              value={primaryColors}
                              onChange={(e) => setPrimaryColors(e.target.value)}
                              placeholder="e.g., Navy Blue, White, Gold..."
                              className="rounded-none"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Secondary Colors</Label>
                            <Input
                              value={secondaryColors}
                              onChange={(e) => setSecondaryColors(e.target.value)}
                              placeholder="e.g., Light Gray, Accent Blue..."
                              className="rounded-none"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-2 block">Material Preferences</Label>
                          <RichTextEditor
                            content={materialPreferences}
                            onChange={setMaterialPreferences}
                            placeholder="Describe preferred materials, textures, and finishes..."
                            className="rounded-none"
                            minHeight="80px"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />

                  {/* Design Assets - Collapsible */}
                  <div className="border rounded-none bg-background overflow-hidden">
                    <div
                      className={`flex items-center justify-between cursor-pointer p-3 bg-muted/10 hover:bg-muted/20 transition-colors ${
                        showDesignAssets ? 'border-b border-border' : ''
                      }`}
                      onClick={() => setShowDesignAssets(!showDesignAssets)}
                    >
                      <Label className="text-sm font-medium text-foreground cursor-pointer">Design Assets</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {showDesignAssets ? 'Hide details' : 'Files, models, drawings'}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            showDesignAssets ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {showDesignAssets && (
                      <div className="space-y-4 p-4 bg-muted/5">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Mood Board</Label>
                            <Input
                              value={moodBoardUrl}
                              onChange={(e) => setMoodBoardUrl(e.target.value)}
                              placeholder="https://... (Pinterest, Figma, etc.)"
                              className="rounded-none"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Design Files</Label>
                            <Input
                              value={designFilesUrl}
                              onChange={(e) => setDesignFilesUrl(e.target.value)}
                              placeholder="https://... (Figma, Sketch, etc.)"
                              className="rounded-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground mb-2 block">CAD Files</Label>
                            <Input
                              value={cadFiles}
                              onChange={(e) => setCadFiles(e.target.value)}
                              placeholder="https://... (3D files, renderings)"
                              className="rounded-none"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Technical Drawings</Label>
                            <Input
                              value={technicalDrawings}
                              onChange={(e) => setTechnicalDrawings(e.target.value)}
                              placeholder="https://... (CAD files, blueprints)"
                              className="rounded-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />

                  {/* Design Progress - Collapsible */}
                  <div className="border rounded-none bg-background overflow-hidden">
                    <div
                      className={`flex items-center justify-between cursor-pointer p-3 bg-muted/10 hover:bg-muted/20 transition-colors ${
                        showDesignProgress ? 'border-b border-border' : ''
                      }`}
                      onClick={() => setShowDesignProgress(!showDesignProgress)}
                    >
                      <Label className="text-sm font-medium text-foreground cursor-pointer">Design Progress</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {showDesignProgress ? 'Hide details' : 'Status, timeline, designer'}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            showDesignProgress ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {showDesignProgress && (
                      <div className="space-y-4 p-4 bg-muted/5">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Design Status</Label>
                            <Select value={designStatus} onValueChange={setDesignStatus}>
                              <SelectTrigger className="rounded-none">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
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
                            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Current Phase</Label>
                            <Input
                              value={currentPhase}
                              onChange={(e) => setCurrentPhase(e.target.value)}
                              placeholder="e.g., Wireframing, Mockups"
                              className="rounded-none"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground mb-2 block">Completion %</Label>
                            <Input
                              type="number"
                              value={completionPercentage}
                              onChange={(e) => setCompletionPercentage(Number(e.target.value))}
                              placeholder="0-100"
                              min="0"
                              max="100"
                              className="rounded-none"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-2 block">Next Milestone</Label>
                          <Input
                            value={nextMilestone}
                            onChange={(e) => setNextMilestone(e.target.value)}
                            placeholder="e.g., Complete prototype, Final review"
                            className="rounded-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />

                  {/* Design Feedback - Collapsible */}
                  <div className="border rounded-none bg-background overflow-hidden">
                    <div
                      className={`flex items-center justify-between cursor-pointer p-3 bg-muted/10 hover:bg-muted/20 transition-colors ${
                        showDesignFeedback ? 'border-b border-border' : ''
                      }`}
                      onClick={() => setShowDesignFeedback(!showDesignFeedback)}
                    >
                      <Label className="text-sm font-medium text-foreground cursor-pointer">Design Feedback</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {showDesignFeedback ? 'Hide details' : 'Feedback, revisions'}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            showDesignFeedback ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {showDesignFeedback && (
                      <div className="space-y-4 p-4 bg-muted/5">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-2 block">Feedback & Revisions</Label>
                          <RichTextEditor
                            content={designFeedback}
                            onChange={setDesignFeedback}
                            placeholder="Design feedback, revision requests, approval notes..."
                            className="rounded-none"
                            minHeight="120px"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />

                  {/* Packing Design Section - Collapsible */}
                  <div className="border rounded-none bg-background overflow-hidden">
                    <div
                      className={`flex items-center justify-between cursor-pointer p-3 bg-muted/10 hover:bg-muted/20 transition-colors ${
                        showPackingDesign ? 'border-b border-border' : ''
                      }`}
                      onClick={() => setShowPackingDesign(!showPackingDesign)}
                    >
                      <Label className="text-sm font-medium text-foreground cursor-pointer">Packing Design</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {showPackingDesign ? 'Hide details' : 'Packaging, vendors'}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            showPackingDesign ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {showPackingDesign && (
                      <div className="space-y-4 p-4 bg-muted/5">

                    {/* Packaging Concept Notes */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Packaging Concept Notes</Label>
                      <RichTextEditor
                        content={packagingConcept}
                        onChange={setPackagingConcept}
                        placeholder="Describe dieline ideas, ribbon choices, insert concepts, seasonal editions..."
                        className="rounded-none"
                        minHeight="120px"
                      />
                    </div>

                    {/* File Upload for Packaging */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Packaging Files</Label>
                      <div className="border-2 border-dashed border-border rounded-none p-4">
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Upload PDFs, mock-ups, printer specs, unboxing videos</p>
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

                      {/* Packaging Files Preview */}
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

                    {/* Print Vendor Links */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Print Vendor Links</Label>

                      {/* Add New Vendor Form */}
                      <div className="space-y-3 p-3 border rounded-none bg-muted/10">
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="Vendor name"
                            value={newVendorName}
                            onChange={(e) => setNewVendorName(e.target.value)}
                            className="h-8 rounded-none"
                          />
                          <Input
                            placeholder="Website URL"
                            value={newVendorUrl}
                            onChange={(e) => setNewVendorUrl(e.target.value)}
                            className="h-8 rounded-none"
                          />
                          <Input
                            placeholder="Contact info"
                            value={newVendorContact}
                            onChange={(e) => setNewVendorContact(e.target.value)}
                            className="h-8 rounded-none"
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={addPrintVendor}
                          disabled={!newVendorName.trim() || !newVendorUrl.trim()}
                          className="h-7 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Vendor
                        </Button>
                      </div>

                      {/* Vendor List */}
                      {printVendorLinks.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {printVendorLinks.map((vendor) => (
                            <div key={vendor.id} className="flex items-center justify-between p-2 bg-muted/20 rounded-none">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{vendor.name}</p>
                                <div className="flex items-center gap-4 mt-1">
                                  <a href={vendor.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                    {vendor.url}
                                  </a>
                                  {vendor.contact && (
                                    <span className="text-xs text-muted-foreground">{vendor.contact}</span>
                                  )}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:text-destructive"
                                onClick={() => removePrintVendor(vendor.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Approval Status & Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Approval Status</Label>
                        <Select value={packagingApprovalStatus} onValueChange={setPackagingApprovalStatus}>
                          <SelectTrigger className="rounded-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-review">In Review</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="locked">Final - Locked</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Approval Date</Label>
                        <Input
                          type="date"
                          value={packagingApprovalDate}
                          onChange={(e) => setPackagingApprovalDate(e.target.value)}
                          className="rounded-none"
                        />
                      </div>
                    </div>
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />

                  {/* Product Design Ideas Repository - Collapsible */}
                  <div className="border rounded-none bg-background overflow-hidden">
                    <div
                      className={`flex items-center justify-between cursor-pointer p-3 bg-muted/10 hover:bg-muted/20 transition-colors ${
                        showDesignIdeasRepository ? 'border-b border-border' : ''
                      }`}
                      onClick={() => setShowDesignIdeasRepository(!showDesignIdeasRepository)}
                    >
                      <Label className="text-sm font-medium text-foreground cursor-pointer">Design Ideas Repository</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {showDesignIdeasRepository ? 'Hide details' : 'Concepts, gallery'}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            showDesignIdeasRepository ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {showDesignIdeasRepository && (
                      <div className="space-y-4 p-4 bg-muted/5">
                        {/* Add Idea Button */}
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddIdeaForm(true)}
                            className="h-8 text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Idea
                          </Button>
                        </div>

                    {/* Add New Idea Form */}
                    {showAddIdeaForm && (
                      <div className="p-4 border rounded-none bg-muted/10 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</Label>
                            <Input
                              value={newIdeaTitle}
                              onChange={(e) => setNewIdeaTitle(e.target.value)}
                              placeholder="Idea title..."
                              className="h-8 rounded-none"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground mb-1 block">Description</Label>
                            <Input
                              value={newIdeaDescription}
                              onChange={(e) => setNewIdeaDescription(e.target.value)}
                              placeholder="Brief description..."
                              className="h-8 rounded-none"
                            />
                          </div>
                        </div>

                        {/* Links */}
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-1 block">Links</Label>
                          <div className="flex gap-2">
                            <Input
                              value={ideaLinkInput}
                              onChange={(e) => setIdeaLinkInput(e.target.value)}
                              placeholder="Pinterest, Behance, competitor pages..."
                              className="h-8 rounded-none flex-1"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  addIdeaLink()
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addIdeaLink}
                              className="h-8 px-3"
                            >
                              Add
                            </Button>
                          </div>
                          {newIdeaLinks.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {newIdeaLinks.map((link, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {extractDomainFromUrl(link)}
                                  </a>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                                    onClick={() => removeIdeaLink(index)}
                                  >
                                    <X className="h-2 w-2" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-1 block">Tags</Label>
                          <div className="flex gap-2">
                            <Input
                              value={ideaTagInput}
                              onChange={(e) => setIdeaTagInput(e.target.value)}
                              placeholder="Minimal, Festive, Men's, Custom Engraving..."
                              className="h-8 rounded-none flex-1"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  addIdeaTag()
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addIdeaTag}
                              className="h-8 px-3"
                            >
                              Add
                            </Button>
                          </div>
                          {newIdeaTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {newIdeaTags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <Tag className="h-2 w-2 mr-1" />
                                  {tag}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                                    onClick={() => removeIdeaTag(index)}
                                  >
                                    <X className="h-2 w-2" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* File Upload */}
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-1 block">Files</Label>
                          <input
                            id="idea-files"
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            onChange={handleIdeaFileUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('idea-files')?.click()}
                            className="h-8 text-xs"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Upload Files
                          </Button>
                          {newIdeaFiles.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {newIdeaFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-1 bg-muted/30 rounded-none">
                                  <span className="text-xs truncate max-w-[200px]">{file.name}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 hover:text-destructive"
                                    onClick={() => removeIdeaFile(index)}
                                  >
                                    <X className="h-2 w-2" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Form Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={saveDesignIdea}
                            disabled={!newIdeaTitle.trim()}
                            className="h-8 text-xs"
                          >
                            Save Idea
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowAddIdeaForm(false)
                              setNewIdeaTitle('')
                              setNewIdeaDescription('')
                              setNewIdeaLinks([])
                              setNewIdeaFiles([])
                              setNewIdeaTags([])
                            }}
                            className="h-8 text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Ideas Gallery */}
                    {designIdeas.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {designIdeas.map((idea) => (
                          <div key={idea.id} className="border rounded-none p-4 bg-muted/20">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-semibold">{idea.title}</h4>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={idea.status}
                                  onValueChange={(status: 'new' | 'under-review' | 'approved' | 'archived') =>
                                    updateIdeaStatus(idea.id, status)
                                  }
                                >
                                  <SelectTrigger className="h-6 w-24 text-xs rounded-none">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="under-review">Review</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:text-destructive"
                                  onClick={() => removeDesignIdea(idea.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {idea.description && (
                              <p className="text-xs text-muted-foreground mb-2">{idea.description}</p>
                            )}

                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`text-xs ${getStatusColor(idea.status)}`}>
                                {getStatusIcon(idea.status)}
                                {idea.status.replace('-', ' ')}
                              </Badge>
                            </div>

                            {idea.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {idea.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    <Tag className="h-2 w-2 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {idea.links.length > 0 && (
                              <div className="space-y-1 mb-2">
                                {idea.links.map((link, index) => (
                                  <a
                                    key={index}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block text-xs text-blue-600 hover:underline truncate"
                                  >
                                    {extractDomainFromUrl(link)}
                                  </a>
                                ))}
                              </div>
                            )}

                            {idea.files.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                <FileText className="h-3 w-3 inline mr-1" />
                                {idea.files.length} file{idea.files.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-muted rounded-none">
                        <div className="flex flex-col items-center gap-2">
                          <Archive className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No design ideas yet</p>
                          <p className="text-xs text-muted-foreground">Click "Add Idea" to start building your design repository</p>
                        </div>
                      </div>
                    )}
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
                      <h3 className="text-lg font-semibold text-foreground">Production Management</h3>
                      <p className="text-sm text-muted-foreground">Manage manufacturing, samples, and production timeline</p>
                    </div>
                  </div>

                  {/* Supplier & Pricing and Links - Two Columns */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Supplier & Pricing - Collapsible */}
                    <div className="border rounded-none bg-background overflow-hidden">
                      <div
                        className={`flex items-center justify-between cursor-pointer p-3 bg-muted/10 hover:bg-muted/20 transition-colors ${
                          showSupplierPricing ? 'border-b border-border' : ''
                        }`}
                        onClick={() => setShowSupplierPricing(!showSupplierPricing)}
                      >
                        <Label className="text-sm font-medium text-foreground cursor-pointer">Supplier & Pricing</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {showSupplierPricing ? 'Hide details' : 'Vendors, pricing, quality'}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform ${
                              showSupplierPricing ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Collapsible Content */}
                      {showSupplierPricing && (
                        <div className="space-y-4 p-4 bg-muted/5">

                      {/* Multiple Supplier Selection with Pricing & Quality */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-muted-foreground">Suppliers Comparison</Label>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                            onClick={() => window.open('/vendors', '_blank')}
                          >
                            View All Vendors
                          </Button>
                        </div>

                        {/* Add Supplier Dropdown */}
                        <Select
                          open={supplierDropdownOpen}
                          onOpenChange={setSupplierDropdownOpen}
                          onValueChange={addSupplier}
                        >
                          <SelectTrigger className="rounded-none">
                            <SelectValue placeholder="Add vendors to compare..." />
                          </SelectTrigger>
                          <SelectContent>
                            {vendorsLoading ? (
                              <SelectItem value="loading" disabled>Loading vendors...</SelectItem>
                            ) : !vendors || vendors.length === 0 ? (
                              <SelectItem value="no-vendors" disabled>No vendors available</SelectItem>
                            ) : (
                              vendors
                                .filter(vendor =>
                                  vendor.status === 'active' &&
                                  !selectedSuppliers.some(s => s.id === vendor.id)
                                )
                                .map((vendor) => (
                                  <SelectItem key={vendor.id} value={vendor.id}>
                                    <span className="font-medium">{vendor.name}</span>
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>

                        {/* Selected Suppliers with Individual Pricing & Quality */}
                        {selectedSuppliers.length > 0 ? (
                          <div className="space-y-4">
                            {selectedSuppliers.map((supplier, index) => (
                              <div key={supplier.id} className="border rounded-none p-4 space-y-3 bg-muted/20">
                                {/* Supplier Header */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      #{index + 1}
                                    </Badge>
                                    <span className="font-medium text-sm">{supplier.name}</span>
                                  </div>
                                  <X
                                    className="h-4 w-4 cursor-pointer hover:text-destructive"
                                    onClick={() => removeSupplier(supplier.id)}
                                  />
                                </div>

                                {/* Pricing Fields */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                                      Source Price (₹)
                                    </Label>
                                    <Input
                                      type="number"
                                      step="1"
                                      value={supplier.sourcePrice}
                                      onChange={(e) => updateSupplierField(supplier.id, 'sourcePrice', e.target.value)}
                                      placeholder="500"
                                      className="rounded-none h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                                      Selling Price (₹)
                                    </Label>
                                    <Input
                                      type="number"
                                      step="1"
                                      value={supplier.sellingPrice}
                                      onChange={(e) => updateSupplierField(supplier.id, 'sellingPrice', e.target.value)}
                                      placeholder="800"
                                      className="rounded-none h-8"
                                    />
                                  </div>
                                </div>

                                {/* Quality & Notes */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                                      Quality Rating
                                    </Label>
                                    <Select
                                      value={supplier.quality}
                                      onValueChange={(value) => updateSupplierField(supplier.id, 'quality', value)}
                                    >
                                      <SelectTrigger className="rounded-none h-8">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="excellent">⭐⭐⭐⭐⭐ Excellent</SelectItem>
                                        <SelectItem value="good">⭐⭐⭐⭐ Good</SelectItem>
                                        <SelectItem value="average">⭐⭐⭐ Average</SelectItem>
                                        <SelectItem value="poor">⭐⭐ Poor</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                                      Notes
                                    </Label>
                                    <Input
                                      value={supplier.notes}
                                      onChange={(e) => updateSupplierField(supplier.id, 'notes', e.target.value)}
                                      placeholder="Quality notes..."
                                      className="rounded-none h-8"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}

                            <p className="text-xs text-muted-foreground text-center">
                              {selectedSuppliers.length} supplier{selectedSuppliers.length > 1 ? 's' : ''} added for comparison
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-8 border-2 border-dashed border-muted rounded-none">
                            <p className="text-sm text-muted-foreground">No suppliers selected</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Add vendors from the dropdown above to compare pricing and quality
                            </p>
                          </div>
                        )}
                      </div>
                        </div>
                      )}
                    </div>

                    {/* Product Links - Collapsible */}
                    <div className="border rounded-none bg-background overflow-hidden">
                      <div
                        className={`flex items-center justify-between cursor-pointer p-3 bg-muted/10 hover:bg-muted/20 transition-colors ${
                          showProductLinks ? 'border-b border-border' : ''
                        }`}
                        onClick={() => setShowProductLinks(!showProductLinks)}
                      >
                        <Label className="text-sm font-medium text-foreground cursor-pointer">Product Links</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {showProductLinks ? 'Hide details' : 'References, competitors'}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform ${
                              showProductLinks ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Collapsible Content */}
                      {showProductLinks && (
                        <div className="space-y-4 p-4 bg-muted/5">

                      {/* Add New Link Form */}
                      <div className="space-y-3 border rounded-none p-4 bg-muted/10">
                        <Label className="text-xs font-medium text-muted-foreground">Add New Link</Label>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Input
                              value={newLinkTitle}
                              onChange={(e) => setNewLinkTitle(e.target.value)}
                              placeholder="Link title..."
                              className="rounded-none h-8"
                            />
                          </div>
                          <div>
                            <Select
                              value={newLinkType}
                              onValueChange={(value) => setNewLinkType(value as 'reference' | 'competitor' | 'inspiration' | 'documentation' | 'other')}
                            >
                              <SelectTrigger className="rounded-none h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="reference">📋 Reference</SelectItem>
                                <SelectItem value="competitor">🏪 Competitor</SelectItem>
                                <SelectItem value="inspiration">💡 Inspiration</SelectItem>
                                <SelectItem value="documentation">📄 Documentation</SelectItem>
                                <SelectItem value="other">🔗 Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Input
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                            placeholder="https://..."
                            className="rounded-none h-8 flex-1"
                          />
                          <Button
                            onClick={addProductLink}
                            size="sm"
                            className="h-8 px-3 rounded-none"
                            disabled={!newLinkUrl.trim() || !newLinkTitle.trim()}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Existing Links */}
                      {productLinks.length > 0 ? (
                        <div className="space-y-3">
                          {productLinks.map((link) => (
                            <div key={link.id} className="border rounded-lg p-3 bg-muted/20">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Badge variant="outline" className="text-xs flex-shrink-0">
                                    {link.type === 'reference' && '📋'}
                                    {link.type === 'competitor' && '🏪'}
                                    {link.type === 'inspiration' && '💡'}
                                    {link.type === 'documentation' && '📄'}
                                    {link.type === 'other' && '🔗'}
                                  </Badge>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{link.title}</p>
                                    <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => window.open(link.url, '_blank')}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:text-destructive"
                                    onClick={() => removeProductLink(link.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}

                          <p className="text-xs text-muted-foreground text-center">
                            {productLinks.length} link{productLinks.length > 1 ? 's' : ''} added
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed border-muted rounded-none">
                          <Link className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No links added</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Add reference links, competitor analysis, or documentation
                          </p>
                        </div>
                      )}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Sample Management & Production Timeline - Two Columns */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sample Management - Collapsible */}
                    <div className="border rounded-none bg-background overflow-hidden">
                      <div
                        className={`flex items-center justify-between cursor-pointer p-3 bg-muted/10 hover:bg-muted/20 transition-colors ${
                          showSampleManagement ? 'border-b border-border' : ''
                        }`}
                        onClick={() => setShowSampleManagement(!showSampleManagement)}
                      >
                        <Label className="text-sm font-medium text-foreground cursor-pointer">Sample Management</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {showSampleManagement ? 'Hide details' : 'Dates, status, notes'}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform ${
                              showSampleManagement ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Collapsible Content */}
                      {showSampleManagement && (
                        <div className="space-y-4 p-4 bg-muted/5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-2 block">Sample Request Date</Label>
                          <Input
                            type="date"
                            className="rounded-none"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-2 block">Sample Received Date</Label>
                          <Input
                            type="date"
                            className="rounded-none"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Sample Status</Label>
                        <Select>
                          <SelectTrigger className="rounded-none">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="needs-revision">Needs Revision</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Sample Notes</Label>
                        <Textarea
                          placeholder="Notes about sample quality, feedback..."
                          className="rounded-none min-h-[80px]"
                        />
                      </div>
                        </div>
                      )}
                    </div>

                    {/* Production Timeline - Collapsible */}
                    <div className="border rounded-none bg-background overflow-hidden">
                      <div
                        className={`flex items-center justify-between cursor-pointer p-3 bg-muted/10 hover:bg-muted/20 transition-colors ${
                          showProductionTimeline ? 'border-b border-border' : ''
                        }`}
                        onClick={() => setShowProductionTimeline(!showProductionTimeline)}
                      >
                        <Label className="text-sm font-medium text-foreground cursor-pointer">Production Timeline</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {showProductionTimeline ? 'Hide details' : 'Start, completion, milestones'}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform ${
                              showProductionTimeline ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Collapsible Content */}
                      {showProductionTimeline && (
                        <div className="space-y-4 p-4 bg-muted/5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-2 block">Production Start</Label>
                          <Input
                            type="date"
                            className="rounded-none"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-muted-foreground mb-2 block">Expected Completion</Label>
                          <Input
                            type="date"
                            className="rounded-none"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Production Milestones</Label>
                        <Textarea
                          placeholder="Key milestones and deadlines..."
                          className="rounded-none min-h-[100px]"
                        />
                      </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Materials & Specifications - Collapsible */}
                  <div className="border rounded-none bg-background overflow-hidden">
                    <div
                      className={`flex items-center justify-between cursor-pointer p-3 bg-muted/10 hover:bg-muted/20 transition-colors ${
                        showMaterialsSpecs ? 'border-b border-border' : ''
                      }`}
                      onClick={() => setShowMaterialsSpecs(!showMaterialsSpecs)}
                    >
                      <Label className="text-sm font-medium text-foreground cursor-pointer">Materials & Specifications</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {showMaterialsSpecs ? 'Hide details' : 'Dimensions, materials'}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            showMaterialsSpecs ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {showMaterialsSpecs && (
                      <div className="space-y-4 p-4 bg-muted/5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Dimensions</Label>
                        <Input
                          placeholder="L x W x H"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Weight</Label>
                        <Input
                          placeholder="kg"
                          className="rounded-none"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Materials</Label>
                      <RichTextEditor
                        content={materialsSpecification}
                        onChange={setMaterialsSpecification}
                        placeholder="Describe materials used..."
                        className="rounded-none"
                        minHeight="80px"
                      />
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
                      <h3 className="text-lg font-semibold text-foreground">Content Creation</h3>
                      <p className="text-sm text-muted-foreground">Manage creative assets, scripts, and content production</p>
                    </div>
                  </div>

                  {/* Creative Brief */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-foreground">Creative Brief</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Moodboard Link</Label>
                        <Input
                          placeholder="https://..."
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Brief Document</Label>
                        <Input
                          placeholder="https://..."
                          className="rounded-none"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Video Scripts */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-foreground">Video Scripts</Label>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Hero Video Script</Label>
                      <Textarea
                        placeholder="Main hero video script..."
                        className="rounded-none min-h-[100px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Lifestyle Script</Label>
                      <Textarea
                        placeholder="Lifestyle video script..."
                        className="rounded-none min-h-[100px]"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Unboxing Script</Label>
                      <Textarea
                        placeholder="Unboxing video script..."
                        className="rounded-none min-h-[100px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">15s Script</Label>
                        <Textarea
                          placeholder="Short 15 second script..."
                          className="rounded-none min-h-[80px]"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">30s Script</Label>
                        <Textarea
                          placeholder="30 second script..."
                          className="rounded-none min-h-[80px]"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Team Assignment */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-foreground">Team Assignment</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Agency</Label>
                        <Select>
                          <SelectTrigger className="rounded-none">
                            <SelectValue placeholder="Select agency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="agency1">Creative Agency A</SelectItem>
                            <SelectItem value="agency2">Creative Agency B</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Influencer</Label>
                        <Select>
                          <SelectTrigger className="rounded-none">
                            <SelectValue placeholder="Select influencer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="influencer1">Influencer 1</SelectItem>
                            <SelectItem value="influencer2">Influencer 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
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
                        className="rounded-none"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Marketing Channels</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded-none" />
                          <span className="text-sm">Facebook</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded-none" />
                          <span className="text-sm">Instagram</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded-none" />
                          <span className="text-sm">Google Ads</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded-none" />
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
                        placeholder="0.00"
                        className="rounded-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Facebook Budget</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Instagram Budget</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Google Budget</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">YouTube Budget</Label>
                        <Input
                          type="number"
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
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Target ROAS</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Actual ROAS</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Target Conversions</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          className="rounded-none"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-2 block">Actual Conversions</Label>
                        <Input
                          type="number"
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
                      <RichTextEditor
                        content={learningsInsights}
                        onChange={setLearningsInsights}
                        placeholder="Key learnings, insights, and notes from this campaign..."
                        className="rounded-none"
                        minHeight="120px"
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