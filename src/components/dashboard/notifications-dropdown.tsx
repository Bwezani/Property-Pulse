'use client';

import { Bell, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { RentalIncome } from '@/lib/types';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export function NotificationsDropdown() {
  const db = useFirestore();
  const { user } = useUser();

  const activeInvoicesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'rental_incomes'),
      where('status', 'in', ['Pending', 'Overdue', 'Partial Deposit']),
      limit(50)
    );
  }, [db, user]);

  const { data: invoices, isLoading } = useCollection<RentalIncome>(activeInvoicesQuery);

  const notificationsCount = invoices?.length || 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full h-9 w-9 border border-border/50">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {notificationsCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
              {notificationsCount > 9 ? '9+' : notificationsCount}
            </span>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 mt-2 shadow-xl border-border/50">
        <DropdownMenuLabel className="font-headline font-semibold flex items-center justify-between">
          <span>Notifications</span>
          {notificationsCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {notificationsCount} Unread
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="max-h-[350px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading notifications...</div>
          ) : notificationsCount === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
              <p>You're all caught up!</p>
              <p className="text-xs">No pending or overdue rents.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {invoices?.map((invoice) => {
                const isOverdue = invoice.status === 'Overdue';
                const isPartial = invoice.status === 'Partial Deposit';
                
                return (
                  <Link href={`/dashboard/properties/${invoice.propertyId}?tab=income`} key={invoice.id}>
                    <DropdownMenuItem className="cursor-pointer p-4 flex flex-col items-start gap-1 hover:bg-muted/50 border-b border-border/50 last:border-0 focus:bg-muted/50">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-sm flex items-center gap-2">
                          {isOverdue && <span className="h-2 w-2 rounded-full bg-red-500" />}
                          {!isOverdue && !isPartial && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                          {isPartial && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                          {invoice.unitName || 'Main Unit'}
                        </span>
                        <span className="text-xs font-bold text-primary">
                          {formatCurrency(Number(invoice.amount))}
                        </span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground w-full flex justify-between">
                        <span>{invoice.tenantName}</span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="h-3 w-3" />
                          <span className={isOverdue ? 'text-red-500' : isPartial ? 'text-blue-500' : 'text-amber-500'}>
                            {invoice.status}
                          </span>
                        </span>
                      </p>
                    </DropdownMenuItem>
                  </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
