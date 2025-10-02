import { useState, useEffect } from 'react'
import { productProductionService, type ProductProduction } from '@/integrations/supabase/product-production-service'

interface Supplier {
  id: string
  name: string
  sourcePrice?: string
  sellingPrice?: string
  quality?: 'excellent' | 'good' | 'average' | 'poor'
  notes?: string
}

interface ProductLink {
  id: string
  url: string
  title: string
  type: 'reference' | 'competitor' | 'inspiration' | 'documentation' | 'other'
}

interface UseProductProductionProps {
  productId: string | undefined
}

export function useProductProduction({ productId }: UseProductProductionProps) {
  // Database record state
  const [productionData, setProductionData] = useState<ProductProduction | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Production Details state (main rich text field)
  const [productionDetails, setProductionDetails] = useState('')

  // Supplier & Pricing state
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([])
  const [supplierComparisonNotes, setSupplierComparisonNotes] = useState('')
  const [preferredSupplierId, setPreferredSupplierId] = useState('')

  // Product Links state
  const [productLinks, setProductLinks] = useState<ProductLink[]>([])

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

  // Load production data when productId changes
  useEffect(() => {
    const loadProductionData = async () => {
      if (!productId) return

      setIsLoading(true)
      try {
        console.log('🔍 Loading production data...')
        const production = await productProductionService.getOrCreateProductProduction(productId)

        if (production) {
          setProductionData(production)

          // Update state with production data
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
          })
        } else {
          console.log('❌ Production data not loaded')
        }
      } catch (error) {
        console.error('Error loading production data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProductionData()
  }, [productId])

  // Auto-save production data when it changes (1 second debounce)
  useEffect(() => {
    if (productId) {
      const timer = setTimeout(async () => {
        setIsSaving(true)
        try {
          console.log('💾 Auto-saving production data for product:', productId)
          console.log('📝 Production data being saved:', {
            production_details: productionDetails,
            supplier_comparison_notes: supplierComparisonNotes,
            sample_status: sampleStatus,
            production_status: productionStatus,
            materials_specification: materialsSpecification
          })

          // Always try to get or create the production record first, then update
          const productionRecord = await productProductionService.getOrCreateProductProduction(productId)
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
            const result = await productProductionService.updateProductProductionByProductId(productId, updateData)
            console.log('✅ Auto-saved production data successfully')
            console.log('💾 Saved production_details:', result?.production_details)
          }
        } catch (error) {
          console.error('Error auto-saving production data:', error)
        } finally {
          setIsSaving(false)
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
    productId
  ])

  return {
    // Database record
    productionData,

    // Loading states
    isLoading,
    isSaving,

    // Production Details
    productionDetails,
    setProductionDetails,

    // Supplier & Pricing
    selectedSuppliers,
    setSelectedSuppliers,
    supplierComparisonNotes,
    setSupplierComparisonNotes,
    preferredSupplierId,
    setPreferredSupplierId,

    // Product Links
    productLinks,
    setProductLinks,

    // Sample Management
    sampleRequestDate,
    setSampleRequestDate,
    sampleReceivedDate,
    setSampleReceivedDate,
    sampleStatus,
    setSampleStatus,
    sampleNotes,
    setSampleNotes,
    sampleQualityRating,
    setSampleQualityRating,

    // Production Timeline
    productionStartDate,
    setProductionStartDate,
    productionCompletionDate,
    setProductionCompletionDate,
    productionMilestones,
    setProductionMilestones,
    productionStatus,
    setProductionStatus,

    // Materials & Specifications
    dimensions,
    setDimensions,
    weight,
    setWeight,
    materialsSpecification,
    setMaterialsSpecification,

    // Manufacturing details
    manufacturingMethod,
    setManufacturingMethod,
    qualityStandards,
    setQualityStandards,
    complianceRequirements,
    setComplianceRequirements,

    // Cost tracking
    estimatedUnitCost,
    setEstimatedUnitCost,
    actualUnitCost,
    setActualUnitCost,
    toolingCost,
    setToolingCost,
    setupCost,
    setSetupCost,

    // Quality control
    qcRequirements,
    setQcRequirements,
    qcStatus,
    setQcStatus,
    qcNotes,
    setQcNotes,

    // Lead times
    leadTimeDays,
    setLeadTimeDays,
    minimumOrderQuantity,
    setMinimumOrderQuantity,
  }
}
