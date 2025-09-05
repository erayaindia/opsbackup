import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type SupportTicketRow = Database['public']['Tables']['support_tickets']['Row'];
type SupportTicketUpdate = Database['public']['Tables']['support_tickets']['Update'];

// Define the interface based on what we know the updated table should have
export interface SupportTicket {
  id: string;
  ticket_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  contact_channel?: string | null;
  order_id?: string | null;
  created_at: string;
  updated_at: string;
  source?: string | null;
  issue_type?: string | null;
  status: string;
  priority?: string | null;
  summary?: string | null;
  description?: string | null;
  user_agent?: string | null;
  timezone?: string | null;
  brand?: string | null;
  has_attachments?: boolean | null;
  attachment_count?: number | null;
  consent_given?: boolean | null;
  is_urgent?: boolean | null;
  // Legacy fields from original table
  back_engraving_type?: string | null;
  back_engraving_value?: string | null;
  color?: string | null;
  main_photo?: string | null;
  main_photo_status?: string | null;
  packer?: string | null;
  polaroid_count?: number | null;
  polaroids?: any | null;
  sku?: string | null;
  variant?: string | null;
}

export type TicketStatus = 'new' | 'open' | 'waiting' | 'solved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

interface UseEnhancedSupportTicketsProps {
  searchQuery?: string;
  statusFilter?: TicketStatus | 'all';
  priorityFilter?: TicketPriority | 'all';
  tabFilter?: 'all' | 'new' | 'open' | 'waiting' | 'solved';
  page?: number;
  pageSize?: number;
}

export function useEnhancedSupportTickets({
  searchQuery = '',
  statusFilter = 'all',
  priorityFilter = 'all',
  tabFilter = 'all',
  page = 1,
  pageSize = 50
}: UseEnhancedSupportTicketsProps = {}) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  // Filter and paginate tickets
  const filteredTickets = useMemo(() => {
    let filtered = tickets;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket => 
        ticket.ticket_id?.toLowerCase().includes(query) ||
        ticket.full_name?.toLowerCase().includes(query) ||
        ticket.email?.toLowerCase().includes(query) ||
        ticket.summary?.toLowerCase().includes(query) ||
        ticket.description?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    // Tab filter
    if (tabFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === tabFilter);
    }

    return filtered;
  }, [tickets, searchQuery, statusFilter, priorityFilter, tabFilter]);

  // Paginated tickets
  const paginatedTickets = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTickets.slice(startIndex, endIndex);
  }, [filteredTickets, page, pageSize]);

  // Fetch all tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      console.log('Fetching tickets from Supabase...');
      
      const { data, error, count } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      console.log('Supabase response:', { data, error, count });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} tickets`);
      setTickets(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch support tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update ticket
  const updateTicket = async (ticketId: string, updates: Partial<SupportTicket>) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;

      // Update local state
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, ...updates, updated_at: new Date().toISOString() }
            : ticket
        )
      );

      toast({
        title: "Success",
        description: "Ticket updated successfully",
      });
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      });
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    fetchTickets();

    const channel = supabase
      .channel('support_tickets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTickets(prev => [payload.new as SupportTicket, ...prev]);
            setTotalCount(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            setTickets(prev => 
              prev.map(ticket => 
                ticket.id === payload.new.id 
                  ? payload.new as SupportTicket
                  : ticket
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTickets(prev => 
              prev.filter(ticket => ticket.id !== payload.old.id)
            );
            setTotalCount(prev => prev - 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate KPIs
  const kpis = useMemo(() => {
    return {
      total: tickets.length,
      new: tickets.filter(t => t.status === 'new').length,
      open: tickets.filter(t => t.status === 'open').length,
      waiting: tickets.filter(t => t.status === 'waiting').length,
      solved: tickets.filter(t => t.status === 'solved').length,
      highPriority: tickets.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
    };
  }, [tickets]);

  return {
    tickets: paginatedTickets,
    allTickets: tickets,
    filteredTickets,
    loading,
    totalCount: filteredTickets.length,
    actualTotalCount: totalCount,
    updateTicket,
    refetch: fetchTickets,
    kpis,
    pagination: {
      page,
      pageSize,
      totalPages: Math.ceil(filteredTickets.length / pageSize),
      hasNextPage: page < Math.ceil(filteredTickets.length / pageSize),
      hasPreviousPage: page > 1,
    }
  };
}