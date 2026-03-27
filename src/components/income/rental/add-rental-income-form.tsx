'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Banknote } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Property, PropertyUnit } from '@/lib/types';

const formSchema = z.object({
  unitId: z.string().optional(),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0.'),
  paymentDate: z.string().min(1, 'Payment date is required.'),
  paymentMethod: z.enum(['Bank Transfer', 'Cash', 'Credit Card']),
  monthsPaid: z.coerce.number().min(1, 'Must pay for at least 1 month.').default(1),
});

type AddRentalIncomeFormValues = z.infer<typeof formSchema>;

export function AddRentalIncomeForm({ property }: { property: Property }) {
  const [open, setOpen] = useState(false);
  const db = useFirestore();
  const { user } = useUser();
  const isMultiUnit = property.unitsList && property.unitsList.length > 0;

  const form = useForm<AddRentalIncomeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unitId: isMultiUnit ? '' : 'main',
      amount: property.isAirbnb ? 0 : property.monthlyRent || 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Bank Transfer',
      monthsPaid: 1,
    },
  });

  const onSubmit = async (values: AddRentalIncomeFormValues) => {
    if (!db || !user) return;

    let targetUnit: PropertyUnit | undefined;
    let unitName = property.name;
    let tenantName = property.tenantName;
    let dueDay = property.paymentDueDay || 1;

    if (isMultiUnit) {
      targetUnit = property.unitsList?.find(u => u.id === values.unitId);
      if (!targetUnit) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a unit.' });
        return;
      }
      unitName = targetUnit.unitName;
      tenantName = targetUnit.tenantName;
      dueDay = targetUnit.paymentDueDay || 1;
    }

    const promises = [];
    const baseDate = new Date(values.paymentDate);

    for (let i = 0; i < values.monthsPaid; i++) {
      const monthOffset = baseDate.getMonth() + i;
      const calcYear = baseDate.getFullYear() + Math.floor(monthOffset / 12);
      const calcMonth = (monthOffset % 12) + 1;
      const monthKey = `${calcYear}-${String(calcMonth).padStart(2, '0')}`;
      
      const docId = `manual-rent-${property.id}-${values.unitId || 'main'}-${monthKey}-${Date.now()}`;
      const docPath = `users/${user.uid}/rental_incomes`;
      const docRef = doc(db, docPath, docId);

      // Distribute amount evenly if paid multiple months, or just loop it
      const distributedAmount = values.amount / values.monthsPaid;

      const incomeData = {
        userId: user.uid,
        propertyId: property.id,
        unitId: values.unitId || 'main',
        unitName: unitName,
        tenantName: tenantName || 'Tenant',
        amount: distributedAmount,
        paymentDate: new Date(values.paymentDate).toISOString(),
        dueDate: new Date(calcYear, calcMonth - 1, dueDay).toISOString(),
        paymentMethod: values.paymentMethod,
        status: 'Paid',
        monthKey: monthKey,
        createdAt: serverTimestamp(),
      };

      promises.push(
        setDoc(docRef, incomeData, { merge: true }).catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: docRef.path,
            operation: 'write',
            requestResourceData: incomeData
          }));
        })
      );
    }

    await Promise.all(promises);
    toast({ title: 'Rent Added', description: `Successfully recorded ${values.monthsPaid} month(s) of rent.` });
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <Banknote className="mr-2 h-4 w-4" />
          Log Rent Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Rent Payment</DialogTitle>
          <DialogDescription>
            Manually record rental income, especially useful for variable Airbnb incomes or multi-month advances.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isMultiUnit && (
              <FormField
                control={form.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {property.unitsList?.filter(u => u.status === 'Occupied').map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.unitName} - {unit.tenantName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Amount Paid (ZMW)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <p className="text-[0.8rem] text-muted-foreground">
                    If paying for multiple months, this total is divided evenly per month.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monthsPaid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Months Covered</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
