import { supabase } from '@/integrations/supabase/client';
import { ContentCreator, CreatorProject, CreatorPayment } from '@/types/contentCreator';

export class CreatorService {
  static async createCreator(creatorData: Omit<ContentCreator, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentCreator> {
    try {
      console.log('🔍 CreatorService.createCreator called with data:', {
        name: creatorData.name,
        email: creatorData.email,
        shippingAddress: creatorData.shippingAddress,
        hasShippingAddress: !!creatorData.shippingAddress
      });
      // Convert current and past projects to the format expected by the database
      const currentProjectsJson = creatorData.currentProjects?.map(project => ({
        id: project.id,
        name: project.name,
        status: project.status,
        start_date: project.startDate.toISOString().split('T')[0],
        end_date: project.endDate?.toISOString().split('T')[0] || null,
        rating: project.rating || null,
        notes: project.notes || null
      })) || [];

      const pastProjectsJson = creatorData.pastProjects?.map(project => ({
        id: project.id,
        name: project.name,
        status: project.status,
        start_date: project.startDate.toISOString().split('T')[0],
        end_date: project.endDate?.toISOString().split('T')[0] || null,
        rating: project.rating || null,
        notes: project.notes || null
      })) || [];

      const paymentsJson = creatorData.payments?.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        due_date: payment.dueDate.toISOString().split('T')[0],
        paid_date: payment.paidDate?.toISOString().split('T')[0] || null,
        invoice_url: payment.invoiceUrl || null,
        description: payment.description
      })) || [];

      // Insert creator record with JSONB fields
      const insertData = {
          name: creatorData.name,
          role: creatorData.role,
          status: creatorData.status,
          availability: creatorData.availability,
          rating: creatorData.rating,
          profile_picture: creatorData.profilePicture || null,
          bio: creatorData.bio || null,
          location: creatorData.location,
          timezone: creatorData.timezone,
          email: creatorData.email,
          phone: creatorData.phone || null,
          whatsapp: creatorData.whatsapp || null,
          social_links: creatorData.socialLinks || {},
          preferred_communication: creatorData.preferredCommunication,
          shipping_address: creatorData.shippingAddress || null,
          current_projects: currentProjectsJson,
          past_projects: pastProjectsJson,
          avg_turnaround_days: creatorData.performance?.avgTurnaroundDays || 0,
          quality_history: creatorData.performance?.qualityHistory || [],
          total_projects: creatorData.performance?.totalProjects || 0,
          completion_rate: creatorData.performance?.completionRate || 0,
          avg_rating: creatorData.performance?.avgRating || 0,
          engagement_metrics: creatorData.performance?.engagementMetrics || {},
          base_rate: creatorData.rateCard?.baseRate || 0,
          currency: creatorData.rateCard?.currency || 'INR',
          rate_unit: creatorData.rateCard?.unit || 'per hour',
          payment_cycle: creatorData.paymentCycle || 'Per Project',
          advance_percentage: creatorData.advancePercentage || null,
          payments: paymentsJson,
          strengths: creatorData.strengths || [],
          weaknesses: creatorData.weaknesses || [],
          special_requirements: creatorData.specialRequirements || [],
          internal_notes: creatorData.internalNotes || '',
          created_by: null // Will be set by auth context if needed
      };

      console.log('📤 Inserting creator data:', insertData);
      
      const { data: creatorRecord, error: creatorError } = await supabase
        .from('content_creators')
        .insert(insertData)
        .select()
        .single();

      if (creatorError) {
        console.error('❌ Error creating creator:', creatorError);
        console.error('❌ Insert data that failed:', insertData);
        throw new Error(`Failed to create creator: ${creatorError.message}`);
      }

      console.log('✅ Creator created successfully:', creatorRecord);

      return this.mapRecordToCreator(creatorRecord);
    } catch (error) {
      console.error('Error in createCreator:', error);
      throw error;
    }
  }

  static async getAllCreators(): Promise<ContentCreator[]> {
    try {
      console.log('🔍 Fetching all creators from database...');
      
      const { data: creators, error: creatorsError } = await supabase
        .from('content_creators')
        .select('*')
        .order('created_at', { ascending: false });

      if (creatorsError) {
        console.error('❌ Error fetching creators:', {
          error: creatorsError,
          message: creatorsError.message,
          details: creatorsError.details,
          hint: creatorsError.hint,
          code: creatorsError.code
        });
        throw new Error(`Failed to fetch creators: ${creatorsError.message}`);
      }

      console.log('📥 Fetched creators from database:', {
        count: creators?.length || 0,
        creators: creators?.map(c => ({ id: c.id, name: c.name, email: c.email })) || [],
        sampleRawRecord: creators?.[0] || 'no data',
        allIds: creators?.map(c => c.id) || []
      });

      if (!creators || creators.length === 0) {
        console.log('📭 Database is empty, returning empty array');
        return [];
      }

      return creators.map(creator => this.mapRecordToCreator(creator));
    } catch (error) {
      console.error('❌ Error in getAllCreators:', error);
      throw error;
    }
  }

  static async updateCreator(id: string, updates: Partial<ContentCreator>): Promise<ContentCreator> {
    try {
      // Convert projects and payments if they exist in updates
      const updateData: any = {
        name: updates.name,
        role: updates.role,
        status: updates.status,
        availability: updates.availability,
        rating: updates.rating,
        profile_picture: updates.profilePicture,
        bio: updates.bio,
        location: updates.location,
        timezone: updates.timezone,
        email: updates.email,
        phone: updates.phone,
        whatsapp: updates.whatsapp,
        social_links: updates.socialLinks,
        preferred_communication: updates.preferredCommunication,
        shipping_address: updates.shippingAddress,
        avg_turnaround_days: updates.performance?.avgTurnaroundDays,
        quality_history: updates.performance?.qualityHistory,
        total_projects: updates.performance?.totalProjects,
        completion_rate: updates.performance?.completionRate,
        avg_rating: updates.performance?.avgRating,
        engagement_metrics: updates.performance?.engagementMetrics,
        base_rate: updates.rateCard?.baseRate,
        currency: updates.rateCard?.currency,
        rate_unit: updates.rateCard?.unit,
        payment_cycle: updates.paymentCycle,
        advance_percentage: updates.advancePercentage,
        strengths: updates.strengths,
        weaknesses: updates.weaknesses,
        special_requirements: updates.specialRequirements,
        internal_notes: updates.internalNotes
      };

      if (updates.currentProjects) {
        updateData.current_projects = updates.currentProjects.map(project => ({
          id: project.id,
          name: project.name,
          status: project.status,
          start_date: project.startDate.toISOString().split('T')[0],
          end_date: project.endDate?.toISOString().split('T')[0] || null,
          rating: project.rating || null,
          notes: project.notes || null
        }));
      }

      if (updates.pastProjects) {
        updateData.past_projects = updates.pastProjects.map(project => ({
          id: project.id,
          name: project.name,
          status: project.status,
          start_date: project.startDate.toISOString().split('T')[0],
          end_date: project.endDate?.toISOString().split('T')[0] || null,
          rating: project.rating || null,
          notes: project.notes || null
        }));
      }

      if (updates.payments) {
        updateData.payments = updates.payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          due_date: payment.dueDate.toISOString().split('T')[0],
          paid_date: payment.paidDate?.toISOString().split('T')[0] || null,
          invoice_url: payment.invoiceUrl || null,
          description: payment.description
        }));
      }

      // Filter out undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const { data: updatedCreator, error } = await supabase
        .from('content_creators')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating creator:', error);
        throw new Error(`Failed to update creator: ${error.message}`);
      }

      return this.mapRecordToCreator(updatedCreator);
    } catch (error) {
      console.error('Error in updateCreator:', error);
      throw error;
    }
  }

  static async deleteCreator(id: string): Promise<void> {
    try {
      console.log('🗑️  Attempting to delete creator with ID:', id);
      
      const { data, error } = await supabase
        .from('content_creators')
        .delete()
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ Database error deleting creator:', {
          error: error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Failed to delete creator from database: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.warn('⚠️  No creator was deleted - creator may not exist in database with ID:', id);
        throw new Error('Creator not found in database or already deleted');
      }

      console.log('✅ Creator deleted successfully from database:', { id, deletedData: data });
    } catch (error) {
      console.error('❌ Error in deleteCreator service:', error);
      throw error;
    }
  }

  // Debug helper method to check database state
  static async checkDatabaseStatus(): Promise<{ tableExists: boolean; creatorCount: number; sampleIds: string[] }> {
    try {
      const { data, error, count } = await supabase
        .from('content_creators')
        .select('id', { count: 'exact' })
        .limit(5);

      if (error) {
        console.error('Database check error:', error);
        return { tableExists: false, creatorCount: 0, sampleIds: [] };
      }

      return {
        tableExists: true,
        creatorCount: count || 0,
        sampleIds: data?.map(creator => creator.id) || []
      };
    } catch (error) {
      console.error('Database status check failed:', error);
      return { tableExists: false, creatorCount: 0, sampleIds: [] };
    }
  }

  private static mapRecordToCreator(record: any): ContentCreator {
    // Helper function to safely parse dates
    const parseDate = (dateStr: string): Date => {
      return dateStr ? new Date(dateStr) : new Date();
    };

    // Helper function to map projects from JSONB to ContentCreator format
    const mapProjects = (projects: any[]): CreatorProject[] => {
      if (!Array.isArray(projects)) return [];
      return projects.map(p => ({
        id: p.id || '',
        name: p.name || '',
        status: p.status || 'Active',
        startDate: p.start_date ? new Date(p.start_date) : new Date(),
        endDate: p.end_date ? new Date(p.end_date) : undefined,
        rating: p.rating || undefined,
        notes: p.notes || undefined,
      }));
    };

    // Helper function to map payments from JSONB to ContentCreator format
    const mapPayments = (payments: any[]): CreatorPayment[] => {
      if (!Array.isArray(payments)) return [];
      return payments.map(p => ({
        id: p.id || '',
        amount: p.amount || 0,
        currency: p.currency || 'INR',
        status: p.status || 'Pending',
        dueDate: p.due_date ? new Date(p.due_date) : new Date(),
        paidDate: p.paid_date ? new Date(p.paid_date) : undefined,
        invoiceUrl: p.invoice_url || undefined,
        description: p.description || '',
      }));
    };

    return {
      id: record.id,
      name: record.name || '',
      role: record.role || 'Designer',
      status: record.status || 'Active',
      availability: record.availability || 'Free',
      rating: record.rating || 0,
      profilePicture: record.profile_picture || undefined,
      bio: record.bio || undefined,
      location: record.location || '',
      timezone: record.timezone || '',
      email: record.email || '',
      phone: record.phone || undefined,
      whatsapp: record.whatsapp || undefined,
      socialLinks: record.social_links || {},
      preferredCommunication: record.preferred_communication || 'Email',
      shippingAddress: record.shipping_address || undefined,
      currentProjects: mapProjects(record.current_projects || []),
      pastProjects: mapProjects(record.past_projects || []),
      performance: {
        avgTurnaroundDays: record.avg_turnaround_days || 0,
        qualityHistory: record.quality_history || [],
        totalProjects: record.total_projects || 0,
        completionRate: record.completion_rate || 0,
        avgRating: record.avg_rating || 0,
        engagementMetrics: record.engagement_metrics || {},
      },
      rateCard: {
        baseRate: record.base_rate || 0,
        currency: record.currency || 'INR',
        unit: record.rate_unit || 'per hour',
      },
      paymentCycle: record.payment_cycle || 'Per Project',
      advancePercentage: record.advance_percentage || undefined,
      payments: mapPayments(record.payments || []),
      strengths: record.strengths || [],
      weaknesses: record.weaknesses || [],
      specialRequirements: record.special_requirements || [],
      internalNotes: record.internal_notes || '',
      createdAt: parseDate(record.created_at),
      updatedAt: parseDate(record.updated_at),
      createdBy: record.created_by || 'admin',
    };
  }
}