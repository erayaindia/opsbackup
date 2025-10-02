import { useState, useEffect } from 'react'
import { productScalingService, type ProductScaling } from '@/integrations/supabase/product-scaling-service'

interface UseProductScalingParams {
  productId: string | undefined
}

interface UseProductScalingReturn {
  // Data state
  scalingData: ProductScaling | null
  setScalingData: React.Dispatch<React.SetStateAction<ProductScaling | null>>

  // Launch Details state
  launchDate: string
  setLaunchDate: React.Dispatch<React.SetStateAction<string>>
  marketingChannels: string[]
  setMarketingChannels: React.Dispatch<React.SetStateAction<string[]>>
  launchStatus: string
  setLaunchStatus: React.Dispatch<React.SetStateAction<string>>
  launchNotes: string
  setLaunchNotes: React.Dispatch<React.SetStateAction<string>>

  // Budget Allocation state
  totalBudget: number
  setTotalBudget: React.Dispatch<React.SetStateAction<number>>
  facebookBudget: number
  setFacebookBudget: React.Dispatch<React.SetStateAction<number>>
  instagramBudget: number
  setInstagramBudget: React.Dispatch<React.SetStateAction<number>>
  googleBudget: number
  setGoogleBudget: React.Dispatch<React.SetStateAction<number>>
  youtubeBudget: number
  setYoutubeBudget: React.Dispatch<React.SetStateAction<number>>
  budgetAllocationNotes: string
  setBudgetAllocationNotes: React.Dispatch<React.SetStateAction<string>>

  // Performance Targets state
  targetRevenue: number
  setTargetRevenue: React.Dispatch<React.SetStateAction<number>>
  actualRevenue: number
  setActualRevenue: React.Dispatch<React.SetStateAction<number>>
  targetRoas: number
  setTargetRoas: React.Dispatch<React.SetStateAction<number>>
  actualRoas: number
  setActualRoas: React.Dispatch<React.SetStateAction<number>>
  targetConversions: number
  setTargetConversions: React.Dispatch<React.SetStateAction<number>>
  actualConversions: number
  setActualConversions: React.Dispatch<React.SetStateAction<number>>
  targetCpc: number
  setTargetCpc: React.Dispatch<React.SetStateAction<number>>
  actualCpc: number
  setActualCpc: React.Dispatch<React.SetStateAction<number>>
  targetCtr: number
  setTargetCtr: React.Dispatch<React.SetStateAction<number>>
  actualCtr: number
  setActualCtr: React.Dispatch<React.SetStateAction<number>>
  targetCpa: number
  setTargetCpa: React.Dispatch<React.SetStateAction<number>>
  actualCpa: number
  setActualCpa: React.Dispatch<React.SetStateAction<number>>
  targetAov: number
  setTargetAov: React.Dispatch<React.SetStateAction<number>>
  actualAov: number
  setActualAov: React.Dispatch<React.SetStateAction<number>>
  targetLtv: number
  setTargetLtv: React.Dispatch<React.SetStateAction<number>>
  actualLtv: number
  setActualLtv: React.Dispatch<React.SetStateAction<number>>
  performanceNotes: string
  setPerformanceNotes: React.Dispatch<React.SetStateAction<string>>

  // Campaign Data state
  campaignDuration: number
  setCampaignDuration: React.Dispatch<React.SetStateAction<number>>
  campaignStatus: string
  setCampaignStatus: React.Dispatch<React.SetStateAction<string>>
  actualSpend: number
  setActualSpend: React.Dispatch<React.SetStateAction<number>>
  impressions: number
  setImpressions: React.Dispatch<React.SetStateAction<number>>
  clicks: number
  setClicks: React.Dispatch<React.SetStateAction<number>>
  conversions: number
  setConversions: React.Dispatch<React.SetStateAction<number>>
  adSpendTotal: number
  setAdSpendTotal: React.Dispatch<React.SetStateAction<number>>
  impressionsTotal: number
  setImpressionsTotal: React.Dispatch<React.SetStateAction<number>>
  clicksTotal: number
  setClicksTotal: React.Dispatch<React.SetStateAction<number>>
  learningsInsights: string
  setLearningsInsights: React.Dispatch<React.SetStateAction<string>>
  campaignNotes: string
  setCampaignNotes: React.Dispatch<React.SetStateAction<string>>

  // Scaling Strategy state
  scalingStage: string
  setScalingStage: React.Dispatch<React.SetStateAction<string>>
  nextScalingAction: string
  setNextScalingAction: React.Dispatch<React.SetStateAction<string>>
  scalingConstraints: string
  setScalingConstraints: React.Dispatch<React.SetStateAction<string>>

  // Market Analysis state
  marketSizeEstimate: string
  setMarketSizeEstimate: React.Dispatch<React.SetStateAction<string>>
  marketPenetration: string
  setMarketPenetration: React.Dispatch<React.SetStateAction<string>>
  competitiveAdvantage: string
  setCompetitiveAdvantage: React.Dispatch<React.SetStateAction<string>>
  marketFeedback: string
  setMarketFeedback: React.Dispatch<React.SetStateAction<string>>

  // Growth Strategy state
  growthStrategy: string
  setGrowthStrategy: React.Dispatch<React.SetStateAction<string>>
  expansionPlans: string
  setExpansionPlans: React.Dispatch<React.SetStateAction<string>>
  optimizationOpportunities: string
  setOptimizationOpportunities: React.Dispatch<React.SetStateAction<string>>

  // Loading states
  isLoading: boolean
  isSaving: boolean
}

export const useProductScaling = ({ productId }: UseProductScalingParams): UseProductScalingReturn => {
  // Database record state
  const [scalingData, setScalingData] = useState<ProductScaling | null>(null)

  // Loading states
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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
  const [targetCpa, setTargetCpa] = useState(0)
  const [actualCpa, setActualCpa] = useState(0)
  const [targetAov, setTargetAov] = useState(0)
  const [actualAov, setActualAov] = useState(0)
  const [targetLtv, setTargetLtv] = useState(0)
  const [actualLtv, setActualLtv] = useState(0)
  const [performanceNotes, setPerformanceNotes] = useState('')

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
  const [learningsInsights, setLearningsInsights] = useState('')
  const [campaignNotes, setCampaignNotes] = useState('')

  // Scaling Strategy state
  const [scalingStage, setScalingStage] = useState('')
  const [nextScalingAction, setNextScalingAction] = useState('')
  const [scalingConstraints, setScalingConstraints] = useState('')

  // Market Analysis state
  const [marketSizeEstimate, setMarketSizeEstimate] = useState('')
  const [marketPenetration, setMarketPenetration] = useState('')
  const [competitiveAdvantage, setCompetitiveAdvantage] = useState('')
  const [marketFeedback, setMarketFeedback] = useState('')

  // Growth Strategy state
  const [growthStrategy, setGrowthStrategy] = useState('')
  const [expansionPlans, setExpansionPlans] = useState('')
  const [optimizationOpportunities, setOptimizationOpportunities] = useState('')

  // Load scaling data when productId changes
  useEffect(() => {
    const loadScalingData = async () => {
      if (!productId) return

      try {
        setIsLoading(true)
        console.log('🔍 Loading scaling data for product:', productId)

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
        } else {
          console.log('❌ Scaling data not loaded')
        }
      } catch (error) {
        console.error('❌ Error loading scaling data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadScalingData()
  }, [productId])

  // Auto-save scaling data when it changes
  useEffect(() => {
    if (productId) {
      const timer = setTimeout(async () => {
        try {
          setIsSaving(true)
          console.log('💾 Auto-saving scaling data for product:', productId)
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
          const scalingRecord = await productScalingService.getOrCreateProductScaling(productId)
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

            await productScalingService.updateProductScalingByProductId(productId, updateData)
            console.log('✅ Auto-saved scaling data successfully')
          }
        } catch (error) {
          console.error('❌ Error auto-saving scaling data:', error)
        } finally {
          setIsSaving(false)
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
    productId
  ])

  return {
    // Data state
    scalingData,
    setScalingData,

    // Launch Details state
    launchDate,
    setLaunchDate,
    marketingChannels,
    setMarketingChannels,
    launchStatus,
    setLaunchStatus,
    launchNotes,
    setLaunchNotes,

    // Budget Allocation state
    totalBudget,
    setTotalBudget,
    facebookBudget,
    setFacebookBudget,
    instagramBudget,
    setInstagramBudget,
    googleBudget,
    setGoogleBudget,
    youtubeBudget,
    setYoutubeBudget,
    budgetAllocationNotes,
    setBudgetAllocationNotes,

    // Performance Targets state
    targetRevenue,
    setTargetRevenue,
    actualRevenue,
    setActualRevenue,
    targetRoas,
    setTargetRoas,
    actualRoas,
    setActualRoas,
    targetConversions,
    setTargetConversions,
    actualConversions,
    setActualConversions,
    targetCpc,
    setTargetCpc,
    actualCpc,
    setActualCpc,
    targetCtr,
    setTargetCtr,
    actualCtr,
    setActualCtr,
    targetCpa,
    setTargetCpa,
    actualCpa,
    setActualCpa,
    targetAov,
    setTargetAov,
    actualAov,
    setActualAov,
    targetLtv,
    setTargetLtv,
    actualLtv,
    setActualLtv,
    performanceNotes,
    setPerformanceNotes,

    // Campaign Data state
    campaignDuration,
    setCampaignDuration,
    campaignStatus,
    setCampaignStatus,
    actualSpend,
    setActualSpend,
    impressions,
    setImpressions,
    clicks,
    setClicks,
    conversions,
    setConversions,
    adSpendTotal,
    setAdSpendTotal,
    impressionsTotal,
    setImpressionsTotal,
    clicksTotal,
    setClicksTotal,
    learningsInsights,
    setLearningsInsights,
    campaignNotes,
    setCampaignNotes,

    // Scaling Strategy state
    scalingStage,
    setScalingStage,
    nextScalingAction,
    setNextScalingAction,
    scalingConstraints,
    setScalingConstraints,

    // Market Analysis state
    marketSizeEstimate,
    setMarketSizeEstimate,
    marketPenetration,
    setMarketPenetration,
    competitiveAdvantage,
    setCompetitiveAdvantage,
    marketFeedback,
    setMarketFeedback,

    // Growth Strategy state
    growthStrategy,
    setGrowthStrategy,
    expansionPlans,
    setExpansionPlans,
    optimizationOpportunities,
    setOptimizationOpportunities,

    // Loading states
    isLoading,
    isSaving
  }
}
