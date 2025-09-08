import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Calendar, DollarSign, Plus, CreditCard, History } from 'lucide-react';
import { ContentCreator, CreatorPayment, PaymentStatus } from '@/types/contentCreator';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creator: ContentCreator | null;
  onPaymentCreate?: (payment: Omit<CreatorPayment, 'id'>) => void;
}

const PAYMENT_STATUSES: PaymentStatus[] = ['Pending', 'Paid', 'Partial', 'Overdue'];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onOpenChange,
  creator,
  onPaymentCreate,
}) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    description: '',
    dueDate: '',
    status: 'Pending' as PaymentStatus,
  });

  const handleCreatePayment = () => {
    if (!creator || !formData.amount || !formData.description || !formData.dueDate) return;

    const newPayment: Omit<CreatorPayment, 'id'> = {
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      status: formData.status,
      dueDate: new Date(formData.dueDate),
      description: formData.description,
    };

    onPaymentCreate?.(newPayment);
    setFormData({
      amount: '',
      currency: 'USD',
      description: '',
      dueDate: '',
      status: 'Pending',
    });
    onOpenChange(false);
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Partial': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalPaid = creator?.payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amount, 0) || 0;

  const totalPending = creator?.payments
    .filter(p => p.status === 'Pending' || p.status === 'Partial')
    .reduce((sum, p) => sum + p.amount, 0) || 0;

  if (!creator) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={creator.profilePicture} alt={creator.name} />
              <AvatarFallback>
                {creator.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">Payment Management</DialogTitle>
              <p className="text-muted-foreground">{creator.name} • {creator.role}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Payment Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">${totalPaid}</div>
              <div className="text-sm text-muted-foreground">Total Paid</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">${totalPending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                ${creator.rateCard.baseRate}
              </div>
              <div className="text-sm text-muted-foreground">{creator.rateCard.unit}</div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Tab Navigation */}
        <div className="flex gap-4 my-6">
          <Button
            variant={activeTab === 'new' ? 'default' : 'outline'}
            onClick={() => setActiveTab('new')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Payment
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Payment History
          </Button>
        </div>

        {/* New Payment Form */}
        {activeTab === 'new' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Create New Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: PaymentStatus) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Payment description..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePayment}>
                  Create Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        {activeTab === 'history' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {creator.payments.length > 0 ? (
                <div className="space-y-4">
                  {creator.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {payment.currency} {payment.amount.toLocaleString()}
                          </span>
                          <Badge variant="outline" className={getPaymentStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{payment.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Due: {new Date(payment.dueDate).toLocaleDateString()}</span>
                          {payment.paidDate && (
                            <span>Paid: {new Date(payment.paidDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No payment history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};