import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ggzxyacfllkelnflcugz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnenh5YWNmbGxrZWxuZmxjdWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTg4NzMsImV4cCI6MjA3MTg5NDg3M30.DsVJAjEV4QRyAzU0Wln5LWgFEL3e8-Bck0lvJbnxZb0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFixedQuery() {
  try {
    console.log('🧪 Testing fixed inventory query...\n')
    
    // Test the same query that was failing
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        product:products (
          id,
          name,
          description,
          image_url,
          category:categories (
            id,
            name
          )
        ),
        inventory_balances (
          on_hand_qty,
          allocated_qty,
          available_qty
        ),
        supplier_prices (
          supplier:suppliers (
            id,
            name,
            contact_person,
            email,
            phone
          )
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('✅ Query successful!')
    console.log(`📦 Found ${data.length} product variants`)
    
    if (data.length > 0) {
      console.log('\n📋 Sample products:')
      data.slice(0, 3).forEach(item => {
        console.log(`• ${item.product.name} (${item.sku})`)
        console.log(`  Stock: ${item.inventory_balances?.[0]?.on_hand_qty || 0} on hand`)
        console.log(`  Category: ${item.product.category?.name || 'Uncategorized'}`)
        console.log(`  Price: ₹${item.price || 'N/A'}`)
      })
    }
    
    console.log('\n🎉 The inventory page should now work correctly!')
    
  } catch (error) {
    console.error('❌ Query failed:', error.message)
    console.error('Full error:', error)
  }
}

testFixedQuery()