import { supabase } from '@/integrations/supabase/client';
import { ContentCreator, CreatorProject, CreatorPayment } from '@/types/contentCreator';

export class CreatorService {
  static async createCreator(creatorData: Omit<ContentCreator, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentCreator> {
    try {
      // Insert main creator record
      const { data: creatorRecord, error: creatorError } = await supabase
        .from('creators')
        .insert({
          name: creatorData.name,
          role: creatorData.role,
          status: creatorData.status,
          capacity: creatorData.capacity,
          rating: creatorData.rating,
          profile_picture: creatorData.profilePicture,
          bio: creatorData.bio,
          location: creatorData.location,
          timezone: creatorData.timezone,
          email: creatorData.email,
          phone: creatorData.phone,
          whatsapp: creatorData.whatsapp,
          social_links: creatorData.socialLinks,
          preferred_communication: creatorData.preferredCommunication,
          avg_turnaround_days: creatorData.performance.avgTurnaroundDays,
          quality_history: creatorData.performance.qualityHistory,
          total_projects: creatorData.performance.totalProjects,
          completion_rate: creatorData.performance.completionRate,
          avg_rating: creatorData.performance.avgRating,
          engagement_metrics: creatorData.performance.engagementMetrics,
          base_rate: creatorData.rateCard.baseRate,
          currency: creatorData.rateCard.currency,
          rate_unit: creatorData.rateCard.unit,
          payment_cycle: creatorData.paymentCycle,
          advance_percentage: creatorData.advancePercentage,
          strengths: creatorData.strengths,
          weaknesses: creatorData.weaknesses,
          special_requirements: creatorData.specialRequirements,
          internal_notes: creatorData.internalNotes,
          created_by: creatorData.createdBy,
        })
        .select()
        .single();

      if (creatorError) {
        console.error('Error creating creator:', creatorError);
        throw new Error(`Failed to create creator: ${creatorError.message}`);
      }

      // Insert current projects if any
      if (creatorData.currentProjects.length > 0) {
        const projectsToInsert = creatorData.currentProjects.map(project => ({
          creator_id: creatorRecord.id,
          name: project.name,
          status: project.status,
          start_date: project.startDate.toISOString().split('T')[0],
          end_date: project.endDate?.toISOString().split('T')[0],
          rating: project.rating,
          notes: project.notes,
          is_current: true,
        }));

        const { error: projectsError } = await supabase
          .from('creator_projects')
          .insert(projectsToInsert);

        if (projectsError) {
          console.error('Error creating current projects:', projectsError);
        }
      }

      // Insert past projects if any
      if (creatorData.pastProjects.length > 0) {
        const pastProjectsToInsert = creatorData.pastProjects.map(project => ({
          creator_id: creatorRecord.id,
          name: project.name,
          status: project.status,
          start_date: project.startDate.toISOString().split('T')[0],
          end_date: project.endDate?.toISOString().split('T')[0],
          rating: project.rating,
          notes: project.notes,
          is_current: false,
        }));

        const { error: pastProjectsError } = await supabase
          .from('creator_projects')
          .insert(pastProjectsToInsert);

        if (pastProjectsError) {
          console.error('Error creating past projects:', pastProjectsError);
        }
      }

      // Insert payments if any
      if (creatorData.payments.length > 0) {
        const paymentsToInsert = creatorData.payments.map(payment => ({
          creator_id: creatorRecord.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          due_date: payment.dueDate.toISOString().split('T')[0],
          paid_date: payment.paidDate?.toISOString().split('T')[0],
          invoice_url: payment.invoiceUrl,
          description: payment.description,
        }));

        const { error: paymentsError } = await supabase
          .from('creator_payments')
          .insert(paymentsToInsert);

        if (paymentsError) {
          console.error('Error creating payments:', paymentsError);
        }
      }

      // Return the created creator with all related data
      return this.mapRecordToCreator(creatorRecord, [], [], []);
    } catch (error) {
      console.error('Error in createCreator:', error);
      throw error;
    }
  }

  static async getAllCreators(): Promise<ContentCreator[]> {
    try {
      // Fetch creators
      const { data: creators, error: creatorsError } = await supabase
        .from('creators')
        .select('*')
        .order('created_at', { ascending: false });

      if (creatorsError) {
        console.error('Error fetching creators:', creatorsError);
        throw new Error(`Failed to fetch creators: ${creatorsError.message}`);
      }

      // Fetch all projects
      const { data: projects, error: projectsError } = await supabase
        .from('creator_projects')
        .select('*');

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
      }

      // Fetch all payments
      const { data: payments, error: paymentsError } = await supabase
        .from('creator_payments')
        .select('*');

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
      }

      // Map creators with their related data
      return creators.map(creator => {
        const creatorProjects = projects?.filter(p => p.creator_id === creator.id) || [];
        const creatorPayments = payments?.filter(p => p.creator_id === creator.id) || [];
        
        const currentProjects = creatorProjects.filter(p => p.is_current);
        const pastProjects = creatorProjects.filter(p => !p.is_current);
        
        return this.mapRecordToCreator(creator, currentProjects, pastProjects, creatorPayments);
      });
    } catch (error) {
      console.error('Error in getAllCreators:', error);
      throw error;
    }
  }

  static async updateCreator(id: string, updates: Partial<ContentCreator>): Promise<ContentCreator> {
    try {
      const { data: updatedCreator, error } = await supabase
        .from('creators')
        .update({
          name: updates.name,
          role: updates.role,
          status: updates.status,
          capacity: updates.capacity,
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
          internal_notes: updates.internalNotes,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating creator:', error);
        throw new Error(`Failed to update creator: ${error.message}`);
      }

      // Fetch related data for the updated creator
      const [projectsResult, paymentsResult] = await Promise.all([
        supabase.from('creator_projects').select('*').eq('creator_id', id),
        supabase.from('creator_payments').select('*').eq('creator_id', id),
      ]);

      const projects = projectsResult.data || [];
      const payments = paymentsResult.data || [];
      
      const currentProjects = projects.filter(p => p.is_current);
      const pastProjects = projects.filter(p => !p.is_current);

      return this.mapRecordToCreator(updatedCreator, currentProjects, pastProjects, payments);
    } catch (error) {
      console.error('Error in updateCreator:', error);
      throw error;
    }
  }

  static async deleteCreator(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('creators')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting creator:', error);
        throw new Error(`Failed to delete creator: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteCreator:', error);
      throw error;
    }
  }

  private static mapRecordToCreator(
    record: any,
    currentProjects: any[],
    pastProjects: any[],
    payments: any[]
  ): ContentCreator {
    return {
      id: record.id,
      name: record.name,
      role: record.role,
      status: record.status,
      capacity: record.capacity,
      rating: record.rating,
      profilePicture: record.profile_picture,
      bio: record.bio,
      location: record.location,
      timezone: record.timezone,
      email: record.email,
      phone: record.phone,
      whatsapp: record.whatsapp,
      socialLinks: record.social_links || {},
      preferredCommunication: record.preferred_communication,
      currentProjects: currentProjects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        startDate: new Date(p.start_date),
        endDate: p.end_date ? new Date(p.end_date) : undefined,
        rating: p.rating,
        notes: p.notes,
      })),
      pastProjects: pastProjects.map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        startDate: new Date(p.start_date),
        endDate: p.end_date ? new Date(p.end_date) : undefined,
        rating: p.rating,
        notes: p.notes,
      })),
      performance: {
        avgTurnaroundDays: record.avg_turnaround_days || 0,
        qualityHistory: record.quality_history || [],
        totalProjects: record.total_projects || 0,
        completionRate: record.completion_rate || 0,
        avgRating: record.avg_rating || 0,
        engagementMetrics: record.engagement_metrics || {},
      },
      rateCard: {
        baseRate: record.base_rate,
        currency: record.currency,
        unit: record.rate_unit,
      },
      paymentCycle: record.payment_cycle,
      advancePercentage: record.advance_percentage,
      payments: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        dueDate: new Date(p.due_date),
        paidDate: p.paid_date ? new Date(p.paid_date) : undefined,
        invoiceUrl: p.invoice_url,
        description: p.description,
      })),
      strengths: record.strengths || [],
      weaknesses: record.weaknesses || [],
      specialRequirements: record.special_requirements || [],
      internalNotes: record.internal_notes || '',
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      createdBy: record.created_by,
    };
  }
}