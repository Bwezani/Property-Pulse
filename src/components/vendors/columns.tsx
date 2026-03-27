'use client';
import type { ColumnDef } from '@tanstack/react-table';
import type { Vendor } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export const vendorColumns: ColumnDef<Vendor>[] = [
  {
    accessorKey: 'name',
    header: 'Vendor Name',
    cell: ({ row }) => <div className="font-headline font-bold">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'serviceCategory',
    header: 'Service Type',
    cell: ({ row }) => (
      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
        {row.getValue('serviceCategory')}
      </Badge>
    ),
  },
  {
    accessorKey: 'contact',
    header: 'Contact Information',
  },
  {
    accessorKey: 'createdAt',
    header: 'Date Added',
    cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleDateString(),
  },
];
