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
import { EditAirbnbBookingForm } from './edit-booking-form';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const MarkAirbnbPaidAction = ({ docId, totalBookingCost }: { docId: string; totalBookingCost: number }) => {
  const db = useFirestore();
  const { user } = useUser();

  const handleMarkPaid = async () => {
    if (!db || !user) return;
    try {
      const docRef = doc(db, 'users', user.uid, 'rental_incomes', docId);
      await updateDoc(docRef, {
        status: 'Paid',
        amount: totalBookingCost, // Automatically logs the rest as paid
        balanceDue: 0,
        paymentDate: new Date().toISOString(),
      });
      toast({ title: 'Fully Paid', description: 'Airbnb booking updated successfully.' });
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
        <TooltipContent>Mark Full Payment Received</TooltipContent>
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

export const airbnbBookingColumns: ColumnDef<RentalIncome>[] = [
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
        header: 'Unit/Room',
        cell: ({ row }) => <div className="font-medium">{row.original.unitName || 'Main'}</div>,
    },
    {
        accessorKey: 'tenantName',
        header: 'Guest Name',
    },
    {
        accessorKey: 'checkInDate',
        header: 'Check-in',
        cell: ({ row }) => row.original.checkInDate ? new Date(row.original.checkInDate).toLocaleDateString() : 'N/A',
    },
    {
        accessorKey: 'checkOutDate',
        header: 'Check-out',
        cell: ({ row }) => row.original.checkOutDate ? new Date(row.original.checkOutDate).toLocaleDateString() : 'N/A',
    },
    {
        accessorKey: 'totalBookingCost',
        header: 'Total Value',
        cell: ({ row }) => {
        const amount = parseFloat(row.getValue('totalBookingCost'));
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
        accessorKey: 'amount',
        header: 'Paid Deposit',
        cell: ({ row }) => {
        const amount = parseFloat(row.getValue('amount'));
        return <div className="text-muted-foreground">{formatFullCurrency(amount)}</div>;
        },
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status as any} />,
    },
    {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
            <div className="flex items-center justify-end gap-2">
                {(row.original.status === 'Pending' || row.original.status === 'Partial Deposit') && (
                    <MarkAirbnbPaidAction docId={row.original.id} totalBookingCost={row.original.totalBookingCost || 0} />
                )}
                <EditAirbnbBookingForm booking={row.original} />
                <DeleteTransactionAction collectionName="rental_incomes" docId={row.original.id} />
            </div>
        ),
        enableSorting: false,
    }
];
