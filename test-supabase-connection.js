import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ggzxyacfllkelnflcugz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnenh5YWNmbGxrZWxuZmxjdWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTg4NzMsImV4cCI6MjA3MTg5NDg3M30.DsVJAjEV4QRyAzU0Wln5LWgFEL3e8-Bck0lvJbnxZb0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🔗 Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('movement_types')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return
    }
    
    console.log('✅ Connection successful!')
    console.log('📊 Sample data:', data)
    
    // Verify all inventory tables exist
    const tables = [
      'movement_types', 'statuses', 'alert_types', 'priorities', 'reason_codes',
      'categories', 'products', 'product_variants', 'suppliers', 'supplier_prices',
      'warehouses', 'locations', 'lots', 'stock_movements', 'inventory_balances',
      'reservations', 'purchase_orders', 'purchase_order_lines', 'returns',
      'inventory_alerts', 'stock_predictions', 'user_warehouses'
    ]
    
    console.log('🔍 Verifying tables...')
    let allTablesExist = true
    
    for (const tableName of tables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ Table '${tableName}' not accessible:`, error.message)
          allTablesExist = false
        } else {
          console.log(`✅ Table '${tableName}' exists and accessible`)
        }
      } catch (err) {
        console.log(`❌ Error checking table '${tableName}':`, err.message)
        allTablesExist = false
      }
    }
    
    if (allTablesExist) {
      console.log('🎉 All inventory tables verified successfully!')
      
      // Check some sample data counts
      console.log('\n📈 Sample data counts:')
      const { data: movementTypes } = await supabase.from('movement_types').select('*')
      console.log(`Movement Types: ${movementTypes?.length || 0} records`)
      
      const { data: statuses } = await supabase.from('statuses').select('*')
      console.log(`Statuses: ${statuses?.length || 0} records`)
      
      const { data: alertTypes } = await supabase.from('alert_types').select('*')
      console.log(`Alert Types: ${alertTypes?.length || 0} records`)
      
    } else {
      console.log('⚠️ Some tables are missing or inaccessible')
    }
    
  } catch (err) {
    console.error('💥 Unexpected error:', err.message)
  }
}

testConnection()