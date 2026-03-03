
'use client';
import type { ColumnDef } from '@tanstack/react-table';
import type { MaintenanceExpense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useFirebase } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export const maintenanceColumns: ColumnDef<MaintenanceExpense>[] = [
  {
    accessorKey: 'expenseType',
    header: 'Type',
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
        const expense = row.original;
        const unitNames = (expense as any).unitNames as string[] | undefined;
        return (
            <div className="flex flex-col gap-1">
                <span className="font-medium">{expense.description}</span>
                {unitNames && unitNames.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {unitNames.map(name => (
                            <Badge key={name} variant="outline" className="text-[10px] py-0 h-4 px-1.5">
                                {name}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        )
    }
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ZMW',
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => new Date(row.getValue('date')).toLocaleDateString(),
  },
  {
    accessorKey: 'vendor',
    header: 'Vendor',
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
          const docRef = doc(db, 'users', user.uid, 'maintenance_expenses', expense.id);
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
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      );
    },
  },
];
