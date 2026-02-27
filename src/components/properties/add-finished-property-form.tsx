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
  FormDescription,
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlusCircle, Info, Building2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

const formSchema = z
  .object({
    name: z.string().min(1, 'Property name is required.'),
    categoryId: z.string().min(1, 'Category is required.'),
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
    units: z.coerce.number().min(1, 'Units must be at least 1.').default(1),
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

const CATEGORIES = [
  { id: 'stand-alone', name: 'Stand Alone' },
  { id: 'apartment', name: 'Apartment' },
  { id: 'flat', name: 'Flat' },
  { id: 'bedsit', name: 'Bedsit' },
  { id: 'commercial', name: 'Commercial Space' },
  { id: 'warehouse', name: 'Warehouse' },
  { id: 'other', name: 'Other' },
];

const MULTI_UNIT_CATEGORIES = ['apartment', 'flat', 'commercial', 'warehouse'];

export function AddFinishedPropertyForm() {
  const [open, setOpen] = useState(false);
  const db = useFirestore();
  const { user } = useUser();

  const form = useForm<FinishedPropertyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      location: '',
      size: '',
      totalInvestment: 0,
      status: 'Occupied',
      monthlyRent: 0,
      paymentDueDay: 1,
      tenantName: '',
      tenantContact: '',
      units: 1,
    },
  });

  const categoryId = form.watch('categoryId');
  const status = form.watch('status');
  const isMultiUnit = MULTI_UNIT_CATEGORIES.includes(categoryId);

  const onSubmit = async (values: FinishedPropertyFormValues) => {
    if (!db || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be signed in to add a property.',
      });
      return;
    }

    try {
      const isOccupied = values.status === 'Occupied';
      
      await addDoc(collection(db, 'finished_properties'), {
        name: values.name,
        code: `FP-${Date.now().toString().slice(-6)}`,
        categoryId: values.categoryId,
        location: values.location,
        size: values.size,
        description: '',
        type: 'Finished',
        imageId: 'default-img',
        totalInvestment: values.totalInvestment,
        status: values.status,
        monthlyRent: isOccupied ? values.monthlyRent : 0,
        paymentDueDay: isOccupied ? values.paymentDueDay : 0,
        tenantName: isOccupied ? (values.tenantName || '') : '',
        tenantContact: isOccupied ? (values.tenantContact || '') : '',
        units: values.units,
        createdAt: new Date().toISOString(),
        isDeleted: false,
        members: { [user.uid]: 'admin' },
        totalConstructionCost: 0,
        totalRentReceived: 0,
        totalMaintenanceCost: 0,
        remainingInvestment: values.totalInvestment,
        totalProfit: 0,
        netProfit: 0,
      });

      toast({
        title: 'Property Added',
        description: 'The finished property has been successfully added.',
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error adding property:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not add the property to Firestore.',
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
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Add Finished Property
          </DialogTitle>
          <DialogDescription>
            Enter the details for the new finished property. Multi-unit properties will require extra details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isMultiUnit && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <Alert variant="default" className="bg-primary/5 border-primary/20">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary font-semibold">Multi-Unit Property Detected</AlertTitle>
                  <AlertDescription className="text-primary/80">
                    This category usually implies multiple individual units (e.g., separate apartments in a building). Please specify the total number of units below.
                  </AlertDescription>
                </Alert>
                <FormField
                  control={form.control}
                  name="units"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Number of Units</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormDescription>How many separate rentable spaces are in this property?</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall Size</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 12-unit building or 2400 sqft" {...field} />
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Occupancy Status</FormLabel>
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
                    <FormLabel>Rent Payment Due Day (1-31)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={31} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {status === 'Occupied' && (
              <div className="space-y-4 border-t pt-4 mt-4 bg-muted/20 p-4 rounded-lg animate-in fade-in duration-300">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  Primary Tenant Details
                </h3>
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
                <FormField
                  control={form.control}
                  name="monthlyRent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Rent Amount (Total)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 10000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter className="pt-4 border-t">
              <Button
                type="submit"
                className="w-full md:w-auto font-bold"
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
