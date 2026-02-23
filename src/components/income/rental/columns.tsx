'use client';
import type { ColumnDef } from '@tanstack/react-table';
import type { RentalIncome } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const StatusBadge = ({ status }: { status: 'Paid' | 'Pending' | 'Overdue' }) => {
  let variant: 'default' | 'secondary' | 'destructive' = 'secondary';
  if (status === 'Paid') variant = 'default';
  if (status === 'Overdue') variant = 'destructive';
  
  return (
    <Badge variant={variant}>
      {status}
    </Badge>
  );
};


export const rentalIncomeColumns: ColumnDef<RentalIncome>[] = [
    {
        accessorKey: 'tenantName',
        header: 'Tenant',
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
        accessorKey: 'paymentDate',
        header: 'Payment Date',
        cell: ({ row }) => new Date(row.getValue('paymentDate')).toLocaleDateString(),
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
        accessorKey: 'paymentMethod',
        header: 'Method',
    }
];
