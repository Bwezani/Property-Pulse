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
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Info, Building2, User, Home, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

const unitSchema = z.object({
  unitName: z.string().min(1, 'Unit name/number is required.'),
  status: z.enum(['Occupied', 'Vacant']),
  monthlyRent: z.coerce.number().min(0, 'Rent cannot be negative.'),
  paymentDueDay: z.coerce.number().min(1).max(31),
  tenantName: z.string().optional(),
  tenantContact: z.string().optional(),
});

const formSchema = z
  .object({
    name: z.string().min(1, 'Property name is required.'),
    categoryId: z.string().min(1, 'Category is required.'),
    location: z.string().min(1, 'Location is required.'),
    size: z.string().min(1, 'Size is required.'),
    totalInvestment: z.coerce
      .number()
      .min(0.01, 'Total investment must be greater than 0.'),
    units: z.coerce.number().min(1, 'Units must be at least 1.').default(1),
    unitsList: z.array(unitSchema),
    // Fallback fields for single unit properties
    status: z.enum(['Occupied', 'Vacant']).optional(),
    monthlyRent: z.coerce.number().optional(),
    paymentDueDay: z.coerce.number().optional(),
    tenantName: z.string().optional(),
    tenantContact: z.string().optional(),
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
      units: 1,
      unitsList: [{ unitName: 'Main Unit', status: 'Occupied', monthlyRent: 0, paymentDueDay: 1, tenantName: '', tenantContact: '' }],
      status: 'Occupied',
      monthlyRent: 0,
      paymentDueDay: 1,
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'unitsList',
  });

  const categoryId = form.watch('categoryId');
  const unitsCount = form.watch('units');
  const isMultiUnit = MULTI_UNIT_CATEGORIES.includes(categoryId);

  // Sync unitsList with units count when multi-unit is active
  useEffect(() => {
    if (isMultiUnit) {
      const currentCount = fields.length;
      if (unitsCount > currentCount) {
        for (let i = currentCount; i < unitsCount; i++) {
          append({
            unitName: `Unit ${i + 1}`,
            status: 'Vacant',
            monthlyRent: 0,
            paymentDueDay: 1,
            tenantName: '',
            tenantContact: '',
          });
        }
      } else if (unitsCount < currentCount && unitsCount >= 0) {
        for (let i = currentCount; i > unitsCount; i--) {
          remove(i - 1);
        }
      }
    }
  }, [unitsCount, isMultiUnit, append, remove, fields.length]);

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
      const finalUnitsList = isMultiUnit 
        ? values.unitsList 
        : [{
            id: 'unit-1',
            unitName: 'Main Unit',
            status: values.status || 'Vacant',
            monthlyRent: values.monthlyRent || 0,
            paymentDueDay: values.paymentDueDay || 1,
            tenantName: values.tenantName || '',
            tenantContact: values.tenantContact || '',
          }];

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
        units: isMultiUnit ? values.units : 1,
        unitsList: finalUnitsList.map((u, i) => ({ ...u, id: `unit-${i + 1}-${Date.now()}` })),
        createdAt: new Date().toISOString(),
        isDeleted: false,
        members: { [user.uid]: 'admin' },
        // Legacy fields for backward compatibility/simplicity in single unit
        status: !isMultiUnit ? values.status : 'Occupied',
        monthlyRent: !isMultiUnit ? values.monthlyRent : 0,
        paymentDueDay: !isMultiUnit ? values.paymentDueDay : 1,
        tenantName: !isMultiUnit ? values.tenantName : '',
        tenantContact: !isMultiUnit ? values.tenantContact : '',
        totalConstructionCost: 0,
        totalRentReceived: 0,
        totalMaintenanceCost: 0,
        remainingInvestment: values.totalInvestment,
        totalProfit: 0,
        netProfit: 0,
      });

      toast({
        title: 'Property Added',
        description: 'The property and its units have been successfully added.',
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
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Add Finished Property
          </DialogTitle>
          <DialogDescription>
            Enter details for your property. For multi-unit buildings, you can manage each unit's tenant and rent separately.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-8">
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
                        <FormLabel>Total Investment Cost</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 500000" {...field} />
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
                        <FormLabel>Overall Size</FormLabel>
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
                          <FormLabel>Total Number of Units</FormLabel>
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
                  <div className="space-y-6 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-4">
                      <Home className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Unit Details</h3>
                    </div>
                    <Alert className="bg-primary/5 border-primary/20">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Managing {unitsCount} Units</AlertTitle>
                      <AlertDescription>
                        Each unit has its own occupancy status, tenant, and monthly rent details.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid gap-6">
                      {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-lg bg-card space-y-4 shadow-sm">
                          <div className="flex items-center justify-between border-b pb-2">
                             <h4 className="font-medium text-sm">Unit #{index + 1} Configuration</h4>
                             {index > 0 && (
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
                                <FormItem>
                                  <FormLabel>Unit Name/No.</FormLabel>
                                  <FormControl><Input {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-muted/30 rounded-md animate-in fade-in duration-200">
                               <FormField
                                control={form.control}
                                name={`unitsList.${index}.tenantName`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Tenant Name</FormLabel>
                                    <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                                  </FormItem>
                                )}
                              />
                               <FormField
                                control={form.control}
                                name={`unitsList.${index}.tenantContact`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Contact</FormLabel>
                                    <FormControl><Input placeholder="097..." {...field} /></FormControl>
                                  </FormItem>
                                )}
                              />
                               <FormField
                                control={form.control}
                                name={`unitsList.${index}.paymentDueDay`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Due Day (1-31)</FormLabel>
                                    <FormControl><Input type="number" min={1} max={31} {...field} /></FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Occupancy & Tenant</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Status</FormLabel>
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
                            <FormLabel>Rent Due Day (1-31)</FormLabel>
                            <FormControl><Input type="number" min={1} max={31} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {form.watch('status') === 'Occupied' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-lg animate-in fade-in duration-200">
                        <FormField
                          control={form.control}
                          name="tenantName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tenant Name</FormLabel>
                              <FormControl><Input placeholder="Full Name" {...field} /></FormControl>
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
                              <FormControl><Input placeholder="Phone or Email" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 border-t bg-card">
              <Button type="submit" className="w-full md:w-auto font-bold" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Adding Property...' : 'Save Property'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
