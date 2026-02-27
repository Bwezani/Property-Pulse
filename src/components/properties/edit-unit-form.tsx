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
import { Edit2, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Property, PropertyUnit } from '@/lib/types';

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

  const form = useForm<EditUnitFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unitName: unit.unitName,
      status: unit.status,
      monthlyRent: unit.monthlyRent,
      paymentDueDay: unit.paymentDueDay,
      tenantName: unit.tenantName || '',
      tenantContact: unit.tenantContact || '',
    },
  });

  const onSubmit = async (values: EditUnitFormValues) => {
    if (!db) return;

    try {
      // Create new unit list with updated unit
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

      await updateDoc(doc(db, 'finished_properties', property.id), {
        unitsList: updatedUnitsList,
      });

      toast({
        title: 'Unit Updated',
        description: `Details for ${values.unitName} have been saved.`,
      });
      setOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update unit details.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">Edit Unit</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Unit: {unit.unitName}</DialogTitle>
          <DialogDescription>
            Update the occupancy and lease details for this specific unit.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="unitName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Name/No.</FormLabel>
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
                    <FormLabel>Status</FormLabel>
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
                    <FormLabel>Monthly Rent</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.watch('status') === 'Occupied' && (
              <div className="space-y-4 pt-2 border-t mt-2">
                <div className="flex items-center gap-2 text-primary">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-bold uppercase tracking-wider">Tenant Details</span>
                </div>
                <FormField
                  control={form.control}
                  name="tenantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tenantContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Info</FormLabel>
                        <FormControl>
                          <Input placeholder="Email or Phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentDueDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Day (1-31)</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={31} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
