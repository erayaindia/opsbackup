import React, { useState, useEffect } from 'react';
import { ContentLayout } from '@/components/ContentLayout';
import { CreatorTable } from '@/components/content-creator/CreatorTable';
import { CreatorDrawer } from '@/components/content-creator/CreatorDrawer';
import { AddCreatorModal } from '@/components/content-creator/AddCreatorModal';
import { EditCreatorModal } from '@/components/content-creator/EditCreatorModal';
import { ContentCreator } from '@/types/contentCreator';
import { CreatorService } from '@/services/creatorService';


// Debug helper function - call this in browser console to see data state
(window as any).debugCreatorData = async () => {
  const dbStatus = await CreatorService.checkDatabaseStatus();
  const backendCreators = await CreatorService.getAllCreators();
  
  console.log('🔍 CREATOR DATA DEBUG:', {
    database: {
      count: dbStatus.creatorCount,
      creators: backendCreators.map(c => ({ id: c.id, name: c.name }))
    },
    recommendations: {
      issue: 'You have data in database that differs from UI display',
      solutions: [
        '1. Refresh page to see only database data',
        '2. Add creators via "Add Creator" button to save to database'
      ]
    }
  });
};

export default function ContentCreator() {
  const [creators, setCreators] = useState<ContentCreator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<ContentCreator | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCreator, setEditingCreator] = useState<ContentCreator | null>(null);
  const [loading, setLoading] = useState(false);

  // Load creators from backend
  useEffect(() => {
    loadCreators();
  }, []);

  const loadCreators = async () => {
    try {
      console.log('🔄 Loading creators from backend...');
      setLoading(true);

      // First, check database status for debugging
      const dbStatus = await CreatorService.checkDatabaseStatus();
      console.log('🗄️ Database Status:', dbStatus);

      const backendCreators = await CreatorService.getAllCreators();
      console.log('✅ Loaded creators:', { 
        count: backendCreators.length, 
        creators: backendCreators.map(c => ({ id: c.id, name: c.name, source: 'database' })),
        usingDatabase: backendCreators.length > 0 || dbStatus.creatorCount === 0
      });

      // Debug: Show comparison between database and mock data
      console.log('🔍 Data Source Analysis:', {
        databaseCreators: backendCreators.map(c => ({ id: c.id, name: c.name })),
        databaseCount: backendCreators.length,
        usingMockFallback: false,
        databaseIds: backendCreators.map(c => c.id)
      });

      // Always use database data
      console.log('🗄️ Using database data');
      setCreators(backendCreators);
    } catch (error) {
      console.error('❌ Failed to load creators from backend:', error);
      // If there's an error connecting to backend, show empty state
      console.log('🔄 Database connection failed, showing empty state');
      setCreators([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatorSelect = (creator: ContentCreator) => {
    setSelectedCreator(creator);
    setDrawerOpen(true);
  };

  const handleAddCreator = () => {
    setAddModalOpen(true);
  };

  const handleEditCreator = (creator: ContentCreator) => {
    setEditingCreator(creator);
    setEditModalOpen(true);
  };

  const handleCreateCreator = async (newCreatorData: Omit<ContentCreator, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('🔄 Creating new creator:', { name: newCreatorData.name, email: newCreatorData.email, shippingAddress: newCreatorData.shippingAddress });
      const createdCreator = await CreatorService.createCreator(newCreatorData);
      console.log('✅ Creator created successfully:', createdCreator);
      setCreators(prev => [createdCreator, ...prev]);
      setAddModalOpen(false);
      alert('✅ Creator created successfully!');
    } catch (error) {
      console.error('❌ Failed to create creator:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      if (errorMessage.includes('Authentication required')) {
        alert('❌ Authentication Error: Please refresh the page and make sure you are logged in.');
      } else if (errorMessage.includes('already exists')) {
        alert('⚠️ Error: A creator with this email address already exists. Please use a different email.');
      } else {
        alert(`❌ Failed to create creator: ${errorMessage}`);
      }
    }
  };

  const handleUpdateCreator = async (updatedCreator: ContentCreator) => {
    try {
      // Try to update in backend first
      const updated = await CreatorService.updateCreator(updatedCreator.id, updatedCreator);
      setCreators(prev => prev.map(creator => 
        creator.id === updated.id ? updated : creator
      ));
      setSelectedCreator(updated);
    } catch (error) {
      console.error('Failed to update creator in backend:', error);
      
      // Fallback: Update locally
      setCreators(prev => prev.map(creator => 
        creator.id === updatedCreator.id ? updatedCreator : creator
      ));
      setSelectedCreator(updatedCreator);
    }
  };

  const handleDeleteCreator = async (creatorId: string) => {
    try {
      console.log('🗑️ Handling delete request for creator ID:', creatorId);
      
      // Debug: Show what creators are currently in local state
      const localCreator = creators.find(c => c.id === creatorId);
      console.log('📋 Local creator to delete:', localCreator);
      
      // Check database status before attempting delete
      const dbStatus = await CreatorService.checkDatabaseStatus();
      console.log('🗄️ Database status before delete:', dbStatus);
      
      
      // Try database deletion first, but handle the "not found" case gracefully for mock data
      let databaseDeleteSuccess = false;
      try {
        await CreatorService.deleteCreator(creatorId);
        databaseDeleteSuccess = true;
        console.log('✅ Creator deleted successfully from database');
      } catch (dbError) {
        console.log('⚠️ Database deletion failed, checking if this is mock data:', dbError);
        
        // If database deletion failed, re-throw the error
        throw dbError;
      }
      
      // Update local state since either database deletion succeeded or it's mock data
      setCreators(prev => prev.filter(creator => creator.id !== creatorId));
      
      // Close drawer if the deleted creator was selected
      if (selectedCreator?.id === creatorId) {
        setSelectedCreator(null);
        setDrawerOpen(false);
      }
      
      // Show success message
      alert('✅ Creator deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete creator:', error);
      
      // Show specific error to user with actionable information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      alert(`❌ Failed to delete creator: ${errorMessage}\n\nPlease check the console for more details.`);
      
      // Don't update local state if database deletion failed (for non-mock creators)
      throw error;
    }
  };

  if (loading) {
    return (
      <ContentLayout>
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading creators...</p>
          </div>
        </div>
      </ContentLayout>
    );
  }

  return (
    <ContentLayout>
      <div className="h-full overflow-hidden p-6">
        <CreatorTable
          creators={creators}
          onCreatorSelect={handleCreatorSelect}
          onAddCreator={handleAddCreator}
          onEditCreator={handleEditCreator}
        />

        <CreatorDrawer
          creator={selectedCreator}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onUpdate={handleUpdateCreator}
          onDelete={handleDeleteCreator}
        />

        <AddCreatorModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          onCreateCreator={handleCreateCreator}
        />

        <EditCreatorModal
          creator={editingCreator}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onUpdateCreator={handleUpdateCreator}
        />
      </div>
    </ContentLayout>
  );
}