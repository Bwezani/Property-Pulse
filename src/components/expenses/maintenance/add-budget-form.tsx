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
import { addMaintenanceBudgetItemAction } from '../actions';

const formSchema = z.object({
  itemName: z.string().min(1, 'Item name is required.'),
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
  const form = useForm<MaintenanceBudgetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: '',
      estimatedCost: 0,
    },
  });

  const onSubmit = async (values: MaintenanceBudgetFormValues) => {
    try {
      await addMaintenanceBudgetItemAction(propertyId, values);
      toast({
        title: 'Budget Item Added',
        description:
          'The maintenance budget item has been successfully added.',
      });
      form.reset({
        itemName: '',
        estimatedCost: 0,
      });
      setOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not add the budget item.',
      });
    }
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
              name="estimatedCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Cost</FormLabel>
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

