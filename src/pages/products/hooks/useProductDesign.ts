import { useState, useEffect } from 'react'
import { productDesignService, type ProductDesign } from '@/integrations/supabase/product-design-service'

interface DesignIdea {
  id: string
  title: string
  description: string
  links: string[]
  files: File[]
  status: 'new' | 'under-review' | 'approved' | 'archived'
  tags: string[]
}

interface UseProductDesignReturn {
  // Design data
  designData: ProductDesign | null

  // Design Brief state
  productVision: string
  setProductVision: (value: string) => void
  targetAudience: string
  setTargetAudience: (value: string) => void
  designStyle: string
  setDesignStyle: (value: string) => void

  // Visual Identity state
  primaryColors: string
  setPrimaryColors: (value: string) => void
  secondaryColors: string
  setSecondaryColors: (value: string) => void
  materialPreferences: string
  setMaterialPreferences: (value: string) => void

  // Design Assets state
  moodBoardUrl: string
  setMoodBoardUrl: (value: string) => void
  designFilesUrl: string
  setDesignFilesUrl: (value: string) => void
  technicalDrawings: string
  setTechnicalDrawings: (value: string) => void
  cadFiles: string
  setCadFiles: (value: string) => void

  // Design Progress state
  designStatus: string
  setDesignStatus: (value: string) => void
  currentPhase: string
  setCurrentPhase: (value: string) => void
  completionPercentage: number
  setCompletionPercentage: (value: number) => void
  nextMilestone: string
  setNextMilestone: (value: string) => void

  // Design Feedback state
  designFeedback: string
  setDesignFeedback: (value: string) => void

  // Packing Design state
  packagingConcept: string
  setPackagingConcept: (value: string) => void
  packagingApprovalStatus: string
  setPackagingApprovalStatus: (value: string) => void
  packagingApprovalDate: string
  setPackagingApprovalDate: (value: string) => void

  // Design Ideas Repository state
  designIdeas: DesignIdea[]
  setDesignIdeas: (value: DesignIdea[] | ((prev: DesignIdea[]) => DesignIdea[])) => void

  // UI state for accordions/sections
  showDesignBrief: boolean
  setShowDesignBrief: (value: boolean) => void
  showVisualIdentity: boolean
  setShowVisualIdentity: (value: boolean) => void
  showDesignAssets: boolean
  setShowDesignAssets: (value: boolean) => void
  showDesignProgress: boolean
  setShowDesignProgress: (value: boolean) => void
  showDesignFeedback: boolean
  setShowDesignFeedback: (value: boolean) => void
  showPackingDesign: boolean
  setShowPackingDesign: (value: boolean) => void
  showDesignIdeasRepository: boolean
  setShowDesignIdeasRepository: (value: boolean) => void

  // Loading state
  isLoading: boolean

  // Functions
  loadDesignData: (productId: string) => Promise<void>
  saveDesignIdea: (productId: string, idea: Omit<DesignIdea, 'id'>) => Promise<void>
  updateIdeaStatus: (ideaId: string, status: DesignIdea['status']) => void
}

interface UseProductDesignParams {
  productId: string | undefined
}

export const useProductDesign = ({ productId }: UseProductDesignParams): UseProductDesignReturn => {
  // Core design data
  const [designData, setDesignData] = useState<ProductDesign | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Design Brief state
  const [productVision, setProductVision] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [designStyle, setDesignStyle] = useState('')

  // Visual Identity state
  const [primaryColors, setPrimaryColors] = useState('')
  const [secondaryColors, setSecondaryColors] = useState('')
  const [materialPreferences, setMaterialPreferences] = useState('')

  // Design Assets state
  const [moodBoardUrl, setMoodBoardUrl] = useState('')
  const [designFilesUrl, setDesignFilesUrl] = useState('')
  const [technicalDrawings, setTechnicalDrawings] = useState('')
  const [cadFiles, setCadFiles] = useState('')

  // Design Progress state
  const [designStatus, setDesignStatus] = useState('')
  const [currentPhase, setCurrentPhase] = useState('')
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [nextMilestone, setNextMilestone] = useState('')

  // Design Feedback state
  const [designFeedback, setDesignFeedback] = useState('')

  // Packing Design state
  const [packagingConcept, setPackagingConcept] = useState('')
  const [packagingApprovalStatus, setPackagingApprovalStatus] = useState('pending')
  const [packagingApprovalDate, setPackagingApprovalDate] = useState('')

  // Design Ideas Repository state
  const [designIdeas, setDesignIdeas] = useState<DesignIdea[]>([])

  // UI state for accordions/sections
  const [showDesignBrief, setShowDesignBrief] = useState(false)
  const [showVisualIdentity, setShowVisualIdentity] = useState(false)
  const [showDesignAssets, setShowDesignAssets] = useState(false)
  const [showDesignProgress, setShowDesignProgress] = useState(false)
  const [showDesignFeedback, setShowDesignFeedback] = useState(false)
  const [showPackingDesign, setShowPackingDesign] = useState(false)
  const [showDesignIdeasRepository, setShowDesignIdeasRepository] = useState(false)

  // Load design data from database
  const loadDesignData = async (id: string) => {
    console.log('🔍 Loading design data for product ID:', id)
    setIsLoading(true)

    try {
      const design = await productDesignService.getOrCreateProductDesign(id)
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
    } catch (error) {
      console.error('Failed to load design data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load design data when productId changes
  useEffect(() => {
    if (productId) {
      loadDesignData(productId)
    }
  }, [productId])

  // Auto-save design data when it changes (with 1 second debounce)
  useEffect(() => {
    if (productId) {
      const timer = setTimeout(async () => {
        try {
          console.log('💾 Auto-saving design data for product:', productId)
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
          const designRecord = await productDesignService.getOrCreateProductDesign(productId)
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
            await productDesignService.updateProductDesignByProductId(productId, updateData)
            console.log('✅ Auto-saved design data successfully')
          } else {
            console.log('❌ Could not create design record for auto-save')
          }
        } catch (error: any) {
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
    productId
  ])

  // Save design idea
  const saveDesignIdea = async (id: string, idea: Omit<DesignIdea, 'id'>) => {
    if (idea.title.trim() && id) {
      const newIdea = {
        id: Date.now().toString(),
        ...idea,
        title: idea.title.trim(),
        description: idea.description.trim()
      }

      try {
        await productDesignService.addDesignIdea(id, newIdea)
        setDesignIdeas(prev => [...prev, newIdea])
      } catch (error) {
        console.error('Error saving design idea:', error)
        throw error
      }
    }
  }

  // Update idea status
  const updateIdeaStatus = (ideaId: string, status: DesignIdea['status']) => {
    setDesignIdeas(prev => prev.map(idea =>
      idea.id === ideaId ? { ...idea, status } : idea
    ))
  }

  return {
    // Design data
    designData,

    // Design Brief state
    productVision,
    setProductVision,
    targetAudience,
    setTargetAudience,
    designStyle,
    setDesignStyle,

    // Visual Identity state
    primaryColors,
    setPrimaryColors,
    secondaryColors,
    setSecondaryColors,
    materialPreferences,
    setMaterialPreferences,

    // Design Assets state
    moodBoardUrl,
    setMoodBoardUrl,
    designFilesUrl,
    setDesignFilesUrl,
    technicalDrawings,
    setTechnicalDrawings,
    cadFiles,
    setCadFiles,

    // Design Progress state
    designStatus,
    setDesignStatus,
    currentPhase,
    setCurrentPhase,
    completionPercentage,
    setCompletionPercentage,
    nextMilestone,
    setNextMilestone,

    // Design Feedback state
    designFeedback,
    setDesignFeedback,

    // Packing Design state
    packagingConcept,
    setPackagingConcept,
    packagingApprovalStatus,
    setPackagingApprovalStatus,
    packagingApprovalDate,
    setPackagingApprovalDate,

    // Design Ideas Repository state
    designIdeas,
    setDesignIdeas,

    // UI state for accordions/sections
    showDesignBrief,
    setShowDesignBrief,
    showVisualIdentity,
    setShowVisualIdentity,
    showDesignAssets,
    setShowDesignAssets,
    showDesignProgress,
    setShowDesignProgress,
    showDesignFeedback,
    setShowDesignFeedback,
    showPackingDesign,
    setShowPackingDesign,
    showDesignIdeasRepository,
    setShowDesignIdeasRepository,

    // Loading state
    isLoading,

    // Functions
    loadDesignData,
    saveDesignIdea,
    updateIdeaStatus
  }
}
