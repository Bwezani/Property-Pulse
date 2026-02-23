'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { MaintenanceBudgetItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { UpdateMaintenanceBudgetActualForm } from './update-actual-form';
import { deleteMaintenanceBudgetItemAction } from '../actions';

export const maintenanceBudgetColumns: ColumnDef<MaintenanceBudgetItem>[] = [
  {
    accessorKey: 'itemName',
    header: 'Item',
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
      const handleDelete = async () => {
        try {
          await deleteMaintenanceBudgetItemAction(item.propertyId, item.id);
          toast({
            title: 'Item Deleted',
            description: `"${item.itemName}" has been removed from the budget.`,
          });
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not delete the budget item.',
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
    },
  },
];

