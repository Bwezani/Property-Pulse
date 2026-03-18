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
import { useFirebase } from '@/firebase';
import { useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore'
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

    useEffect(() => {
        form.reset({
            itemName: item.itemName,
            estimatedCost: item.estimatedCost,
            actualCost: item.actualCost,
        });
    }, [item, form]);

    const { firestore, user } = useFirebase()

    const onSubmit = async (values: UpdateFormValues) => {
        if (!user || !firestore) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'System not ready. Please try again.',
            })
            return
        }

        try {
            console.log("Firestore instance:", firestore)
            console.log("User:", user.uid)
            console.log("Item ID:", item.id)

            const ref = doc(
                firestore,
                'users',
                user.uid,
                'maintenance_budget_items',
                item.id
            )

            await updateDoc(ref, {
                actualCost: Number(values.actualCost),
                updatedAt: new Date().toISOString(),
            })

            toast({
                title: 'Actual Cost Updated',
                description: `Actual cost for "${item.itemName}" saved.`,
            })

            setOpen(false)

        } catch (error) {
            console.error("UPDATE ERROR:", error)

            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not update the actual cost.',
            })
        } finally {
            form.reset(values)
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
                              disabled={form.formState.isSubmitting || !firestore || !user}
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

