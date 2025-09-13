// Quick database structure check
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ggzxyacfllkelnflcugz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnenhmeWFjZmxsa2VsbmZsY3VneiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzI2MDQxNTc5LCJleHAiOjIwNDE2MTc1Nzl9.I_qb8w8zQ1DcPPbN6j9j29xSNRjIgGWk8nxqZXBRm6w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
    console.log('🔍 Checking database structure...\n');

    // Check product_variants table
    try {
        console.log('📋 PRODUCT_VARIANTS TABLE:');
        const { data: variants, error: variantsError } = await supabase
            .from('product_variants')
            .select('*')
            .limit(1);

        if (variantsError) {
            console.log('❌ product_variants table not found or error:', variantsError.message);
        } else {
            console.log('✅ product_variants table exists');
            if (variants && variants.length > 0) {
                console.log('Sample structure:', Object.keys(variants[0]));
            }
        }
    } catch (e) {
        console.log('❌ Error checking product_variants:', e.message);
    }

    // Check inventory_balances table
    try {
        console.log('\n📊 INVENTORY_BALANCES TABLE:');
        const { data: balances, error: balancesError } = await supabase
            .from('inventory_balances')
            .select('*')
            .limit(1);

        if (balancesError) {
            console.log('❌ inventory_balances table not found or error:', balancesError.message);
        } else {
            console.log('✅ inventory_balances table exists');
            if (balances && balances.length > 0) {
                console.log('Sample structure:', Object.keys(balances[0]));
            }
        }
    } catch (e) {
        console.log('❌ Error checking inventory_balances:', e.message);
    }

    // Check stock_movements table
    try {
        console.log('\n📦 STOCK_MOVEMENTS TABLE:');
        const { data: movements, error: movementsError } = await supabase
            .from('stock_movements')
            .select('*')
            .limit(1);

        if (movementsError) {
            console.log('❌ stock_movements table not found or error:', movementsError.message);
        } else {
            console.log('✅ stock_movements table exists');
            if (movements && movements.length > 0) {
                console.log('Sample structure:', Object.keys(movements[0]));
            }
        }
    } catch (e) {
        console.log('❌ Error checking stock_movements:', e.message);
    }

    // Check supporting tables
    const supportingTables = ['warehouses', 'suppliers', 'movement_types', 'categories'];

    for (const tableName of supportingTables) {
        try {
            console.log(`\n🏗️ ${tableName.toUpperCase()} TABLE:`);
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);

            if (error) {
                console.log(`❌ ${tableName} table not found or error:`, error.message);
            } else {
                console.log(`✅ ${tableName} table exists`);
                if (data && data.length > 0) {
                    console.log('Sample structure:', Object.keys(data[0]));
                }
            }
        } catch (e) {
            console.log(`❌ Error checking ${tableName}:`, e.message);
        }
    }

    console.log('\n✨ Database structure check complete!');
}

checkDatabaseStructure();