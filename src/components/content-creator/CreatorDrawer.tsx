import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Star,
  Calendar,
  DollarSign,
  FileText,
  ExternalLink,
  Plus,
  Edit,
  Zap,
  Trash2,
  Loader2,
} from 'lucide-react';
import { ContentCreator, CreatorDrawerProps } from '@/types/contentCreator';
import { EditCreatorModal } from './EditCreatorModal';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-800 border-green-200';
    case 'Onboarding': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Archived': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getAvailabilityColor = (availability: string) => {
  switch (availability) {
    case 'Free': return 'bg-green-100 text-green-800 border-green-200';
    case 'Limited': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Busy': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const CreatorDrawer: React.FC<CreatorDrawerProps> = ({
  creator,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  if (!creator) return null;

  const handleContactEmail = () => {
    window.open(`mailto:${creator.email}`, '_blank');
  };

  const handleContactWhatsApp = () => {
    if (creator.whatsapp) {
      window.open(`https://wa.me/${creator.whatsapp.replace(/[^\d]/g, '')}`, '_blank');
    }
  };

  const handleEdit = () => {
    setEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (!creator || !onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(creator.id);
      setDeleteDialogOpen(false);
      onOpenChange(false); // Close the drawer after successful delete
    } catch (error) {
      console.error('Error deleting creator:', error);
      // Keep the dialog and drawer open if delete fails
      // The error message will be shown by the parent component
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          {/* Profile Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={creator.profilePicture} alt={creator.name} />
              <AvatarFallback className="text-lg font-semibold">
                {creator.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-2xl">{creator.name}</SheetTitle>
              <SheetDescription className="text-base mt-1">
                {creator.role}
              </SheetDescription>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className={getStatusColor(creator.status)}>
                  {creator.status}
                </Badge>
                <Badge variant="outline" className={getAvailabilityColor(creator.availability)}>
                  {creator.availability}
                </Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="font-medium">{creator.rating}/10</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleContactEmail} variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            {creator.whatsapp && (
              <Button onClick={handleContactWhatsApp} variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Assign Project
            </Button>
            <Button onClick={handleEdit} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </SheetHeader>

        <Separator className="my-6" />

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-6">
            {/* Contact & Communication */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact & Communication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{creator.email}</p>
                    </div>
                  </div>
                  
                  {creator.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">{creator.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{creator.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Timezone</p>
                      <p className="text-sm text-muted-foreground">{creator.timezone}</p>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                {creator.socialLinks && Object.keys(creator.socialLinks).length > 0 && (
                  <div className="pt-4">
                    <h4 className="font-medium mb-3">Social & Portfolio</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(creator.socialLinks).map(([platform, url]) => (
                        url && (
                          <Button
                            key={platform}
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(url, '_blank')}
                            className="capitalize"
                          >
                            <ExternalLink className="h-3 w-3 mr-2" />
                            {platform}
                          </Button>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance & Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {creator.performance.avgTurnaroundDays}d
                    </div>
                    <div className="text-xs text-muted-foreground">Avg. Turnaround</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {creator.performance.totalProjects}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {creator.performance.completionRate}%
                    </div>
                    <div className="text-xs text-muted-foreground">Completion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      {creator.performance.avgRating}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg. Rating</div>
                  </div>
                </div>

                {/* Quality History */}
                {creator.performance.qualityHistory.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Recent Project Ratings</h4>
                    <div className="flex gap-2">
                      {creator.performance.qualityHistory.map((rating, index) => (
                        <div key={index} className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span>{rating}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            {/* Current Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                {creator.currentProjects.length > 0 ? (
                  <div className="space-y-3">
                    {creator.currentProjects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{project.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Started {new Date(project.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {project.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No current assignments</p>
                )}
              </CardContent>
            </Card>

            {/* Past Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project History</CardTitle>
              </CardHeader>
              <CardContent>
                {creator.pastProjects.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {creator.pastProjects.slice(0, 10).map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{project.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{new Date(project.startDate).toLocaleDateString()}</span>
                            {project.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                <span>{project.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {project.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No project history</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            {/* Rate Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rate Card</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">
                      {creator.rateCard.currency} {creator.rateCard.baseRate}
                    </div>
                    <div className="text-sm text-muted-foreground">{creator.rateCard.unit}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-medium text-foreground">
                      {creator.paymentCycle}
                    </div>
                    <div className="text-sm text-muted-foreground">Payment Cycle</div>
                  </div>
                  {creator.advancePercentage && (
                    <div className="text-center">
                      <div className="text-lg font-medium text-foreground">
                        {creator.advancePercentage}%
                      </div>
                      <div className="text-sm text-muted-foreground">Advance</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {creator.payments.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {creator.payments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">
                            {payment.currency} {payment.amount}
                          </h4>
                          <p className="text-sm text-muted-foreground">{payment.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(payment.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={
                            payment.status === 'Paid' ? 'bg-green-50 text-green-700' :
                            payment.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' :
                            payment.status === 'Overdue' ? 'bg-red-50 text-red-700' :
                            'bg-blue-50 text-blue-700'
                          }
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No payment history</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-6">
            {/* Strengths & Weaknesses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Collaboration Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Strengths */}
                <div>
                  <h4 className="font-medium mb-3 text-green-700">Strengths</h4>
                  <div className="flex flex-wrap gap-2">
                    {creator.strengths.map((strength, index) => (
                      <Badge key={index} variant="outline" className="bg-green-50 text-green-700">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Weaknesses */}
                {creator.weaknesses.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 text-orange-700">Areas for Improvement</h4>
                    <div className="flex flex-wrap gap-2">
                      {creator.weaknesses.map((weakness, index) => (
                        <Badge key={index} variant="outline" className="bg-orange-50 text-orange-700">
                          {weakness}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special Requirements */}
                {creator.specialRequirements.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 text-blue-700">Special Requirements</h4>
                    <div className="flex flex-wrap gap-2">
                      {creator.specialRequirements.map((req, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Internal Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4">
                  {creator.internalNotes ? (
                    <p className="text-sm whitespace-pre-wrap">{creator.internalNotes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No notes added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Button - Fixed at bottom */}
        <div className="sticky bottom-0 bg-background border-t pt-4 mt-6">
          <Button
            onClick={() => setDeleteDialogOpen(true)}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Creator
          </Button>
        </div>
      </SheetContent>

      {/* Edit Modal */}
      <EditCreatorModal
        creator={creator}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onUpdateCreator={onUpdate}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {creator?.name} from your creators list.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
};