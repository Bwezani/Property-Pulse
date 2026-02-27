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
import { finishConstructionAction, deletePropertyAction } from './actions';
import { toast } from '@/hooks/use-toast';

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

async function handleFinishConstruction(property: Property) {
    try {
      await finishConstructionAction(property);
      toast({
        title: "Construction Finished!",
        description: `${property.name} has been moved to Finished Properties.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not finish construction.',
      });
    }
}

async function handleDeleteProperty(property: Property) {
  try {
    await deletePropertyAction(property.id);
    toast({
      title: 'Property Deleted',
      description: `${property.name} has been removed.`,
    });
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: 'Could not delete the property.',
    });
  }
}

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
            <DropdownMenuItem>Edit Property</DropdownMenuItem>
            {property.type === 'Under Construction' && (
              <DropdownMenuItem onClick={() => handleFinishConstruction(property)}>
                Mark as Finished
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDeleteProperty(property)}
            >
              Delete Property
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
