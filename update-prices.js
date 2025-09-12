import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ggzxyacfllkelnflcugz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnenh5YWNmbGxrZWxuZmxjdWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTg4NzMsImV4cCI6MjA3MTg5NDg3M30.DsVJAjEV4QRyAzU0Wln5LWgFEL3e8-Bck0lvJbnxZb0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function updatePrices() {
  try {
    console.log('🔄 Updating product prices...')

    // Get all product variants
    const { data: variants, error: fetchError } = await supabase
      .from('product_variants')
      .select('id, sku, cost, price')

    if (fetchError) throw fetchError

    console.log(`Found ${variants.length} product variants`)

    // Update prices for products that don't have them
    for (const variant of variants) {
      if (!variant.price && variant.cost) {
        // Set price to be 150% of cost (50% markup)
        const newPrice = variant.cost * 1.5
        
        const { error: updateError } = await supabase
          .from('product_variants')
          .update({ price: newPrice })
          .eq('id', variant.id)

        if (updateError) {
          console.error(`Failed to update price for ${variant.sku}:`, updateError)
        } else {
          console.log(`✅ Updated price for ${variant.sku}: ₹${variant.cost} → ₹${newPrice}`)
        }
      } else if (!variant.price && !variant.cost) {
        // Set default prices for variants without cost
        const defaultCost = 100
        const defaultPrice = 150
        
        const { error: updateError } = await supabase
          .from('product_variants')
          .update({ 
            cost: defaultCost,
            price: defaultPrice 
          })
          .eq('id', variant.id)

        if (updateError) {
          console.error(`Failed to update prices for ${variant.sku}:`, updateError)
        } else {
          console.log(`✅ Set default prices for ${variant.sku}: Cost ₹${defaultCost}, Price ₹${defaultPrice}`)
        }
      } else {
        console.log(`⏭️  ${variant.sku} already has price: ₹${variant.price}`)
      }
    }

    console.log('\n🎉 Price update completed!')
  } catch (error) {
    console.error('❌ Error updating prices:', error)
  }
}

updatePrices()