import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { SupportTicket } from "@/hooks/useEnhancedSupportTickets";
import type { Database } from '@/integrations/supabase/types';

type SupportTicketInsert = Database['public']['Tables']['support_tickets']['Insert'];

interface SupportTicketDialogProps {
  onCreateTicket: (ticketData: SupportTicketInsert) => Promise<SupportTicket | null>;
}

export function SupportTicketDialog({ onCreateTicket }: SupportTicketDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    variant: '',
    color: '',
    main_photo: '',
    back_engraving_type: '',
    back_engraving_value: '',
    packer: '',
    main_photo_status: '',
    polaroid_count: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const ticketData = {
      ...formData,
      polaroid_count: formData.polaroid_count || null,
      status: 'Pending' as const,
    };

    const result = await onCreateTicket(ticketData);
    if (result) {
      setOpen(false);
      setFormData({
        sku: '',
        variant: '',
        color: '',
        main_photo: '',
        back_engraving_type: '',
        back_engraving_value: '',
        packer: '',
        main_photo_status: '',
        polaroid_count: 0,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Support Ticket</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="Product SKU"
              />
            </div>
            <div>
              <Label htmlFor="variant">Variant</Label>
              <Input
                id="variant"
                value={formData.variant}
                onChange={(e) => setFormData(prev => ({ ...prev, variant: e.target.value }))}
                placeholder="Product variant"
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                placeholder="Product color"
              />
            </div>
            <div>
              <Label htmlFor="packer">Packer</Label>
              <Input
                id="packer"
                value={formData.packer}
                onChange={(e) => setFormData(prev => ({ ...prev, packer: e.target.value }))}
                placeholder="Assigned packer"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="main_photo">Main Photo URL</Label>
            <Input
              id="main_photo"
              value={formData.main_photo}
              onChange={(e) => setFormData(prev => ({ ...prev, main_photo: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label htmlFor="main_photo_status">Main Photo Status</Label>
            <Select 
              value={formData.main_photo_status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, main_photo_status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select photo status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="missing">Missing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="back_engraving_type">Engraving Type</Label>
              <Input
                id="back_engraving_type"
                value={formData.back_engraving_type}
                onChange={(e) => setFormData(prev => ({ ...prev, back_engraving_type: e.target.value }))}
                placeholder="e.g., Text, Logo"
              />
            </div>
            <div>
              <Label htmlFor="polaroid_count">Polaroid Count</Label>
              <Input
                id="polaroid_count"
                type="number"
                min="0"
                value={formData.polaroid_count}
                onChange={(e) => setFormData(prev => ({ ...prev, polaroid_count: parseInt(e.target.value) || 0 }))}
                placeholder="Number of polaroids"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="back_engraving_value">Engraving Value</Label>
            <Textarea
              id="back_engraving_value"
              value={formData.back_engraving_value}
              onChange={(e) => setFormData(prev => ({ ...prev, back_engraving_value: e.target.value }))}
              placeholder="Engraving text or description"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Ticket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}