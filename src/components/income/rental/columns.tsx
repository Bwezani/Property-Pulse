'use client';
import type { ColumnDef } from '@tanstack/react-table';
import type { RentalIncome } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

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
        accessorKey: 'unitName',
        header: 'Unit',
        cell: ({ row }) => <div className="font-medium">{row.original.unitName || 'Main'}</div>,
    },
    {
        accessorKey: 'tenantName',
        header: 'Tenant',
    },
    {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => {
        const amount = parseFloat(row.getValue('amount'));
        return <div className="font-medium">{formatCurrency(amount)}</div>;
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
