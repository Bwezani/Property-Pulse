'use client';
import type { ColumnDef } from '@tanstack/react-table';
import type { MaintenanceExpense } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { deleteMaintenanceExpenseAction } from '../actions';

export const maintenanceColumns: ColumnDef<MaintenanceExpense>[] = [
  {
    accessorKey: 'expenseType',
    header: 'Type',
  },
  {
    accessorKey: 'description',
    header: 'Description',
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
      const handleDelete = async () => {
        try {
          await deleteMaintenanceExpenseAction(expense.propertyId, expense.id);
          toast({
            title: 'Expense Deleted',
            description: `"${expense.description}" has been removed.`,
          });
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not delete the expense.',
          });
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
