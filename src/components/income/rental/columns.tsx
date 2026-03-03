'use client';
import type { ColumnDef } from '@tanstack/react-table';
import type { RentalIncome } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatFullCurrency } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="font-medium cursor-help">{formatCurrency(amount)}</div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{formatFullCurrency(amount)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
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
