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
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteTransactionAction } from '@/components/transactions/delete-transaction-action';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const MarkPaidAction = ({ docId }: { docId: string }) => {
  const db = useFirestore();
  const { user } = useUser();

  const handleMarkPaid = async () => {
    if (!db || !user) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'rental_incomes', docId);
      await updateDoc(docRef, {
        status: 'Paid',
        paymentDate: new Date().toISOString(),
      });
      toast({ title: 'Invoice Paid', description: 'Rent logged successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status.' });
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100" onClick={handleMarkPaid}>
            <Check className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Mark as Paid</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const StatusBadge = ({ status }: { status: 'Paid' | 'Pending' | 'Overdue' | 'Partial Deposit' }) => {
  let variant: 'default' | 'secondary' | 'destructive' = 'secondary';
  let className = "";
  if (status === 'Paid') variant = 'default';
  if (status === 'Overdue') variant = 'destructive';
  if (status === 'Partial Deposit') className = "bg-amber-500 hover:bg-amber-600 text-white border-transparent";

  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  );
};


export const rentalIncomeColumns: ColumnDef<RentalIncome>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
    cell: ({ row }) => {
      const val = row.getValue('paymentDate');
      return val ? new Date(val as string).toLocaleDateString() : <span className="text-muted-foreground italic">Awaiting</span>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Method',
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-2">
        {(row.original.status === 'Pending' || row.original.status === 'Overdue') && (
          <MarkPaidAction docId={row.original.id} />
        )}
        <DeleteTransactionAction collectionName="rental_incomes" docId={row.original.id} />
      </div>
    ),
    enableSorting: false,
  }
];
