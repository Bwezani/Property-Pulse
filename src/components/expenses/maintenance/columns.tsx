'use client';
import type { ColumnDef } from '@tanstack/react-table';
import type { MaintenanceExpense } from '@/lib/types';

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
        currency: 'USD',
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
];
