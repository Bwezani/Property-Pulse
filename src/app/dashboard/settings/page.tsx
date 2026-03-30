'use client';

import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Settings2, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const COLLECTIONS_TO_WIPE = [
  'finished_properties',
  'construction_properties', // True schema
  'under_construction_properties', // Purge any orphaned data from early testing
  'rental_incomes',
  'construction_expenses',
  'maintenance_expenses',
  'vendors',
  'construction_budget',
  'maintenance_budget'
];

export default function SettingsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isWiping, setIsWiping] = useState(false);

  const handleWipeDatabase = async () => {
    if (confirmText !== 'WIPE') {
      toast({ variant: 'destructive', title: 'Invalid Confirmation', description: 'You must type exactly "WIPE".' });
      return;
    }

    if (!db || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Not authenticated.' });
      return;
    }

    setIsWiping(true);
    let totalDeleted = 0;

    try {
      // Loop through all data collections for this user
      for (const colName of COLLECTIONS_TO_WIPE) {
        const colRef = collection(db, 'users', user.uid, colName);
        const snapshot = await getDocs(colRef);
        
        // Delete all docs in this collection
        const deletePromises = snapshot.docs.map((document) => deleteDoc(document.ref));
        await Promise.all(deletePromises);
        
        totalDeleted += snapshot.docs.length;
      }

      toast({ 
        title: 'Clean Slate Generated', 
        description: `Successfully wiped ${totalDeleted} records across the entire database.`,
        duration: 8000
      });
      setIsOpen(false);
      setConfirmText('');

      // Refresh page to clear local state caches
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to completely wipe the database. Check console logs.' });
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground flex items-center gap-3">
            <Settings2 className="h-8 w-8 text-primary" />
            System Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your account and developer configurations.
          </p>
        </div>
      </header>

      <div className="space-y-4">
        {/* DANGER ZONE CARD */}
        <Card className="border-red-500/30 overflow-hidden relative shadow-md">
          <div className="absolute top-0 left-0 w-2 h-full bg-red-600 z-10" />
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Developer Danger Zone
            </CardTitle>
            <CardDescription className="text-zinc-500 max-w-2xl">
              This section contains destructive actions meant for development and testing. Wiping your data will clear all properties, income logs, and expenses, restoring your account to a clean slate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isOpen} onOpenChange={(val) => {
              setIsOpen(val);
              if (!val) setConfirmText('');
            }}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Wipe Database
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-red-600 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Destructive Action Warning
                  </DialogTitle>
                  <DialogDescription>
                    You are about to permanently delete all property, tenant, financial, and budget data associated with your account. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-400 text-sm rounded-md border border-red-200 dark:border-red-900/50">
                    <strong>Please type "WIPE" below to confirm:</strong>
                  </div>
                  <Input 
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="WIPE"
                    className="border-red-200 focus-visible:ring-red-500 uppercase"
                  />
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isWiping}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleWipeDatabase}
                    disabled={confirmText !== 'WIPE' || isWiping}
                    className="bg-red-600 hover:bg-red-700 w-[140px]"
                  >
                    {isWiping ? 'Erasing...' : 'Confirm Wipe'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="mt-6 p-4 bg-muted/40 border border-border rounded-lg flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Perfect for Initial Testing</p>
                <p className="text-muted-foreground mt-1">
                  Use this tool to easily clean up test properties and trial data before you start logging live building operations. Once your app goes strictly "live", it is recommended to remove this settings page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
