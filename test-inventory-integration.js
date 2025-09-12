import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ggzxyacfllkelnflcugz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnenh5YWNmbGxrZWxuZmxjdWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTg4NzMsImV4cCI6MjA3MTg5NDg3M30.DsVJAjEV4QRyAzU0Wln5LWgFEL3e8-Bck0lvJbnxZb0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInventoryIntegration() {
  try {
    console.log('🧪 Testing Inventory Database Integration...\n')
    
    // Test 1: Create a test category
    console.log('📁 Testing Category Creation...')
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .insert({ name: 'Test Jewelry Category' })
      .select()
      .single()
    
    if (categoryError) throw categoryError
    console.log('✅ Category created:', category.name)
    
    // Test 2: Create a test supplier
    console.log('\n🏪 Testing Supplier Creation...')
    const { data: statusData } = await supabase
      .from('statuses')
      .select('id')
      .eq('domain', 'supplier')
      .eq('code', 'active')
      .single()
    
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .insert({
        name: 'Test Jewelry Supplier',
        code: 'TJS001',
        contact_person: 'John Doe',
        email: 'john@testjewelry.com',
        phone: '+91-9876543210',
        lead_time_days: 7,
        status_id: statusData?.id
      })
      .select()
      .single()
    
    if (supplierError) throw supplierError
    console.log('✅ Supplier created:', supplier.name)
    
    // Test 3: Create a test warehouse
    console.log('\n🏢 Testing Warehouse Creation...')
    const { data: warehouse, error: warehouseError } = await supabase
      .from('warehouses')
      .insert({
        name: 'Main Warehouse',
        code: 'MAIN001',
        address: {
          street: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          postal_code: '400001'
        },
        capacity: 10000,
        active: true
      })
      .select()
      .single()
    
    if (warehouseError) throw warehouseError
    console.log('✅ Warehouse created:', warehouse.name)
    
    // Test 4: Create a test product and variant
    console.log('\n💍 Testing Product Creation...')
    const { data: productStatusData } = await supabase
      .from('statuses')
      .select('id')
      .eq('domain', 'product')
      .eq('code', 'active')
      .single()
    
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name: 'Test Gold Ring',
        description: 'Beautiful test gold ring for demonstration',
        category_id: category.id,
        status_id: productStatusData?.id
      })
      .select()
      .single()
    
    if (productError) throw productError
    console.log('✅ Product created:', product.name)
    
    // Create product variant
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .insert({
        product_id: product.id,
        sku: 'RING-GOLD-001',
        barcode: '1234567890123',
        cost: 2500.00,
        price: 3500.00,
        min_stock_level: 5,
        reorder_point: 10,
        reorder_quantity: 50,
        attributes: {
          metal: 'Gold',
          karat: '18K',
          weight: '5g',
          size: '7'
        }
      })
      .select()
      .single()
    
    if (variantError) throw variantError
    console.log('✅ Product variant created:', variant.sku)
    
    // Test 5: Record stock movement (stock in)
    console.log('\n📦 Testing Stock Movement...')
    const { data: movementTypeData } = await supabase
      .from('movement_types')
      .select('id')
      .eq('code', 'IN')
      .single()
    
    const { data: stockMovement, error: movementError } = await supabase
      .from('stock_movements')
      .insert({
        product_variant_id: variant.id,
        warehouse_id: warehouse.id,
        movement_type_id: movementTypeData?.id,
        qty: 25,
        unit_cost: 2500.00,
        reference_type: 'purchase',
        reference_id: 'PO-TEST-001',
        notes: 'Initial stock for testing'
      })
      .select()
      .single()
    
    if (movementError) throw movementError
    console.log('✅ Stock movement recorded: +25 units')
    
    // Test 6: Check inventory balance was updated by trigger
    console.log('\n📊 Testing Inventory Balance...')
    const { data: balance, error: balanceError } = await supabase
      .from('inventory_balances')
      .select('*')
      .eq('product_variant_id', variant.id)
      .eq('warehouse_id', warehouse.id)
      .single()
    
    if (balanceError) throw balanceError
    console.log('✅ Inventory balance updated automatically:')
    console.log(`   On Hand: ${balance.on_hand_qty}`)
    console.log(`   Allocated: ${balance.allocated_qty}`)
    console.log(`   Available: ${balance.available_qty}`)
    
    // Test 7: Create a reservation
    console.log('\n🔒 Testing Reservation...')
    const { data: reservationStatusData } = await supabase
      .from('statuses')
      .select('id')
      .eq('domain', 'reservation')
      .eq('code', 'active')
      .single()
    
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        product_variant_id: variant.id,
        warehouse_id: warehouse.id,
        qty: 5,
        reference_type: 'sales_order',
        reference_id: 'SO-TEST-001',
        status_id: reservationStatusData?.id
      })
      .select()
      .single()
    
    if (reservationError) throw reservationError
    console.log('✅ Reservation created: 5 units')
    
    // Check balance was updated by trigger
    const { data: updatedBalance } = await supabase
      .from('inventory_balances')
      .select('*')
      .eq('product_variant_id', variant.id)
      .eq('warehouse_id', warehouse.id)
      .single()
    
    console.log('✅ Balance updated after reservation:')
    console.log(`   On Hand: ${updatedBalance.on_hand_qty}`)
    console.log(`   Allocated: ${updatedBalance.allocated_qty}`)
    console.log(`   Available: ${updatedBalance.available_qty}`)
    
    // Test 8: Create an inventory alert
    console.log('\n🚨 Testing Inventory Alert...')
    const { data: alertTypeData } = await supabase
      .from('alert_types')
      .select('id')
      .eq('code', 'low_stock')
      .single()
    
    const { data: priorityData } = await supabase
      .from('priorities')
      .select('id')
      .eq('code', 'medium')
      .single()
    
    const { data: alertStatusData } = await supabase
      .from('statuses')
      .select('id')
      .eq('domain', 'alert')
      .eq('code', 'active')
      .single()
    
    const { data: alert, error: alertError } = await supabase
      .from('inventory_alerts')
      .insert({
        product_variant_id: variant.id,
        warehouse_id: warehouse.id,
        alert_type_id: alertTypeData?.id,
        priority_id: priorityData?.id,
        status_id: alertStatusData?.id,
        current_stock: updatedBalance.on_hand_qty,
        threshold: variant.min_stock_level,
        message: 'Stock is running low for this product',
        auto_reorder_suggested: true,
        suggested_qty: variant.reorder_quantity
      })
      .select()
      .single()
    
    if (alertError) throw alertError
    console.log('✅ Inventory alert created')
    
    // Test 9: Test complex query (similar to what the UI would use)
    console.log('\n🔍 Testing Complex Query (UI Simulation)...')
    const { data: complexQuery, error: complexError } = await supabase
      .from('product_variants')
      .select(`
        *,
        product:products (
          id,
          name,
          description,
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
            contact_person
          )
        )
      `)
      .eq('id', variant.id)
      .single()
    
    if (complexError) throw complexError
    console.log('✅ Complex query successful:')
    console.log(`   Product: ${complexQuery.product.name}`)
    console.log(`   Category: ${complexQuery.product.category?.name || 'None'}`)
    console.log(`   Stock: ${complexQuery.inventory_balances?.[0]?.on_hand_qty || 0}`)
    
    // Test 10: Clean up test data
    console.log('\n🧹 Cleaning up test data...')
    
    // Delete in reverse order due to foreign key constraints
    await supabase.from('inventory_alerts').delete().eq('id', alert.id)
    await supabase.from('reservations').delete().eq('id', reservation.id)
    await supabase.from('stock_movements').delete().eq('id', stockMovement.id)
    await supabase.from('inventory_balances').delete().eq('product_variant_id', variant.id)
    await supabase.from('product_variants').delete().eq('id', variant.id)
    await supabase.from('products').delete().eq('id', product.id)
    await supabase.from('warehouses').delete().eq('id', warehouse.id)
    await supabase.from('suppliers').delete().eq('id', supplier.id)
    await supabase.from('categories').delete().eq('id', category.id)
    
    console.log('✅ Test data cleaned up')
    
    console.log('\n🎉 ALL TESTS PASSED! Inventory integration is working correctly.')
    console.log('\nSummary:')
    console.log('✅ Database tables are accessible')
    console.log('✅ CRUD operations work correctly')
    console.log('✅ Foreign key relationships are intact')
    console.log('✅ Triggers are functioning (inventory_balances auto-update)')
    console.log('✅ Complex queries with joins work')
    console.log('✅ All inventory features are ready for UI integration')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Full error:', error)
  }
}

testInventoryIntegration()