
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
  FormDescription,
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
import { Edit2, User, CalendarDays } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Property, PropertyUnit } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const formSchema = z.object({
  unitName: z.string().min(1, 'Unit name is required.'),
  status: z.enum(['Occupied', 'Vacant']),
  monthlyRent: z.coerce.number().min(0, 'Rent cannot be negative.'),
  paymentDueDay: z.coerce.number().min(1).max(31),
  tenantName: z.string().optional(),
  tenantContact: z.string().optional(),
});

type EditUnitFormValues = z.infer<typeof formSchema>;

interface EditUnitFormProps {
  property: Property;
  unit: PropertyUnit;
}

export function EditUnitForm({ property, unit }: EditUnitFormProps) {
  const [open, setOpen] = useState(false);
  const db = useFirestore();
  const { user } = useUser();

  const form = useForm<EditUnitFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unitName: unit.unitName,
      status: unit.status,
      monthlyRent: unit.monthlyRent,
      paymentDueDay: unit.paymentDueDay || 1,
      tenantName: unit.tenantName || '',
      tenantContact: unit.tenantContact || '',
    },
  });

  const onSubmit = async (values: EditUnitFormValues) => {
    if (!db || !user) return;

    const updatedUnitsList = property.unitsList?.map((u) => {
      if (u.id === unit.id) {
        return {
          ...u,
          ...values,
          tenantName: values.status === 'Occupied' ? values.tenantName || '' : '',
          tenantContact: values.status === 'Occupied' ? values.tenantContact || '' : '',
        };
      }
      return u;
    }) || [];

    const docRef = doc(db, 'users', user.uid, 'finished_properties', property.id);

    updateDoc(docRef, {
      unitsList: updatedUnitsList,
    })
    .then(() => {
      toast({
        title: 'Unit Updated',
        description: `Details for ${values.unitName} have been saved.`,
      });
      setOpen(false);
    })
    .catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: { unitsList: updatedUnitsList }
      }));
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">Edit Unit</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Edit Unit Configuration</DialogTitle>
          <DialogDescription>
            Update lease terms, tenant information, and rent collection schedule for <strong>{unit.unitName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="unitName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Name/Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupancy Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Occupied">Occupied</SelectItem>
                          <SelectItem value="Vacant">Vacant</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="monthlyRent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Rent (ZMW)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-primary">
                <CalendarDays className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Collection Schedule</span>
              </div>
              <FormField
                control={form.control}
                name="paymentDueDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rent Collection Day (1-31)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={31} placeholder="e.g. 5" {...field} />
                    </FormControl>
                    <FormDescription>
                      The day of the month when rent is automatically recorded.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.watch('status') === 'Occupied' && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-primary">
                  <User className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Tenant Information</span>
                </div>
                <FormField
                  control={form.control}
                  name="tenantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Tenant Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Michael Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tenantContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Details (Email or Phone)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. +260 970 000 000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving changes...' : 'Save Unit Details'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
