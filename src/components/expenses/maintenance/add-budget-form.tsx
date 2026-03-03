
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const formSchema = z.object({
  itemName: z.string().min(1, 'Item name is required.'),
  category: z.string().min(1, 'Category is required.'),
  customCategory: z.string().optional(),
  estimatedCost: z.coerce
    .number()
    .min(0.01, 'Estimated cost must be greater than 0.'),
});

type MaintenanceBudgetFormValues = z.infer<typeof formSchema>;

export function AddMaintenanceBudgetItemForm({
  propertyId,
}: {
  propertyId: string;
}) {
  const [open, setOpen] = useState(false);
  const db = useFirestore();
  const { user } = useUser();

  const form = useForm<MaintenanceBudgetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: '',
      category: '',
      customCategory: '',
      estimatedCost: 0,
    },
  });

  const onSubmit = async (values: MaintenanceBudgetFormValues) => {
    if (!db || !user) return;

    const finalCategory =
        values.category === 'Other'
          ? values.customCategory
          : values.category;
  
    const budgetData = {
        userId: user.uid,
        propertyId,
        itemName: values.itemName,
        category: finalCategory || 'Uncategorized',
        estimatedCost: values.estimatedCost,
        actualCost: 0,
        createdAt: new Date().toISOString(),
    };

    addDoc(collection(db, 'maintenance_budget_items'), budgetData)
      .then(() => {
        toast({
            title: 'Budget Item Added',
            description: 'The maintenance budget item has been successfully added.',
        });
        form.reset({
            itemName: '',
            category: '',
            customCategory: '',
            estimatedCost: 0,
        });
        setOpen(false);
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'maintenance_budget_items',
            operation: 'create',
            requestResourceData: budgetData,
        }));
      });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Budget Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Maintenance Budget Item</DialogTitle>
          <DialogDescription>
            Enter the planned item with its estimated (budgeted) cost. You can fill the actual cost later after purchase.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="itemName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Interior paint" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full border rounded-md h-9 px-3 text-sm bg-background"
                    >
                      <option value="">Select Category</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Roofing">Roofing</option>
                      <option value="Security">Security</option>
                      <option value="Painting">Painting</option>
                      <option value="Other">Other</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch('category') === 'Other' && (
              <FormField
                control={form.control}
                name="customCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enter Custom Category</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g.  Security"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="estimatedCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Cost (ZMW)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Adding...' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
