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
import type { MaintenanceBudgetItem } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { updateMaintenanceBudgetActualCostAction } from '../actions';

const formSchema = z.object({
  itemName: z.string().min(1, 'Item name is required.'),
  estimatedCost: z.coerce
    .number()
    .min(0.01, 'Estimated cost must be greater than 0.'),
  actualCost: z.coerce
    .number()
    .min(0, 'Actual cost cannot be negative.'),
});

type UpdateFormValues = z.infer<typeof formSchema>;

export function UpdateMaintenanceBudgetActualForm({
  propertyId,
  item,
}: {
  propertyId: string;
  item: MaintenanceBudgetItem;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: item.itemName,
      estimatedCost: item.estimatedCost,
      actualCost: item.actualCost,
    },
  });

  const onSubmit = async (values: UpdateFormValues) => {
    try {
      await updateMaintenanceBudgetActualCostAction(
        propertyId,
        item.id,
        values.actualCost
      );
      toast({
        title: 'Actual Cost Updated',
        description: `Actual cost for "${item.itemName}" has been saved.`,
      });
      setOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update the actual cost.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="xs">
          Set Actual Cost
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Edit Budget Item</DialogTitle>
          <DialogDescription>
            Update the planned amount and the actual amount you spent for this item.
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
                    <Input type="text" {...field} />
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
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="actualCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actual Cost</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
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
                {form.formState.isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

