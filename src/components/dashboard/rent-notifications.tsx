'use client';

import { useMemo } from 'react';
import { AlertCircle, ChevronRight, Banknote } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import type { Property, RentalIncome } from '@/lib/types';

interface RentNotificationsProps {
  properties: Property[];
  incomes: RentalIncome[];
}

export function RentNotifications({ properties, incomes }: RentNotificationsProps) {
  const pendingRents = useMemo(() => {
    const pending: { propertyId: string; propertyName: string; unitName: string; tenant: string; dueDay: number }[] = [];
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    properties.forEach((property) => {
      // Ignore if under construction
      if (property.type !== 'Finished') return;
      
      const isMultiUnit = property.unitsList && property.unitsList.length > 0;

      if (isMultiUnit) {
        property.unitsList?.forEach((unit) => {
          if (unit.status === 'Occupied' && currentDay >= unit.paymentDueDay && !property.isAirbnb) {
            // Check if rent is paid
            const isPaid = incomes.some(
              (i) => i.propertyId === property.id && i.unitId === unit.id && i.monthKey === currentMonthKey
            );
            if (!isPaid) {
              pending.push({
                propertyId: property.id,
                propertyName: property.name,
                unitName: unit.unitName,
                tenant: unit.tenantName,
                dueDay: unit.paymentDueDay,
              });
            }
          }
        });
      } else {
        if (property.status === 'Occupied' && currentDay >= property.paymentDueDay && !property.isAirbnb) {
          const isPaid = incomes.some(
            (i) => i.propertyId === property.id && i.unitId === 'main' && i.monthKey === currentMonthKey
          );
          if (!isPaid) {
            pending.push({
              propertyId: property.id,
              propertyName: property.name,
              unitName: 'Main',
              tenant: property.tenantName,
              dueDay: property.paymentDueDay,
            });
          }
        }
      }
    });

    return pending;
  }, [properties, incomes]);

  if (pendingRents.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      <h2 className="text-xl font-headline font-semibold text-foreground flex items-center gap-2">
        <Banknote className="h-5 w-5 text-amber-500" />
        Action Required
      </h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {pendingRents.map((rent, idx) => (
          <Alert key={idx} variant="destructive" className="bg-destructive/10 border-destructive/20 relative">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-sm font-bold">Overdue Rent</AlertTitle>
            <AlertDescription className="text-xs">
              <span className="block mt-1 truncate">
                {rent.propertyName} - {rent.unitName}
              </span>
              <span className="block text-muted-foreground opacity-80">
                Tenant: {rent.tenant || 'Unknown'} (Due: {rent.dueDay})
              </span>
            </AlertDescription>
            <Link
              href={`/dashboard/properties/${rent.propertyId}`}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-full bg-background hover:bg-destructive text-destructive hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Alert>
        ))}
      </div>
    </div>
  );
}
