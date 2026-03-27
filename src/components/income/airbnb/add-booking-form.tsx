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
import { Calculator, CalendarDays } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Property, PropertyUnit, RentalIncome } from '@/lib/types';
import { collection, query, where } from 'firebase/firestore';
import { useMemoFirebase, useCollection } from '@/firebase';

const formSchema = z.object({
  unitId: z.string().optional(),
  guestName: z.string().min(1, 'Guest name is required.'),
  contactNumber: z.string().optional().default(''),
  checkInDate: z.string().min(1, 'Check-in date is required.'),
  checkOutDate: z.string().min(1, 'Check-out date is required.'),
  totalBookingCost: z.coerce.number().min(0.01, 'Total cost must be greater than 0.'),
  amountPaid: z.coerce.number().min(0, 'Amount paid cannot be negative.'),
  paymentMethod: z.enum(['Bank Transfer', 'Cash', 'Credit Card']),
});

type AddAirbnbBookingFormValues = z.infer<typeof formSchema>;

export function AddAirbnbBookingForm({ property }: { property: Property }) {
  const [open, setOpen] = useState(false);
  const db = useFirestore();
  const { user } = useUser();
  
  const isMultiUnit = property.unitsList && property.unitsList.length > 0;

  const bookingsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'rental_incomes'),
      where('propertyId', '==', property.id),
      where('isAirbnbBooking', '==', true)
    );
  }, [db, user, property.id]);

  const { data: existingBookings } = useCollection<RentalIncome>(bookingsQuery);

  const form = useForm<AddAirbnbBookingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unitId: isMultiUnit ? '' : 'main',
      guestName: '',
      contactNumber: '',
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      totalBookingCost: 0,
      amountPaid: 0,
      paymentMethod: 'Bank Transfer',
    },
  });

  const watchCheckIn = form.watch('checkInDate');
  const watchCheckOut = form.watch('checkOutDate');

  const availableUnits = property.unitsList?.filter(unit => {
    if (!watchCheckIn || !watchCheckOut || !existingBookings) return true;
    
    const reqIn = new Date(watchCheckIn);
    const reqOut = new Date(watchCheckOut);

    const isBooked = existingBookings.some((b) => {
      if (b.unitId !== unit.id) return false;
      if (!b.checkInDate || !b.checkOutDate) return false;
      const bIn = new Date(b.checkInDate);
      const bOut = new Date(b.checkOutDate);
      
      // Date Overlap logic: A starts before B ends AND A ends after B starts
      return reqIn < bOut && reqOut > bIn;
    });

    return !isBooked;
  });

  const onSubmit = async (values: AddAirbnbBookingFormValues) => {
    if (!db || !user) return;
    
    // Validation
    const checkIn = new Date(values.checkInDate);
    const checkOut = new Date(values.checkOutDate);
    if (checkOut <= checkIn) {
        form.setError('checkOutDate', { message: 'Check-out must be after check-in' });
        return;
    }
    if (values.amountPaid > values.totalBookingCost) {
        form.setError('amountPaid', { message: 'Cannot pay more than total cost' });
        return;
    }

    const checkOverlap = existingBookings?.some((b) => {
      if (b.unitId !== (values.unitId || 'main')) return false;
      if (!b.checkInDate || !b.checkOutDate) return false;
      const bIn = new Date(b.checkInDate);
      const bOut = new Date(b.checkOutDate);
      return checkIn < bOut && checkOut > bIn;
    });

    if (checkOverlap) {
      if (isMultiUnit) {
        form.setError('unitId', { message: 'This unit is already booked for these dates.' });
      } else {
        form.setError('checkInDate', { message: 'Property is already booked for these dates.' });
      }
      return;
    }

    let targetUnit: PropertyUnit | undefined;
    let unitName = property.name;

    if (isMultiUnit) {
      targetUnit = property.unitsList?.find(u => u.id === values.unitId);
      if (!targetUnit && values.unitId !== 'main') {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select a unit.' });
        return;
      }
      if (targetUnit) {
          unitName = targetUnit.unitName;
      }
    }

    // Determine monthKey based on Check-in Date
    const checkInYear = checkIn.getFullYear();
    const checkInMonth = checkIn.getMonth() + 1;
    const monthKey = `${checkInYear}-${String(checkInMonth).padStart(2, '0')}`;
    
    const docId = `booking-${property.id}-${values.unitId || 'main'}-${Date.now()}`;
    const docPath = `users/${user.uid}/rental_incomes`;
    const docRef = doc(db, docPath, docId);

    const balanceDue = values.totalBookingCost - values.amountPaid;
    const status = balanceDue > 0 ? (values.amountPaid === 0 ? 'Pending' : 'Partial Deposit') : 'Paid';

    const incomeData = {
      userId: user.uid,
      propertyId: property.id,
      unitId: values.unitId || 'main',
      unitName: unitName,
      tenantName: values.guestName,
      amount: values.amountPaid, // Cash received
      paymentDate: new Date().toISOString(),
      dueDate: checkIn.toISOString(),
      paymentMethod: values.paymentMethod,
      status: status,
      monthKey: monthKey,
      
      // Airbnb specifics
      isAirbnbBooking: true,
      totalBookingCost: values.totalBookingCost,
      balanceDue: balanceDue,
      checkInDate: checkIn.toISOString(),
      checkOutDate: checkOut.toISOString(),
      contactNumber: values.contactNumber,

      createdAt: serverTimestamp(),
    };

    try {
        await setDoc(docRef, incomeData);
        toast({ title: 'Booking Logged', description: 'Reservation has been added.' });
        form.reset();
        setOpen(false);
    } catch (error) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: docRef.path,
            operation: 'write',
            requestResourceData: incomeData
        }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 bg-amber-600 hover:bg-amber-700">
          <CalendarDays className="mr-2 h-4 w-4" />
          Log Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Airbnb / Short-term Booking</DialogTitle>
          <DialogDescription>
            Record a guest reservation. You can log a partial deposit now and update it later.
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
                    <FormLabel>Select Room / Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableUnits && availableUnits.length > 0 ? (
                          availableUnits.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.unitName}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No units available for selected dates.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="guestName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Guest Name</FormLabel>
                    <FormControl>
                        <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                        <Input placeholder="+1 234..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="checkInDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-in</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="checkOutDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-out</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t mt-4">
                <FormField
                control={form.control}
                name="totalBookingCost"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Total Cost (ZMW)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="amountPaid"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Deposit Paid Now</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <p className="text-[0.7rem] text-muted-foreground mt-1 leading-tight">
                        Enter 0 if unpaid, or the 50% deposit amount.
                    </p>
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
                {form.formState.isSubmitting ? 'Saving...' : 'Record Booking'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
