import { supabase } from '@/integrations/supabase/client';

// Types for content planning
export interface ContentItem {
  id?: string;
  title: string;
  status: 'draft' | 'in_progress' | 'review' | 'published' | 'archived';
  platform: string;
  thumbnail_url?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  metadata?: Record<string, unknown>;
}

export interface ContentHook {
  id?: string;
  content_id: string;
  hook_type: 'question' | 'statistic' | 'story' | 'bold_statement';
  text: string;
  order_index: number;
}

export interface ContentScript {
  id?: string;
  content_id: string;
  section_type: 'introduction' | 'body' | 'conclusion' | 'call_to_action';
  content: string;
  plain_text?: string;
  order_index: number;
}

export interface ShotListItem {
  id?: string;
  content_id: string;
  shot_number: number;
  shot_type?: string;
  description?: string;
  duration?: number;
  location?: string;
  equipment?: string[];
  notes?: string;
  status?: 'planned' | 'shot' | 'editing' | 'completed';
  order_index?: number;
  created_at?: string;
  updated_at?: string;
  action?: string;
  camera?: string;
  background?: string;
  overlays?: string; // Keep for backward compatibility
  assignee_id?: string;
  references?: string[];
  completed?: boolean;
  // NEW FIELDS
  props?: string[];
  talent?: string;
  lighting_notes?: string;
}

export interface ContentBodySection {
  id?: string;
  content_id: string;
  section_title?: string;
  bullet_points: string[];
  details?: string;
  order_index: number;
}

export interface ContentTeamAssignment {
  id?: string;
  content_id: string;
  user_id: string;
  role: string;
  assigned_at?: string;
}

// Content Service Class
export class ContentService {
  // ============= Content Items =============
  static async createContent(content: ContentItem) {
    const { data: userData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Authentication error:', authError);
      throw new Error('User not authenticated');
    }

    if (!userData?.user) {
      throw new Error('No user found. Please log in first.');
    }

    console.log('Creating content for user:', userData.user.id);
    console.log('Content data to insert:', {
      ...content,
      created_by: userData.user.id
    });
    
    const { data, error } = await supabase
      .from('content_items')
      .insert({
        ...content,
        created_by: userData.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error when creating content:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      throw error;
    }
    
    console.log('✅ Content item created in database:', data);
    return data;
  }

  // Test function to check basic database access
  static async testDatabaseConnection() {
    console.log('🧪 Testing database connection...');
    try {
      const { data, error } = await supabase
        .from('content_items')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Database connection test failed:', error);
        return false;
      }
      
      console.log('✅ Database connection test passed');
      return true;
    } catch (err) {
      console.error('❌ Database connection test error:', err);
      return false;
    }
  }

  // Test planning data table access
  static async testPlanningDataTable() {
    console.log('🧪 Testing content_planning_data table...');
    try {
      // First check if user is authenticated
      const { data: userData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !userData?.user) {
        console.error('❌ Not authenticated for planning data test');
        return { success: false, error: 'Not authenticated' };
      }

      // Try to query the table
      const { data, error } = await supabase
        .from('content_planning_data')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('❌ Planning data table test failed:', error);
        return { success: false, error };
      }
      
      console.log('✅ Planning data table access successful');
      return { success: true, data };
    } catch (err) {
      console.error('❌ Planning data table test error:', err);
      return { success: false, error: err };
    }
  }

  // Get planning data for a specific content item
  static async getPlanningData(contentId: string) {
    console.log('🔍 Getting planning data for content ID:', contentId);
    
    const { data, error } = await supabase
      .from('content_planning_data')
      .select('*')
      .eq('content_id', contentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - return empty planning data
        console.log('ℹ️ No planning data found for content ID:', contentId);
        return {
          concept: '',
          hook: '',
          body: '',
          cta: ''
        };
      }
      console.error('❌ Error getting planning data:', error);
      throw error;
    }

    console.log('✅ Planning data retrieved:', data);
    return {
      concept: data.concept || '',
      hook: data.hook || '',
      body: data.body || '',
      cta: data.cta || ''
    };
  }

  static async getContentList() {
    console.log('📋 Getting content list from database...');
    const { data, error } = await supabase
      .from('content_items')
      .select(`
        *,
        content_team_assignments (
          user_id,
          role
        ),
        content_hooks (
          hook_type,
          text,
          order_index
        ),
        content_scripts (
          section_type,
          content,
          order_index
        ),
        shot_list (
          shot_number,
          description,
          duration,
          status,
          order_index
        ),
        content_attachments (
          file_name,
          file_path,
          file_type,
          file_size
        ),
        content_tags (
          tag
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getContentById(id: string) {
    const { data, error } = await supabase
      .from('content_items')
      .select(`
        *,
        content_hooks (*),
        content_scripts (*),
        shot_list (*),
        content_body_sections (*),
        content_team_assignments (*),
        content_tags (*),
        content_comments (*),
        content_planning_data (*),
        content_editing_data (*),
        content_deliverables (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // Sort nested arrays by order_index
    if (data) {
      data.content_hooks?.sort((a: any, b: any) => a.order_index - b.order_index);
      data.content_scripts?.sort((a: any, b: any) => a.order_index - b.order_index);
      data.shot_list?.sort((a: any, b: any) => a.order_index - b.order_index);
      data.content_body_sections?.sort((a: any, b: any) => a.order_index - b.order_index);
    }
    
    return data;
  }

  static async updateContent(id: string, updates: Partial<ContentItem>) {
    const { data, error } = await supabase
      .from('content_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteContent(id: string) {
    const { error } = await supabase
      .from('content_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ============= Content Hooks =============
  static async saveHooks(contentId: string, hooks: Omit<ContentHook, 'content_id'>[]) {
    // Delete existing hooks
    await supabase
      .from('content_hooks')
      .delete()
      .eq('content_id', contentId);

    // Insert new hooks
    if (hooks.length > 0) {
      const hooksWithContentId = hooks.map((hook, index) => ({
        ...hook,
        content_id: contentId,
        order_index: index
      }));

      const { error } = await supabase
        .from('content_hooks')
        .insert(hooksWithContentId);

      if (error) throw error;
    }
  }

  // ============= Content Scripts =============
  static async saveScripts(contentId: string, scripts: Omit<ContentScript, 'content_id'>[]) {
    // Delete existing scripts
    await supabase
      .from('content_scripts')
      .delete()
      .eq('content_id', contentId);

    // Insert new scripts
    if (scripts.length > 0) {
      const scriptsWithContentId = scripts.map((script, index) => ({
        ...script,
        content_id: contentId,
        order_index: index
      }));

      const { error } = await supabase
        .from('content_scripts')
        .insert(scriptsWithContentId);

      if (error) throw error;
    }
  }

  // ============= Shot List =============
  static async saveShotList(contentId: string, shots: Omit<ShotListItem, 'content_id'>[]) {
    console.log('💾 Saving shot list:', { contentId, shotCount: shots.length });
    console.log('📋 Shot data:', shots);

    // Delete existing shots
    await supabase
      .from('shot_list')
      .delete()
      .eq('content_id', contentId);

    // Insert new shots
    if (shots.length > 0) {
      const shotsWithContentId = shots.map((shot, index) => ({
        // Only include valid database fields, exclude any temporary frontend IDs
        shot_number: shot.shot_number || (index + 1),
        shot_type: shot.shot_type || 'medium',
        description: shot.description || '',
        duration: shot.duration,
        location: shot.location,
        equipment: shot.equipment || [],
        notes: shot.notes,
        status: shot.status || 'planned',
        camera: shot.camera,
        action: shot.action,
        background: shot.background,
        overlays: shot.overlays,
        assignee_id: shot.assignee_id,
        references: shot.references || [],
        completed: shot.completed || false,
        content_id: contentId,
        order_index: shot.order_index !== undefined ? shot.order_index : index,
        // NEW FIELDS
        props: shot.props || [],
        talent: shot.talent || '',
        lighting_notes: shot.lighting_notes || ''
      }));

      console.log('🚀 Inserting shots into database:', shotsWithContentId);
      console.log('🔍 New fields debug:', shotsWithContentId.map(shot => ({
        shot_number: shot.shot_number,
        talent: shot.talent,
        lighting_notes: shot.lighting_notes,
        props: shot.props
      })));

      const { error } = await supabase
        .from('shot_list')
        .insert(shotsWithContentId);

      if (error) {
        console.error('❌ Shot list save error:', error);
        throw error;
      }
      
      console.log('✅ Shot list saved successfully');
    }
  }

  // ============= Content Body Sections =============
  static async saveBodySections(contentId: string, sections: Omit<ContentBodySection, 'content_id'>[]) {
    // Delete existing sections
    await supabase
      .from('content_body_sections')
      .delete()
      .eq('content_id', contentId);

    // Insert new sections
    if (sections.length > 0) {
      const sectionsWithContentId = sections.map((section, index) => ({
        ...section,
        content_id: contentId,
        order_index: index
      }));

      const { error } = await supabase
        .from('content_body_sections')
        .insert(sectionsWithContentId);

      if (error) throw error;
    }
  }

  // ============= Team Assignments =============
  static async assignTeamMember(contentId: string, userId: string, role: string) {
    const { error } = await supabase
      .from('content_team_assignments')
      .upsert({
        content_id: contentId,
        user_id: userId,
        role: role
      });

    if (error) throw error;
  }

  static async removeTeamMember(contentId: string, userId: string, role: string) {
    const { error } = await supabase
      .from('content_team_assignments')
      .delete()
      .match({ content_id: contentId, user_id: userId, role: role });

    if (error) throw error;
  }

  // ============= Tags =============
  static async addTag(contentId: string, tag: string) {
    const { error } = await supabase
      .from('content_tags')
      .insert({ content_id: contentId, tag: tag });

    if (error && error.code !== '23505') throw error; // Ignore duplicate error
  }

  static async removeTag(contentId: string, tag: string) {
    const { error } = await supabase
      .from('content_tags')
      .delete()
      .match({ content_id: contentId, tag: tag });

    if (error) throw error;
  }

  // ============= Comments =============
  static async addComment(contentId: string, comment: string, parentCommentId?: string) {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('content_comments')
      .insert({
        content_id: contentId,
        user_id: userData?.user?.id,
        comment: comment,
        parent_comment_id: parentCommentId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============= Real-time Subscriptions =============
  static subscribeToContent(contentId: string, callback: (payload: any) => void) {
    const subscription = supabase
      .channel(`content:${contentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_items',
          filter: `id=eq.${contentId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_hooks',
          filter: `content_id=eq.${contentId}`
        },
        callback
      )
      .subscribe();

    return subscription;
  }

  static unsubscribe(subscription: any) {
    supabase.removeChannel(subscription);
  }

  // ============= Attachments =============
  static async saveAttachments(contentId: string, attachments: Array<{ fileName: string; filePath: string; fileType?: string; fileSize?: number }>) {
    // Delete existing attachments
    await supabase
      .from('content_attachments')
      .delete()
      .eq('content_id', contentId);

    // Insert new attachments
    if (attachments.length > 0) {
      const { data: userData } = await supabase.auth.getUser();
      const attachmentsWithContentId = attachments.map(attachment => ({
        content_id: contentId,
        file_name: attachment.fileName,
        file_path: attachment.filePath,
        file_type: attachment.fileType,
        file_size: attachment.fileSize,
        uploaded_by: userData?.user?.id
      }));

      const { error } = await supabase
        .from('content_attachments')
        .insert(attachmentsWithContentId);

      if (error) throw error;
    }
  }

  static async getAttachments(contentId: string) {
    const { data, error } = await supabase
      .from('content_attachments')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // ============= Enhanced Content Creation =============
  static async createContentWithStructuredData(contentData: {
    title: string;
    status: string;
    platform: string;
    product: string;
    priority: string;
    deadline: string;
    notesHtml: string;
    assignedTo: string;
    date?: string;
    checklist?: Array<{ id: number; text: string; completed: boolean }>;
    ideaRows?: Array<{ type: string; text: string }>;
    scriptRows?: Array<{ section: string; content: string }>;
    shotRows?: Array<{ 
      shot: string; 
      description: string; 
      duration?: number;
      shot_type?: string;
      location?: string;
      equipment?: string[];
      notes?: string;
    }>;
    attachments?: Array<{ fileName: string; filePath: string; fileType?: string; fileSize?: number }>;
    referenceLinks?: string[];
    bodyRows?: Array<{ title: string; bulletPoints: string[]; details: string }>;
    tags?: string[];
  }) {
    try {
      console.log('📝 Creating content with structured data:', {
        title: contentData.title,
        assignedTo: contentData.assignedTo,
        hasIdeaRows: !!(contentData.ideaRows && contentData.ideaRows.length),
        hasScriptRows: !!(contentData.scriptRows && contentData.scriptRows.length),
        hasShotRows: !!(contentData.shotRows && contentData.shotRows.length),
        hasAttachments: !!(contentData.attachments && contentData.attachments.length),
        hasReferenceLinks: !!(contentData.referenceLinks && contentData.referenceLinks.length),
        hasBodyRows: !!(contentData.bodyRows && contentData.bodyRows.length),
        hasChecklist: !!(contentData.checklist && contentData.checklist.length),
        date: contentData.date,
        priority: contentData.priority
      });
      
      // 1. Create main content item
      const contentItem = await this.createContent({
        title: contentData.title,
        status: contentData.status as any,
        platform: contentData.platform,
        metadata: {
          product: contentData.product,
          priority: contentData.priority,
          deadline: contentData.deadline,
          notesHtml: contentData.notesHtml,
          date: contentData.date,
          checklist: contentData.checklist,
          referenceLinks: contentData.referenceLinks
        }
      });

      if (!contentItem.id) throw new Error('Failed to create content item');

      // 2. Save structured data in parallel
      const promises = [];

      // Save team assignment (only if it's a valid UUID) with error handling
      if (contentData.assignedTo && contentData.assignedTo.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
        promises.push(
          this.assignTeamMember(contentItem.id, contentData.assignedTo, 'owner')
            .catch(error => {
              console.warn('Team assignment failed (RLS policy or permissions):', error.message);
              // Don't throw - let content creation continue without team assignment
              return null;
            })
        );
      } else if (contentData.assignedTo) {
        console.warn('Skipping team assignment - invalid UUID:', contentData.assignedTo);
      }

      // Save idea rows as content hooks
      if (contentData.ideaRows && contentData.ideaRows.length > 0) {
        const hooks = contentData.ideaRows.map((idea, index) => ({
          hook_type: idea.type || 'question',
          text: idea.text,
          order_index: index
        }));
        promises.push(
          this.saveHooks(contentItem.id, hooks)
            .catch(error => {
              console.warn('Saving hooks failed:', error.message);
              return null;
            })
        );
      }

      // Save script rows as content scripts
      if (contentData.scriptRows && contentData.scriptRows.length > 0) {
        const scripts = contentData.scriptRows.map((script, index) => ({
          section_type: script.section || 'body',
          content: script.content,
          plain_text: script.content.replace(/<[^>]*>/g, ''), // Strip HTML for search
          order_index: index
        }));
        promises.push(this.saveScripts(contentItem.id, scripts));
      }

      // Save shot rows as shot list
      if (contentData.shotRows && contentData.shotRows.length > 0) {
        const shots = contentData.shotRows.map((shot, index) => ({
          shot_number: index + 1,
          shot_type: shot.shot_type || 'medium',
          description: shot.description,
          duration: shot.duration,
          location: shot.location || null,
          equipment: shot.equipment || [],
          notes: shot.notes || null,
          status: 'planned' as any,
          order_index: index
        }));
        promises.push(this.saveShotList(contentItem.id, shots));
      }

      // Save attachments
      if (contentData.attachments && contentData.attachments.length > 0) {
        promises.push(this.saveAttachments(contentItem.id, contentData.attachments));
      }

      // Save body sections
      if (contentData.bodyRows && contentData.bodyRows.length > 0) {
        const bodySections = contentData.bodyRows.map((body, index) => ({
          section_title: body.title,
          bullet_points: body.bulletPoints,
          details: body.details,
          order_index: index
        }));
        promises.push(this.saveBodySections(contentItem.id, bodySections));
      }

      // Save reference links as tags
      if (contentData.referenceLinks && contentData.referenceLinks.length > 0) {
        for (const link of contentData.referenceLinks) {
          promises.push(this.addTag(contentItem.id, `ref:${link}`));
        }
      }

      // Save additional tags
      if (contentData.tags && contentData.tags.length > 0) {
        for (const tag of contentData.tags) {
          promises.push(this.addTag(contentItem.id, tag));
        }
      }

      console.log('✅ Content created successfully with ID:', contentItem.id);
      // Check results and log what actually got saved
      const results = await Promise.allSettled(promises);
      const savedData = {
        content_items: '✅',
        content_team_assignments: '❌',
        content_hooks: '❌',
        content_scripts: '❌',
        shot_list: '❌',
        content_attachments: '❌',
        content_tags: '❌',
        content_body_sections: '❌'
      };

      // Update status based on actual results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value !== null) {
          // Determine which operation this was based on order
          if (index === 0 && contentData.assignedTo) savedData.content_team_assignments = '✅';
          if (contentData.ideaRows?.length && result.value) savedData.content_hooks = `✅ (${contentData.ideaRows.length} items)`;
          // Add more specific tracking as needed
        }
      });

      console.log('📊 Data saved to tables:', savedData);
      
      return contentItem;
    } catch (error) {
      console.error('Error creating content with structured data:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        contentData: contentData
      });
      throw error;
    }
  }

  // ============= Batch Operations =============
  static async saveAllContentData(contentId: string, data: {
    content?: Partial<ContentItem>;
    hooks?: Omit<ContentHook, 'content_id'>[];
    bodySections?: Omit<ContentBodySection, 'content_id'>[];
  }) {
    try {
      // Update content item if provided
      if (data.content) {
        await this.updateContent(contentId, data.content);
      }

      // Save all related data in parallel
      const promises = [];
      
      if (data.hooks) {
        promises.push(this.saveHooks(contentId, data.hooks));
      }
      
      if (data.bodySections) {
        promises.push(this.saveBodySections(contentId, data.bodySections));
      }

      await Promise.all(promises);
      
      return { success: true };
    } catch (error) {
      console.error('Error saving content data:', error);
      throw error;
    }
  }

  // ============= Search =============
  static async searchContent(query: string) {
    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .or(`title.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // ============= User Management =============
  static async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, name, avatar_url, email, role')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching users from profiles:', error);
      throw error;
    }
    
    return data || [];
  }

  static async getUserById(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, name, avatar_url, email, role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
    
    return data;
  }

  // ============= Enhanced Content Management for Detail View =============
  
  // Save planning data (concept, hook, body, cta)
  static async savePlanningData(contentId: string, planningData: {
    concept: string;
    hook: string;
    body: string;
    cta: string;
  }) {
    console.log('🔄 Saving planning data for content ID:', contentId);
    console.log('📝 Planning data:', planningData);
    
    try {
      // First, check if user is authenticated
      const { data: userData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Auth error in savePlanningData:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!userData?.user) {
        throw new Error('No authenticated user found');
      }

      console.log('✅ User authenticated:', userData.user.id);

      // Try the upsert with proper conflict resolution
      const { data, error } = await supabase
        .from('content_planning_data')
        .upsert({
          content_id: contentId,
          ...planningData
        }, {
          onConflict: 'content_id'
        })
        .select();

      if (error) {
        console.error('❌ Database error in savePlanningData:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        throw error;
      }

      console.log('✅ Planning data saved successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in savePlanningData:', error);
      throw error;
    }
  }

  // ============= Migration from localStorage =============
  static async migrateFromLocalStorage() {
    try {
      // Get all localStorage keys that start with 'content_'
      const contentKeys = Object.keys(localStorage).filter(key => key.startsWith('content_'));
      
      for (const key of contentKeys) {
        const localData = localStorage.getItem(key);
        if (localData) {
          const parsedData = JSON.parse(localData);
          
          // Create content item in database
          const content = await this.createContent({
            title: parsedData.title || 'Untitled Content',
            status: 'draft',
            platform: parsedData.platform || 'YouTube',
            metadata: parsedData
          });

          if (content && content.id) {
            // Migrate related data
            if (parsedData.hookRows) {
              await this.saveHooks(content.id, parsedData.hookRows);
            }
            
            if (parsedData.scriptContent) {
              await this.saveScripts(content.id, [{
                section_type: 'body',
                content: parsedData.scriptContent,
                order_index: 0
              }]);
            }
            
            if (parsedData.shotRows) {
              await this.saveShotList(content.id, parsedData.shotRows);
            }
            
            if (parsedData.bodyRows) {
              await this.saveBodySections(content.id, parsedData.bodyRows);
            }
          }
          
          // Remove from localStorage after successful migration
          localStorage.removeItem(key);
        }
      }
      
      return { success: true, message: 'Migration completed successfully' };
    } catch (error) {
      console.error('Migration error:', error);
      return { success: false, error };
    }
  }
}