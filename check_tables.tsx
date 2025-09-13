import React, { useEffect } from 'react';
import { supabase } from './src/integrations/supabase/client';

export default function DatabaseChecker() {
  useEffect(() => {
    async function checkTables() {
      console.log('🔍 Checking inventory tables...');

      // Check product_variants
      try {
        const { data, error } = await supabase
          .from('product_variants')
          .select('*')
          .limit(1);

        if (error) {
          console.log('❌ product_variants:', error.message);
        } else {
          console.log('✅ product_variants exists:', data ? Object.keys(data[0] || {}) : 'No data');
        }
      } catch (e) {
        console.log('❌ product_variants error:', e);
      }

      // Check inventory_balances
      try {
        const { data, error } = await supabase
          .from('inventory_balances')
          .select('*')
          .limit(1);

        if (error) {
          console.log('❌ inventory_balances:', error.message);
        } else {
          console.log('✅ inventory_balances exists:', data ? Object.keys(data[0] || {}) : 'No data');
        }
      } catch (e) {
        console.log('❌ inventory_balances error:', e);
      }

      // Check stock_movements
      try {
        const { data, error } = await supabase
          .from('stock_movements')
          .select('*')
          .limit(1);

        if (error) {
          console.log('❌ stock_movements:', error.message);
        } else {
          console.log('✅ stock_movements exists:', data ? Object.keys(data[0] || {}) : 'No data');
        }
      } catch (e) {
        console.log('❌ stock_movements error:', e);
      }
    }

    checkTables();
  }, []);

  return (
    <div>
      <h1>Database Structure Check</h1>
      <p>Check the console for results</p>
    </div>
  );
}