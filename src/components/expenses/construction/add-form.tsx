
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
import { addConstructionExpenseAction } from '../actions';
import { PlusCircle } from 'lucide-react';

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
    try {
      await addConstructionExpenseAction(propertyId, { 
        ...data, 
        totalPrice, 
        purchaseDate: new Date(data.purchaseDate).toISOString() 
      });
      toast({
        title: 'Expense Added',
        description: 'The construction expense has been successfully added.',
      });
      form.reset({
        quantity: 1,
        itemName: '',
        unitPrice: 0,
        vendor: '',
        notes: '',
        purchaseDate: today,
      });
      setOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not add the expense.',
      });
    }
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
            Enter the details for the new construction expense.
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
                  <FormControl>
                    <Input placeholder="e.g. Steel Beams" {...field} />
                  </FormControl>
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
                      <FormControl>
                        <Input type="number" placeholder="10" {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input type="number" placeholder="50.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
             <div>
                <p className="text-sm text-muted-foreground">Total Price: <span className="font-bold text-foreground">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' }).format(totalPrice)}</span></p>
             </div>
            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. BuildIt Supplies" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Purchase Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Textarea placeholder="Optional notes..." {...field} />
                  </FormControl>
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
