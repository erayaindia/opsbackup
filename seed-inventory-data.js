import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ggzxyacfllkelnflcugz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnenh5YWNmbGxrZWxuZmxjdWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTg4NzMsImV4cCI6MjA3MTg5NDg3M30.DsVJAjEV4QRyAzU0Wln5LWgFEL3e8-Bck0lvJbnxZb0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedInventoryData() {
  try {
    console.log('🌱 Starting inventory data seeding...\n')

    // 1. Check if warehouses exist, if not create one
    console.log('🏢 Checking for warehouses...')
    const { data: existingWarehouses } = await supabase
      .from('warehouses')
      .select('*')
      .limit(1)

    let warehouse
    if (!existingWarehouses || existingWarehouses.length === 0) {
      console.log('Creating default warehouse...')
      const { data: warehouseData, error: warehouseError } = await supabase
        .from('warehouses')
        .insert({
          name: 'Main Warehouse',
          code: 'MAIN-WH-001',
          address: {
            street: '123 Business Street',
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
      warehouse = warehouseData
      console.log('✅ Default warehouse created:', warehouse.name)
    } else {
      warehouse = existingWarehouses[0]
      console.log('✅ Using existing warehouse:', warehouse.name)
    }

    // 2. Check if categories exist, if not create some
    console.log('\n📁 Checking for categories...')
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('*')
      .limit(1)

    let category
    if (!existingCategories || existingCategories.length === 0) {
      console.log('Creating sample categories...')
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .insert([
          { name: 'Electronics' },
          { name: 'Clothing' },
          { name: 'Home & Garden' },
          { name: 'Books' },
          { name: 'Sports & Outdoors' }
        ])
        .select()

      if (categoryError) throw categoryError
      category = categoryData[0]
      console.log('✅ Sample categories created')
    } else {
      category = existingCategories[0]
      console.log('✅ Using existing categories')
    }

    // 3. Check if suppliers exist, if not create some
    console.log('\n🏪 Checking for suppliers...')
    const { data: existingSuppliers } = await supabase
      .from('suppliers')
      .select('*')
      .limit(1)

    let supplier
    if (!existingSuppliers || existingSuppliers.length === 0) {
      // Get active status for supplier
      const { data: supplierStatus } = await supabase
        .from('statuses')
        .select('id')
        .eq('domain', 'supplier')
        .eq('code', 'active')
        .single()

      console.log('Creating sample supplier...')
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .insert({
          name: 'ABC Trading Co.',
          code: 'ABC-001',
          contact_person: 'John Smith',
          email: 'john@abctrading.com',
          phone: '+91-9876543210',
          address: {
            street: '456 Supplier Street',
            city: 'Delhi',
            state: 'Delhi',
            country: 'India',
            postal_code: '110001'
          },
          lead_time_days: 5,
          payment_terms: 'Net 30',
          status_id: supplierStatus?.id
        })
        .select()
        .single()

      if (supplierError) throw supplierError
      supplier = supplierData
      console.log('✅ Sample supplier created:', supplier.name)
    } else {
      supplier = existingSuppliers[0]
      console.log('✅ Using existing supplier:', supplier.name)
    }

    // 4. Create sample products if none exist
    console.log('\n💍 Checking for products...')
    const { data: existingProducts } = await supabase
      .from('products')
      .select('*')
      .limit(1)

    if (!existingProducts || existingProducts.length === 0) {
      // Get active status for product
      const { data: productStatus } = await supabase
        .from('statuses')
        .select('id')
        .eq('domain', 'product')
        .eq('code', 'active')
        .single()

      console.log('Creating sample products...')
      
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: 'Sample Electronic Device',
          description: 'A sample electronic device for inventory testing',
          category_id: category.id,
          status_id: productStatus?.id
        })
        .select()
        .single()

      if (productError) throw productError

      // Create product variants
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .insert([
          {
            product_id: product.id,
            sku: 'ELEC-001-BLK',
            barcode: '1234567890123',
            cost: 100.00,
            price: 150.00,
            min_stock_level: 10,
            reorder_point: 20,
            reorder_quantity: 100,
            attributes: {
              color: 'Black',
              size: 'Medium'
            }
          },
          {
            product_id: product.id,
            sku: 'ELEC-001-WHT',
            barcode: '1234567890124',
            cost: 100.00,
            price: 150.00,
            min_stock_level: 5,
            reorder_point: 15,
            reorder_quantity: 75,
            attributes: {
              color: 'White',
              size: 'Medium'
            }
          }
        ])
        .select()

      if (variantError) throw variantError
      
      console.log('✅ Sample products and variants created')

      // Add initial stock for the variants
      console.log('\n📦 Adding initial stock...')
      const { data: movementType } = await supabase
        .from('movement_types')
        .select('id')
        .eq('code', 'IN')
        .single()

      for (const v of variant) {
        await supabase
          .from('stock_movements')
          .insert({
            product_variant_id: v.id,
            warehouse_id: warehouse.id,
            movement_type_id: movementType.id,
            qty: 50, // Initial stock of 50 units
            unit_cost: v.cost,
            reference_type: 'initial_stock',
            reference_id: 'INIT-001',
            notes: 'Initial stock setup'
          })
      }
      
      console.log('✅ Initial stock movements recorded')
    } else {
      console.log('✅ Products already exist, skipping creation')
    }

    console.log('\n🎉 Inventory seeding completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Open your inventory page at /product/inventory')
    console.log('2. You should see the seeded data')
    console.log('3. Try adding new products, updating stock, etc.')

  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
    console.error('Full error:', error)
  }
}

seedInventoryData()