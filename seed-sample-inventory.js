import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ggzxyacfllkelnflcugz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnenh5YWNmbGxrZWxuZmxjdWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTg4NzMsImV4cCI6MjA3MTg5NDg3M30.DsVJAjEV4QRyAzU0Wln5LWgFEL3e8-Bck0lvJbnxZb0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedSampleInventory() {
  try {
    console.log('🌱 Seeding sample inventory data...\n')
    
    // 1. Create categories
    console.log('📁 Creating categories...')
    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .insert([
        { name: 'Rings' },
        { name: 'Necklaces' },
        { name: 'Earrings' },
        { name: 'Bracelets' },
        { name: 'Raw Materials' },
        { name: 'Packaging' }
      ])
      .select()
    
    if (categoryError) throw categoryError
    console.log(`✅ Created ${categories.length} categories`)
    
    // 2. Create suppliers
    console.log('\n🏪 Creating suppliers...')
    const { data: activeStatus } = await supabase
      .from('statuses')
      .select('id')
      .eq('domain', 'supplier')
      .eq('code', 'active')
      .single()
    
    const { data: suppliers, error: supplierError } = await supabase
      .from('suppliers')
      .insert([
        {
          name: 'Mumbai Gold Suppliers',
          code: 'MGS001',
          contact_person: 'Rahul Shah',
          email: 'rahul@mumbaigold.com',
          phone: '+91-9876543210',
          address: { 
            street: 'Zaveri Bazaar', 
            city: 'Mumbai', 
            state: 'Maharashtra', 
            country: 'India', 
            postal_code: '400002' 
          },
          payment_terms: '30 days',
          lead_time_days: 7,
          minimum_order_value: 50000,
          rating: 4.5,
          status_id: activeStatus?.id
        },
        {
          name: 'Diamond House International',
          code: 'DHI002',
          contact_person: 'Priya Patel',
          email: 'priya@diamondhouse.com',
          phone: '+91-9123456789',
          address: { 
            street: 'Diamond District', 
            city: 'Surat', 
            state: 'Gujarat', 
            country: 'India', 
            postal_code: '395003' 
          },
          payment_terms: '15 days',
          lead_time_days: 14,
          minimum_order_value: 100000,
          rating: 4.8,
          status_id: activeStatus?.id
        }
      ])
      .select()
    
    if (supplierError) throw supplierError
    console.log(`✅ Created ${suppliers.length} suppliers`)
    
    // 3. Create warehouse
    console.log('\n🏢 Creating warehouse...')
    const { data: warehouse, error: warehouseError } = await supabase
      .from('warehouses')
      .insert({
        name: 'Main Mumbai Warehouse',
        code: 'MMW001',
        address: {
          street: '15, Industrial Estate',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          postal_code: '400063'
        },
        capacity: 50000,
        active: true
      })
      .select()
      .single()
    
    if (warehouseError) throw warehouseError
    console.log('✅ Created warehouse:', warehouse.name)
    
    // 4. Create locations in warehouse
    console.log('\n📍 Creating warehouse locations...')
    const { data: locations, error: locationError } = await supabase
      .from('locations')
      .insert([
        { warehouse_id: warehouse.id, code: 'A-ZONE', type: 'zone' },
        { warehouse_id: warehouse.id, code: 'B-ZONE', type: 'zone' },
        { warehouse_id: warehouse.id, code: 'PACK-ZONE', type: 'zone' }
      ])
      .select()
    
    if (locationError) throw locationError
    console.log(`✅ Created ${locations.length} locations`)
    
    // 5. Create products and variants
    console.log('\n💍 Creating products and variants...')
    const { data: productStatus } = await supabase
      .from('statuses')
      .select('id')
      .eq('domain', 'product')
      .eq('code', 'active')
      .single()
    
    const productsToCreate = [
      {
        name: 'Classic Gold Ring',
        description: 'Beautiful 18K gold ring with traditional design',
        category_id: categories.find(c => c.name === 'Rings')?.id,
        variants: [{
          sku: 'RING-GOLD-18K-001',
          barcode: '1234567890001',
          cost: 3500.00,
          price: 4900.00,
          min_stock_level: 5,
          reorder_point: 8,
          reorder_quantity: 25,
          attributes: { metal: '18K Gold', size: '7', weight: '6.5g' }
        }]
      },
      {
        name: 'Diamond Solitaire Ring',
        description: 'Elegant solitaire ring with premium diamond',
        category_id: categories.find(c => c.name === 'Rings')?.id,
        variants: [{
          sku: 'RING-DIA-SOL-001',
          barcode: '1234567890002',
          cost: 25000.00,
          price: 35000.00,
          min_stock_level: 2,
          reorder_point: 3,
          reorder_quantity: 10,
          attributes: { metal: 'Platinum', diamond: '0.5 Carat', size: '6' }
        }]
      },
      {
        name: 'Pearl Necklace Set',
        description: 'Classic pearl necklace with matching earrings',
        category_id: categories.find(c => c.name === 'Necklaces')?.id,
        variants: [{
          sku: 'NECK-PEARL-SET-001',
          barcode: '1234567890003',
          cost: 8000.00,
          price: 12000.00,
          min_stock_level: 3,
          reorder_point: 5,
          reorder_quantity: 15,
          attributes: { type: 'Fresh Water Pearl', length: '18 inches' }
        }]
      },
      {
        name: 'Gold Chain Bracelet',
        description: 'Delicate gold chain bracelet for daily wear',
        category_id: categories.find(c => c.name === 'Bracelets')?.id,
        variants: [{
          sku: 'BRAC-GOLD-CHAIN-001',
          barcode: '1234567890004',
          cost: 2800.00,
          price: 3900.00,
          min_stock_level: 8,
          reorder_point: 12,
          reorder_quantity: 30,
          attributes: { metal: '22K Gold', length: '7.5 inches', weight: '4.2g' }
        }]
      },
      {
        name: 'Silver Stud Earrings',
        description: 'Simple and elegant silver stud earrings',
        category_id: categories.find(c => c.name === 'Earrings')?.id,
        variants: [{
          sku: 'EAR-SILVER-STUD-001',
          barcode: '1234567890005',
          cost: 800.00,
          price: 1200.00,
          min_stock_level: 15,
          reorder_point: 20,
          reorder_quantity: 50,
          attributes: { metal: 'Sterling Silver', style: 'Stud', backing: 'Push Back' }
        }]
      }
    ]
    
    const createdProducts = []
    const createdVariants = []
    
    for (const productData of productsToCreate) {
      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          description: productData.description,
          category_id: productData.category_id,
          status_id: productStatus?.id
        })
        .select()
        .single()
      
      if (productError) throw productError
      createdProducts.push(product)
      
      // Create variants for this product
      for (const variantData of productData.variants) {
        const { data: variant, error: variantError } = await supabase
          .from('product_variants')
          .insert({
            product_id: product.id,
            ...variantData
          })
          .select()
          .single()
        
        if (variantError) throw variantError
        createdVariants.push(variant)
      }
    }
    
    console.log(`✅ Created ${createdProducts.length} products with ${createdVariants.length} variants`)
    
    // 6. Add initial stock
    console.log('\n📦 Adding initial stock...')
    const { data: movementType } = await supabase
      .from('movement_types')
      .select('id')
      .eq('code', 'IN')
      .single()
    
    const stockData = [
      { variant_sku: 'RING-GOLD-18K-001', qty: 15, cost: 3500.00 },
      { variant_sku: 'RING-DIA-SOL-001', qty: 5, cost: 25000.00 },
      { variant_sku: 'NECK-PEARL-SET-001', qty: 8, cost: 8000.00 },
      { variant_sku: 'BRAC-GOLD-CHAIN-001', qty: 25, cost: 2800.00 },
      { variant_sku: 'EAR-SILVER-STUD-001', qty: 40, cost: 800.00 }
    ]
    
    for (const stock of stockData) {
      const variant = createdVariants.find(v => v.sku === stock.variant_sku)
      if (variant) {
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            product_variant_id: variant.id,
            warehouse_id: warehouse.id,
            to_location_id: locations[0].id, // Use first location
            movement_type_id: movementType?.id,
            qty: stock.qty,
            unit_cost: stock.cost,
            reference_type: 'initial_stock',
            reference_id: 'INITIAL-001',
            notes: 'Initial stock for new inventory system'
          })
        
        if (movementError) throw movementError
      }
    }
    
    console.log('✅ Added initial stock for all products')
    
    // 7. Create some supplier pricing
    console.log('\n💰 Creating supplier pricing...')
    const pricingData = [
      { supplier_name: 'Mumbai Gold Suppliers', variant_sku: 'RING-GOLD-18K-001', cost: 3400.00, moq: 10 },
      { supplier_name: 'Mumbai Gold Suppliers', variant_sku: 'BRAC-GOLD-CHAIN-001', cost: 2700.00, moq: 20 },
      { supplier_name: 'Diamond House International', variant_sku: 'RING-DIA-SOL-001', cost: 24500.00, moq: 5 },
      { supplier_name: 'Diamond House International', variant_sku: 'NECK-PEARL-SET-001', cost: 7800.00, moq: 5 }
    ]
    
    for (const pricing of pricingData) {
      const supplier = suppliers.find(s => s.name === pricing.supplier_name)
      const variant = createdVariants.find(v => v.sku === pricing.variant_sku)
      
      if (supplier && variant) {
        const { error: pricingError } = await supabase
          .from('supplier_prices')
          .insert({
            supplier_id: supplier.id,
            product_variant_id: variant.id,
            moq: pricing.moq,
            tier_qty: pricing.moq,
            unit_cost: pricing.cost,
            currency: 'INR',
            valid_from: new Date().toISOString().split('T')[0]
          })
        
        if (pricingError) throw pricingError
      }
    }
    
    console.log('✅ Created supplier pricing')
    
    // 8. Check final inventory balances
    console.log('\n📊 Checking inventory balances...')
    const { data: balances, error: balanceError } = await supabase
      .from('inventory_balances')
      .select(`
        on_hand_qty,
        available_qty,
        allocated_qty,
        product_variants (
          sku,
          product:products (name)
        )
      `)
    
    if (balanceError) throw balanceError
    
    console.log('📈 Current Inventory Summary:')
    balances.forEach(balance => {
      console.log(`   ${balance.product_variants.product.name} (${balance.product_variants.sku}): ${balance.on_hand_qty} on hand, ${balance.available_qty} available`)
    })
    
    console.log('\n🎉 Sample inventory data seeded successfully!')
    console.log('\nYou can now:')
    console.log('• View products in the inventory page')
    console.log('• Add/edit products')
    console.log('• Record stock movements')
    console.log('• Track inventory levels')
    console.log('• Manage suppliers and categories')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
    console.error('Full error:', error)
  }
}

seedSampleInventory()