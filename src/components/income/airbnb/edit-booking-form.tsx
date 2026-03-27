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
import { Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { RentalIncome } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const formSchema = z.object({
  guestName: z.string().min(1, 'Guest name is required.'),
  contactNumber: z.string().optional().default(''),
  checkInDate: z.string().min(1, 'Check-in date is required.'),
  checkOutDate: z.string().min(1, 'Check-out date is required.'),
  totalBookingCost: z.coerce.number().min(0.01, 'Total cost must be greater than 0.'),
  amountPaid: z.coerce.number().min(0, 'Amount paid cannot be negative.'),
  paymentMethod: z.enum(['Bank Transfer', 'Cash', 'Credit Card']),
});

type EditAirbnbBookingFormValues = z.infer<typeof formSchema>;

export function EditAirbnbBookingForm({ booking }: { booking: RentalIncome }) {
  const [open, setOpen] = useState(false);
  const db = useFirestore();
  const { user } = useUser();

  const form = useForm<EditAirbnbBookingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guestName: booking.tenantName || '',
      contactNumber: booking.contactNumber || '',
      checkInDate: booking.checkInDate ? new Date(booking.checkInDate).toISOString().split('T')[0] : '',
      checkOutDate: booking.checkOutDate ? new Date(booking.checkOutDate).toISOString().split('T')[0] : '',
      totalBookingCost: booking.totalBookingCost || Number(booking.amount),
      amountPaid: Number(booking.amount) || 0,
      paymentMethod: (booking.paymentMethod as any) || 'Bank Transfer',
    },
  });

  const onSubmit = async (values: EditAirbnbBookingFormValues) => {
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

    const docPath = `users/${user.uid}/rental_incomes`;
    const docRef = doc(db, docPath, booking.id);

    const balanceDue = values.totalBookingCost - values.amountPaid;
    const status = balanceDue > 0 ? (values.amountPaid === 0 ? 'Pending' : 'Partial Deposit') : 'Paid';

    const incomeData = {
      tenantName: values.guestName,
      amount: values.amountPaid, // Cash received
      paymentMethod: values.paymentMethod,
      status: status,
      // Airbnb specifics
      totalBookingCost: values.totalBookingCost,
      balanceDue: balanceDue,
      checkInDate: checkIn.toISOString(),
      checkOutDate: checkOut.toISOString(),
      contactNumber: values.contactNumber,
    };

    try {
        await updateDoc(docRef, incomeData);
        toast({ title: 'Booking Updated', description: 'Changes have been saved.' });
        setOpen(false);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update booking.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700 hover:text-slate-900 hover:bg-slate-200">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Booking: {booking.unitName || 'Main'}</DialogTitle>
          <DialogDescription>
            Update guest details, dates, or log additional payments.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormLabel>Amount Paid So Far</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" {...field} />
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
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
