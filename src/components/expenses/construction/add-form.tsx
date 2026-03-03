'use client';

import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const formSchema = z.object({
  itemName: z.string().min(1, 'Item name is required.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1.'),
  unitPrice: z.coerce.number().min(0.01, 'Unit price must be positive.'),
  vendor: z.string().min(1, 'Vendor is required.'),
  purchaseDate: z.string().min(1, "A date is required."),
  notes: z.string().optional(),
});

type ConstructionFormValues = z.infer<typeof formSchema>;

export function AddConstructionExpenseForm({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const db = useFirestore();
  const { user } = useUser();
  const today = new Date().toISOString().split('T')[0];
  
  const form = useForm<ConstructionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      itemName: '',
      unitPrice: 0,
      vendor: '',
      notes: '',
      purchaseDate: today,
    }
  });

  const quantity = form.watch('quantity');
  const unitPrice = form.watch('unitPrice');
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const total = (quantity || 0) * (unitPrice || 0);
    setTotalPrice(total);
  }, [quantity, unitPrice]);

  const onSubmit = async (data: ConstructionFormValues) => {
    if (!db || !user) return;

    const expenseData = {
      userId: user.uid,
      propertyId,
      itemName: data.itemName,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      totalPrice,
      vendor: data.vendor,
      purchaseDate: new Date(data.purchaseDate).toISOString(),
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    };

    addDoc(collection(db, 'construction_expenses'), expenseData)
      .then(() => {
        toast({ title: 'Expense Added', description: 'The construction expense has been successfully added.' });
        form.reset({ quantity: 1, itemName: '', unitPrice: 0, vendor: '', notes: '', purchaseDate: today });
        setOpen(false);
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'construction_expenses',
          operation: 'create',
          requestResourceData: expenseData,
        }));
      });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Construction Expense</DialogTitle>
          <DialogDescription>
            Enter expense details. This will be visible only to you.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="itemName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl><Input placeholder="e.g. Steel Beams" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Price</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
             <p className="text-sm font-bold">Total: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' }).format(totalPrice)}</p>
            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <FormControl><Input placeholder="e.g. BuildIt Supplies" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Adding...' : 'Add Expense'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}