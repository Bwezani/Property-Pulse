'use client';
import type { ColumnDef } from '@tanstack/react-table';
import type { ConstructionExpense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { formatCurrency } from '@/lib/utils';

export const constructionColumns: ColumnDef<ConstructionExpense>[] = [
  {
    accessorKey: 'itemName',
    header: 'Item',
  },
  {
    accessorKey: 'quantity',
    header: 'Quantity',
  },
  {
    accessorKey: 'unitPrice',
    header: 'Unit Price',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('unitPrice'));
      return <div className="font-medium">{formatCurrency(amount)}</div>;
    },
  },
  {
    accessorKey: 'totalPrice',
    header: 'Total Price',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('totalPrice'));
      return <div className="font-medium">{formatCurrency(amount)}</div>;
    },
  },
  {
    accessorKey: 'vendor',
    header: 'Vendor',
  },
  {
    accessorKey: 'purchaseDate',
    header: 'Date',
    cell: ({ row }) => new Date(row.getValue('purchaseDate')).toLocaleDateString(),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const expense = row.original;
      const { firestore: db, user } = useFirebase();

      const handleDelete = async () => {
        if (!db || !user) return;
        try {
          const docRef = doc(db, 'users', user.uid, 'construction_expenses', expense.id);
          await deleteDoc(docRef);
          toast({ title: 'Expense Deleted', description: 'Record removed successfully.' });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not delete record.' });
        }
      };

      return (
        <div className="flex justify-end">
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
