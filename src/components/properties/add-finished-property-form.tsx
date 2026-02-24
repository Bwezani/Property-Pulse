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
import { PlusCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { addFinishedPropertyAction } from './actions';

const formSchema = z
  .object({
    name: z.string().min(1, 'Property name is required.'),
    location: z.string().min(1, 'Location is required.'),
    size: z.string().min(1, 'Size is required.'),
    totalInvestment: z.coerce
      .number()
      .min(0.01, 'Total investment must be greater than 0.'),
    status: z.enum(['Occupied', 'Vacant'], {
      required_error: 'Status is required.',
    }),
    monthlyRent: z.coerce.number().min(0, 'Monthly rent cannot be negative.'),
    paymentDueDay: z.coerce
      .number()
      .min(1, 'Payment day must be between 1 and 31.')
      .max(31, 'Payment day must be between 1 and 31.'),
    tenantName: z.string().optional(),
    tenantContact: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'Occupied') {
      if (!data.tenantName || data.tenantName.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tenantName'],
          message: 'Tenant name is required for occupied properties.',
        });
      }
      if (!data.tenantContact || data.tenantContact.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tenantContact'],
          message: 'Tenant contact is required for occupied properties.',
        });
      }
      if (data.monthlyRent <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['monthlyRent'],
          message: 'Monthly rent must be greater than 0 for occupied properties.',
        });
      }
    }
  });

type FinishedPropertyFormValues = z.infer<typeof formSchema>;

export function AddFinishedPropertyForm() {
  const [open, setOpen] = useState(false);
  const form = useForm<FinishedPropertyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      location: '',
      size: '',
      totalInvestment: 0,
      status: 'Occupied',
      monthlyRent: 0,
      paymentDueDay: 1,
      tenantName: '',
      tenantContact: '',
    },
  });

  const status = form.watch('status');

  const onSubmit = async (values: FinishedPropertyFormValues) => {
    try {
      await addFinishedPropertyAction(values);
      toast({
        title: 'Property Added',
        description: 'The finished property has been successfully added.',
      });
      form.reset({
        name: '',
        location: '',
        size: '',
        totalInvestment: 0,
        status: 'Occupied',
        monthlyRent: 0,
        paymentDueDay: 1,
        tenantName: '',
        tenantContact: '',
      });
      setOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not add the property.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Finished Property
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Finished Property</DialogTitle>
          <DialogDescription>
            Enter the details for the new finished property.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Greenwood Villa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Maple Creek, Suburbia" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 3-bedroom, 2400 sqft" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="totalInvestment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Investment Cost</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 500000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                name="paymentDueDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Due Day</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={31} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {status === 'Occupied' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tenantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. John Doe" {...field} />
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
                      <FormLabel>Tenant Contact</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 0977 000 000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="monthlyRent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Rent Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 10000" {...field} />
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
                {form.formState.isSubmitting ? 'Adding...' : 'Add Property'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

