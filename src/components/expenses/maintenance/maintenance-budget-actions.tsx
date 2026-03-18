'use client';

import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import type { MaintenanceBudgetItem } from '@/lib/types';
import { UpdateMaintenanceBudgetActualForm } from './update-actual-form';

export function MaintenanceBudgetActions({
    item,
}: {
    item: MaintenanceBudgetItem;
}) {
    const { firestore, user } = useFirebase();

    const handleDelete = async () => {
        if (!firestore || !user) return;

        try {
            const docRef = doc(
                firestore,
                'users',
                user.uid,
                'maintenance_budget_items',
                item.id
            );

            await deleteDoc(docRef);

            toast({
                title: 'Item Deleted',
                description: 'Budget item removed.',
            });
        } catch (error) {
            console.error(error);

            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not delete item.',
            });
        }
    };

    return (
        <div className="flex justify-end gap-2">
            <UpdateMaintenanceBudgetActualForm
                propertyId={item.propertyId}
                item={item}
            />

            <Button
                variant="ghost"
                size="xs"
                className="text-destructive"
                onClick={handleDelete}
            >
                Delete
            </Button>
        </div>
    );
}