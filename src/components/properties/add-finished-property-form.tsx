
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Building2, User, Home, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const CATEGORIES = [
  { id: 'stand-alone', name: 'Stand Alone' },
  { id: 'apartment', name: 'Apartment' },
  { id: 'flat', name: 'Flat' },
  { id: 'bedsit', name: 'Bedsit' },
  { id: 'commercial', name: 'Commercial Space' },
  { id: 'warehouse', name: 'Warehouse' },
  { id: 'airbnb', name: 'Airbnb / Short Term' },
  { id: 'other', name: 'Other' },
];

const MULTI_UNIT_CATEGORIES = ['apartment', 'flat', 'commercial', 'warehouse', 'airbnb'];

const unitSchema = z.object({
  unitName: z.string().min(1, 'Unit name/number is required.'),
  status: z.enum(['Occupied', 'Vacant']),
  monthlyRent: z.coerce.number().min(0, 'Rent cannot be negative.'),
  paymentDueDay: z.coerce.number().min(1).max(31),
  tenantName: z.string().optional().default(''),
  tenantContact: z.string().optional().default(''),
});

const formSchema = z.object({
  name: z.string().min(1, 'Property name is required.'),
  categoryId: z.string().min(1, 'Category is required.'),
  location: z.string().min(1, 'Location is required.'),
  size: z.string().min(1, 'Size is required.'),
  totalInvestment: z.coerce.number().min(0.01, 'Total investment must be greater than 0.'),
  units: z.coerce.number().min(1, 'Units must be at least 1.').default(1),
  unitsList: z.array(unitSchema),
  status: z.enum(['Occupied', 'Vacant']).optional().default('Vacant'),
  monthlyRent: z.coerce.number().optional().default(0),
  paymentDueDay: z.coerce.number().optional().default(1),
  tenantName: z.string().optional().default(''),
  tenantContact: z.string().optional().default(''),
});

type FinishedPropertyFormValues = z.infer<typeof formSchema>;

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
      units: 1,
      unitsList: [
        {
          unitName: 'Unit 1',
          status: 'Vacant',
          monthlyRent: 0,
          paymentDueDay: 1,
          tenantName: '',
          tenantContact: '',
        },
      ],
      status: 'Vacant',
      monthlyRent: 0,
      paymentDueDay: 1,
      tenantName: '',
      tenantContact: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'unitsList',
  });

  const categoryId = form.watch('categoryId');
  const unitsCountRaw = form.watch('units');
  const isMultiUnit = MULTI_UNIT_CATEGORIES.includes(categoryId);
  const isAirbnb = categoryId === 'airbnb';

  useEffect(() => {
    if (!isMultiUnit) return;
    const unitsCount = Math.max(1, Number(unitsCountRaw) || 1);
    const currentCount = fields.length;
    if (unitsCount > currentCount) {
      for (let i = currentCount; i < unitsCount; i++) {
        append(
          { unitName: `Unit ${i + 1}`, status: 'Vacant', monthlyRent: 0, paymentDueDay: 1, tenantName: '', tenantContact: '' },
          { shouldFocus: false }
        );
      }
    } else if (unitsCount < currentCount) {
      for (let i = currentCount; i > unitsCount; i--) {
        remove(i - 1);
      }
    }
  }, [unitsCountRaw, isMultiUnit, append, remove, fields.length]);

  const onSubmit = async (values: FinishedPropertyFormValues) => {
    if (!db || !user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be signed in to add a property.' });
      return;
    }

    const finalUnitsList = isMultiUnit
      ? values.unitsList.map(u => ({
          ...u,
          status: isAirbnb ? 'Vacant' : u.status,
          monthlyRent: isAirbnb ? 0 : u.monthlyRent,
          paymentDueDay: isAirbnb ? 1 : u.paymentDueDay,
          tenantName: u.tenantName ?? '',
          tenantContact: u.tenantContact ?? '',
          isAirbnb: isAirbnb,
        }))
      : [{ 
          unitName: 'Main Unit', 
          status: isAirbnb ? 'Vacant' : (values.status || 'Vacant'), 
          monthlyRent: isAirbnb ? 0 : (values.monthlyRent || 0), 
          paymentDueDay: isAirbnb ? 1 : (values.paymentDueDay || 1), 
          tenantName: values.tenantName ?? '', 
          tenantContact: values.tenantContact ?? '',
          isAirbnb: isAirbnb,
        }];

    const propertyData = {
      userId: user.uid,
      name: values.name,
      code: `FP-${Date.now().toString().slice(-6)}`,
      categoryId: values.categoryId,
      isAirbnb: isAirbnb,
      location: values.location,
      size: values.size,
      description: '',
      type: 'Finished',
      imageId: 'default-img',
      totalInvestment: values.totalInvestment,
      units: isMultiUnit ? values.units : 1,
      unitsList: finalUnitsList.map((u, i) => ({ ...u, id: `unit-${i + 1}-${Date.now()}` })),
      createdAt: new Date().toISOString(),
      isDeleted: false,
      members: { [user.uid]: 'admin' },
      status: !isMultiUnit ? (values.status || 'Vacant') : 'Occupied',
      monthlyRent: !isMultiUnit ? (values.monthlyRent || 0) : 0,
      paymentDueDay: !isMultiUnit ? (values.paymentDueDay || 1) : 1,
      tenantName: !isMultiUnit ? (values.tenantName ?? '') : '',
      tenantContact: !isMultiUnit ? (values.tenantContact ?? '') : '',
      totalConstructionCost: 0,
      totalRentReceived: 0,
      totalMaintenanceCost: 0,
      remainingInvestment: values.totalInvestment,
      totalProfit: 0,
      netProfit: 0,
    };

    const targetCollection = collection(db, 'users', user.uid, 'finished_properties');

    addDoc(targetCollection, propertyData)
      .then(() => {
        toast({ title: 'Property Added', description: 'The property has been successfully added.' });
        form.reset();
        setOpen(false);
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: targetCollection.path,
          operation: 'create',
          requestResourceData: propertyData,
        }));
      });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Finished Property
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-2xl font-headline">
            <Building2 className="h-6 w-6 text-primary" />
            Add Finished Property
          </DialogTitle>
          <DialogDescription>
            Configure your property details. Ownership will be assigned to your account.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-8 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Lusaka, Zambia" {...field} />
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
                        <FormLabel>Total Investment Cost (ZMW)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 2400 sqft" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {isMultiUnit && (
                    <FormField
                      control={form.control}
                      name="units"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Units</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {isMultiUnit ? (
                  <div className="space-y-6 pt-6 border-t">
                    <div className="flex items-center gap-2 mb-4">
                      <Home className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-headline font-semibold">Unit Details</h3>
                    </div>
                    <div className="grid gap-6">
                      {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-xl bg-card space-y-4 shadow-sm">
                          <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-bold text-sm text-primary uppercase">Unit {index + 1}</h4>
                            {fields.length > 1 && (
                              <Button variant="ghost" size="sm" className="h-8 text-destructive" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`unitsList.${index}.unitName`}
                              render={({ field }) => (
                                <FormItem className={isAirbnb ? "md:col-span-3" : ""}>
                                  <FormLabel className="text-xs">Name/No.</FormLabel>
                                  <FormControl><Input className="h-8" placeholder={isAirbnb ? "e.g. Room 1 or Entire House" : ""} {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            {!isAirbnb && (
                              <>
                                <FormField
                                  control={form.control}
                                  name={`unitsList.${index}.status`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Status</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="Occupied">Occupied</SelectItem>
                                          <SelectItem value="Vacant">Vacant</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`unitsList.${index}.monthlyRent`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Monthly Rent</FormLabel>
                                      <FormControl><Input className="h-8" type="number" {...field} /></FormControl>
                                    </FormItem>
                                  )}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 pt-6 border-t">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-headline font-semibold">Lease Details</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="paymentDueDay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Due Day</FormLabel>
                            <FormControl><Input type="number" min={1} max={31} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 border-t bg-card shrink-0">
              <Button type="submit" className="w-full md:w-auto font-bold px-8" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Property'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
