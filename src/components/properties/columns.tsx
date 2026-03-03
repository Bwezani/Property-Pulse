
'use client';
import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ArrowUpDown, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Property } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { getFirestore, doc, deleteDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useFirebase } from '@/firebase';

const StatusBadge = ({ status }: { status: 'Occupied' | 'Vacant' }) => {
  return (
    <Badge variant={status === 'Occupied' ? 'default' : 'secondary'}>
      {status}
    </Badge>
  );
};

const TypeBadge = ({ type }: { type: 'Finished' | 'Under Construction' }) => {
  return (
    <Badge variant={type === 'Finished' ? 'outline' : 'default'} className={type === 'Under Construction' ? 'bg-amber-500 text-white border-none' : ''}>
      {type}
    </Badge>
  );
};

export const columns: ColumnDef<Property>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-4"
        >
          Property
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const property = row.original;
      return (
        <Link href={`/dashboard/properties/${property.id}`} className="flex items-center gap-3 group py-1">
          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium group-hover:underline truncate">{property.name}</span>
            <span className="text-xs text-muted-foreground truncate">{property.location}</span>
          </div>
        </Link>
      );
    },
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => <TypeBadge type={row.original.type} />,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      row.original.type === 'Finished' ? (
        <StatusBadge status={row.original.status} />
      ) : (
        <span className="text-muted-foreground text-xs italic">
          {row.original.constructionStage}
        </span>
      ),
  },
  {
    accessorKey: 'totalInvestment',
    header: 'Investment',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('totalInvestment'));
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ZMW',
        maximumFractionDigits: 0,
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'netProfit',
    header: 'Net Profit',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('netProfit'));
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ZMW',
        maximumFractionDigits: 0,
      }).format(amount);
      const isProfit = amount >= 0;

      return <div className={`font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>{formatted}</div>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const property = row.original;
      const { firestore: db, user } = useFirebase();

      const handleFinishConstruction = async () => {
        if (!db || !user) return;
        try {
          // 1. Get total construction cost
          const expensesRef = collection(db, 'users', user.uid, 'construction_expenses');
          const q = query(expensesRef, where('propertyId', '==', property.id));
          const snapshot = await getDocs(q);
          const totalCost = snapshot.docs.reduce((sum, doc) => sum + (doc.data().totalPrice || 0), 0);

          // 2. Add to finished_properties
          const finishedRef = doc(db, 'users', user.uid, 'finished_properties', property.id);
          await setDoc(finishedRef, {
            ...property,
            type: 'Finished',
            constructionStage: 'Completed',
            totalInvestment: totalCost,
            status: 'Vacant',
            monthlyRent: 0,
            paymentDueDay: 1,
            tenantName: '',
            tenantContact: '',
            units: 1,
            unitsList: [{
              id: `unit-${Date.now()}`,
              unitName: 'Main Unit',
              status: 'Vacant',
              tenantName: '',
              tenantContact: '',
              monthlyRent: 0,
              paymentDueDay: 1
            }]
          });

          // 3. Delete from construction_properties
          const constructionRef = doc(db, 'users', user.uid, 'construction_properties', property.id);
          await deleteDoc(constructionRef);

          toast({ title: "Project Completed", description: `${property.name} is now a finished property.` });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not update property status.' });
        }
      };

      const handleDeleteProperty = async () => {
        if (!db || !user) return;
        try {
          const colName = property.type === 'Finished' ? 'finished_properties' : 'construction_properties';
          const docRef = doc(db, 'users', user.uid, colName, property.id);
          await deleteDoc(docRef);
          toast({ title: 'Property Deleted', description: `${property.name} has been removed.` });
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the property.' });
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/properties/${property.id}`}>View Details</Link>
            </DropdownMenuItem>
            {property.type === 'Under Construction' && (
              <DropdownMenuItem onClick={handleFinishConstruction}>
                Mark as Finished
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleDeleteProperty}
            >
              Delete Property
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
