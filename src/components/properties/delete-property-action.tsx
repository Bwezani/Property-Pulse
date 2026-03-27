'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Property } from '@/lib/types';

interface DeletePropertyButtonProps {
  property: Property;
  compact?: boolean;
}

export function DeletePropertyButton({ property, compact = false }: DeletePropertyButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();

  const handleDelete = async () => {
    if (!db || !user) return;
    setIsDeleting(true);

    const collectionName = property.type === 'Finished' ? 'finished_properties' : 'construction_properties';
    const docRef = doc(db, 'users', user.uid, collectionName, property.id);

    try {
      await deleteDoc(docRef);
      toast({
        title: 'Property Deleted',
        description: `${property.name} has been removed from your portfolio.`,
      });
      setOpen(false);
      // Let the caching catch up then redirect to overview
      setTimeout(() => {
        router.push('/dashboard/all-properties');
      }, 500);
    } catch (error) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
        requestResourceData: {}
      }));
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size={compact ? "icon" : "sm"} className={compact ? "h-8 w-8" : "h-8"}>
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className={compact ? "h-4 w-4" : "mr-2 h-4 w-4"} />}
          {!compact && "Delete"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{property.name}</strong> from your profile. Make sure you don't need its historical data as this cannot be undone. Associated expenses and income logs will remain in the database but will no longer be visible under this property.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault(); // Prevent modal from closing immediately
              handleDelete();
            }}
            className="bg-destructive hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Yes, delete property"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
