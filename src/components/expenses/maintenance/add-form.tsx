
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { PlusCircle, Building2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { Property } from '@/lib/types';

const formSchema = z.object({
  expenseType: z.enum(['Repair', 'Utility', 'Cleaning', 'Other'], { required_error: 'Expense type is required.'}),
  description: z.string().min(1, 'Description is required.'),
  amount: z.coerce.number().min(0.01, 'Amount must be positive.'),
  date: z.string().min(1, "A date is required."),
  vendor: z.string().min(1, 'Vendor is required.'),
  unitIds: z.array(z.string()).default([]),
});

type MaintenanceFormValues = z.infer<typeof formSchema>;

export function AddMaintenanceExpenseForm({ property }: { property: Property }) {
  const [open, setOpen] = useState(false);
  const db = useFirestore();
  const today = new Date().toISOString().split('T')[0];

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        description: '',
        amount: 0,
        vendor: '',
        unitIds: [],
        date: today,
    }
  });

  const onSubmit = async (values: MaintenanceFormValues) => {
    if (!db) return;

    const units = property.unitsList || [];
    const selectedUnitNames = units
        .filter(u => values.unitIds.includes(u.id))
        .map(u => u.unitName);

    const expenseData = {
        propertyId: property.id,
        expenseType: values.expenseType,
        description: values.description,
        amount: values.amount,
        date: new Date(values.date).toISOString(),
        vendor: values.vendor,
        unitIds: values.unitIds,
        unitNames: selectedUnitNames,
        createdAt: new Date().toISOString(),
    };

    addDoc(collection(db, 'maintenance_expenses'), expenseData)
      .then(() => {
        toast({
            title: 'Expense Added',
            description: 'The maintenance expense has been successfully added.',
        });
        form.reset({
            description: '',
            amount: 0,
            vendor: '',
            unitIds: [],
            date: today,
        });
        setOpen(false);
      })
      .catch(async (error) => {
        const contextualError = new FirestorePermissionError({
          path: 'maintenance_expenses',
          operation: 'create',
          requestResourceData: expenseData,
        });
        errorEmitter.emit('permission-error', contextualError);
      });
  };

  const units = property.unitsList || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Add Maintenance Expense</DialogTitle>
          <DialogDescription>
            Enter the details for the new maintenance expense for <strong>{property.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="expenseType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Expense Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Repair">Repair</SelectItem>
                        <SelectItem value="Utility">Utility</SelectItem>
                        <SelectItem value="Cleaning">Cleaning</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Amount (ZMW)</FormLabel>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Fix leaky pipe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Local Hardware" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            {units.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Building2 className="h-4 w-4 text-primary" />
                        Applicable Units
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg">
                        {units.map((unit) => (
                            <FormField
                                key={unit.id}
                                control={form.control}
                                name="unitIds"
                                render={({ field }) => {
                                    return (
                                        <FormItem
                                            key={unit.id}
                                            className="flex flex-row items-center space-x-2 space-y-0"
                                        >
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(unit.id)}
                                                    onCheckedChange={(checked) => {
                                                        return checked
                                                            ? field.onChange([...field.value, unit.id])
                                                            : field.onChange(
                                                                field.value?.filter(
                                                                    (value) => value !== unit.id
                                                                )
                                                            )
                                                    }}
                                                />
                                            </FormControl>
                                            <FormLabel className="text-xs font-normal cursor-pointer">
                                                {unit.unitName}
                                            </FormLabel>
                                        </FormItem>
                                    )
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}
          </form>
        </Form>
        <DialogFooter className="p-6 border-t">
          <Button type="submit" className="w-full" onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Adding...' : 'Add Expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
