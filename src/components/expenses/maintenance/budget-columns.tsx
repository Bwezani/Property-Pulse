'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { MaintenanceBudgetItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { formatCurrency } from '@/lib/utils';
import { MaintenanceBudgetActions } from './maintenance-budget-actions';

export const maintenanceBudgetColumns: ColumnDef<MaintenanceBudgetItem>[] = [
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
            return <div className="font-medium">{formatCurrency(amount)}</div>;
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
      return <div className="font-medium">{formatCurrency(amount)}</div>;
    },
  },
  {
    id: 'actions',
    header: '',
      cell: ({ row }) => {
          const item = row.original;

          return (
              <MaintenanceBudgetActions item={item} />
          );
      },
  },
];
