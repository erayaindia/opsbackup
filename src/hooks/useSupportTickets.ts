import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import type { SupportTicket } from './useEnhancedSupportTickets';

type SupportTicketInsert = Database['public']['Tables']['support_tickets']['Insert'];

export function useSupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setTickets(data || []);
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

  // Update ticket status
  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;

      // Update local state
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId 
            ? { ...ticket, status, updated_at: new Date().toISOString() }
            : ticket
        )
      );

      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    }
  };

  // Create new ticket
  const createTicket = async (ticketData: SupportTicketInsert) => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert([ticketData])
        .select()
        .single();

      if (error) throw error;

      setTickets(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Ticket created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
      return null;
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    fetchTickets();

    // Set up real-time subscription
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
          console.log('Real-time update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setTickets(prev => [payload.new as SupportTicket, ...prev]);
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
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate ticket counts
  const ticketCounts = {
    all: tickets.length,
    new: tickets.filter(t => t.status === 'new').length,
    open: tickets.filter(t => t.status === 'open').length,
    waiting: tickets.filter(t => t.status === 'waiting').length,
    solved: tickets.filter(t => t.status === 'solved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  };

  return {
    tickets,
    loading,
    ticketCounts,
    updateTicketStatus,
    createTicket,
    refetch: fetchTickets,
  };
}