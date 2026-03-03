'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, User, Home, Trash2, ArrowLeft, Save, LayoutGrid } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from 'next/link';

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

export default function AddFinishedPropertyPage() {
  const router = useRouter();
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
          tenantName: u.tenantName ?? '',
          tenantContact: u.tenantContact ?? '',
        }))
      : [{ 
          unitName: 'Main Unit', 
          status: values.status || 'Vacant', 
          monthlyRent: values.monthlyRent || 0, 
          paymentDueDay: values.paymentDueDay || 1, 
          tenantName: values.tenantName ?? '', 
          tenantContact: values.tenantContact ?? '' 
        }];

    const propertyData = {
      userId: user.uid,
      name: values.name,
      code: `FP-${Date.now().toString().slice(-6)}`,
      categoryId: values.categoryId,
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
      netProfit: 0 - values.totalInvestment, // Accounts for initial investment
    };

    const targetCollection = collection(db, 'users', user.uid, 'finished_properties');

    addDoc(targetCollection, propertyData)
      .then(() => {
        toast({ title: 'Property Added', description: 'The property has been successfully added.' });
        router.push('/dashboard/finished-properties');
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
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/finished-properties">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold">Add Finished Property</h1>
          <p className="text-muted-foreground">Define your completed asset and its initial lease terms.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-5 w-5 text-primary" />
                General Information
              </CardTitle>
              <CardDescription>Core property identifiers and valuation.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </CardContent>
          </Card>

          {isMultiUnit ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 px-1">
                <LayoutGrid className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-headline font-bold">Unit Configuration</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields.map((field, index) => (
                  <Card key={field.id} className="border-border/50 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                    <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/30">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider">Unit {index + 1}</CardTitle>
                      {fields.length > 1 && (
                        <Button variant="ghost" size="sm" className="h-8 text-destructive" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <FormField
                        control={form.control}
                        name={`unitsList.${index}.unitName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name/Number</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`unitsList.${index}.status`}
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
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`unitsList.${index}.monthlyRent`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Monthly Rent</FormLabel>
                              <FormControl><Input type="number" {...field} /></FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      {form.watch(`unitsList.${index}.status`) === 'Occupied' && (
                        <div className="space-y-4 pt-4 border-t border-dashed">
                          <FormField
                            control={form.control}
                            name={`unitsList.${index}.tenantName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tenant Name</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`unitsList.${index}.tenantContact`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contact Info</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-5 w-5 text-primary" />
                  Lease Details
                </CardTitle>
                <CardDescription>Tenant and rental income configuration for this single-dwelling asset.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupancy Status</FormLabel>
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
                      <FormLabel>Monthly Rent (ZMW)</FormLabel>
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
                      <FormLabel>Payment Due Day</FormLabel>
                      <FormControl><Input type="number" min={1} max={31} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch('status') === 'Occupied' && (
                  <>
                    <FormField
                      control={form.control}
                      name="tenantName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tenant Name</FormLabel>
                          <FormControl><Input placeholder="e.g. John Doe" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tenantContact"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Tenant Contact Details</FormLabel>
                          <FormControl><Input placeholder="e.g. email or phone number" {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t z-50 md:left-[220px] lg:left-[280px]">
             <div className="max-w-5xl mx-auto flex justify-end gap-4">
                <Button variant="outline" type="button" asChild>
                  <Link href="/dashboard/finished-properties">Cancel</Link>
                </Button>
                <Button type="submit" size="lg" className="px-8 font-bold" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving Property...' : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Property
                    </>
                  )}
                </Button>
             </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
