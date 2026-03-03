
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { ConstructionBudgetItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { UpdateConstructionBudgetActualForm } from './update-actual-form';
import { useFirebase } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export const constructionBudgetColumns: ColumnDef<ConstructionBudgetItem>[] = [
  {
    accessorKey: 'itemName',
    header: 'Item',
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const category = row.getValue('category') as string;
  
      return (
        <div className="text-sm font-medium">
          {category || (
            <span className="text-xs text-muted-foreground">
              Uncategorized
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'estimatedCost',
    header: 'Estimated Cost',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('estimatedCost'));
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ZMW',
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'actualCost',
    header: 'Actual Cost',
    cell: ({ row }) => {
      const value = row.getValue('actualCost');
      const amount = typeof value === 'number' ? value : parseFloat(String(value));
      if (!amount) {
        return <span className="text-xs text-muted-foreground">Not set</span>;
      }
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ZMW',
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const item = row.original;
      const { firestore: db, user } = useFirebase();

      const handleDelete = async () => {
        if (!db || !user) return;
        try {
          const docRef = doc(db, 'users', user.uid, 'construction_budget_items', item.id);
          await deleteDoc(docRef);
          toast({ title: 'Item Deleted', description: 'Budget item removed.' });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not delete item.' });
        }
      };

      return (
        <div className="flex justify-end gap-2">
          <UpdateConstructionBudgetActualForm
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
    },
  },
];
