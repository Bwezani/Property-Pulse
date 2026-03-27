'use client';

import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DeleteTransactionActionProps {
  collectionName: string;
  docId: string;
}

export function DeleteTransactionAction({
  collectionName,
  docId,
}: DeleteTransactionActionProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const db = useFirestore();
  const { user } = useUser();

  const handleDelete = async () => {
    if (!db || !user) return;
    
    // Quick confirmation
    if (!confirm('Are you sure you want to delete this record?')) return;

    setIsDeleting(true);
    const docRef = doc(db, 'users', user.uid, collectionName, docId);

    try {
      await deleteDoc(docRef);
      toast({ title: 'Record Deleted', description: 'The record has been cleared.' });
    } catch (error) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
        requestResourceData: {}
      }));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isDeleting} className="text-destructive hover:bg-destructive/10">
      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}
