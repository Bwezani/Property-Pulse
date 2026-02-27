
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
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const formSchema = z.object({
  name: z.string().min(1, 'Property name is required.'),
  location: z.string().min(1, 'Location is required.'),
  size: z.string().min(1, 'Size is required.'),
  constructionStage: z.enum(
    ['Planning', 'Foundation', 'Framing', 'Roofing', 'Finishing', 'Completed'],
    { required_error: 'Construction stage is required.' }
  ),
  estimatedBudget: z
    .coerce
    .number()
    .min(0, 'Budget cannot be negative.')
    .optional()
    .or(z.literal(NaN)),
});

type ConstructionPropertyFormValues = z.infer<typeof formSchema>;

export function AddConstructionPropertyForm() {
  const [open, setOpen] = useState(false);
  const db = useFirestore();
  const { user } = useUser();

  const form = useForm<ConstructionPropertyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      location: '',
      size: '',
      constructionStage: 'Foundation',
      estimatedBudget: undefined,
    },
  });

  const onSubmit = async (values: ConstructionPropertyFormValues) => {
    if (!db || !user) return;

    const propertyData = {
      name: values.name,
      code: `CP-${Date.now().toString().slice(-6)}`,
      categoryId: 'under-construction',
      location: values.location,
      size: values.size,
      description: '',
      type: 'Under Construction',
      imageId: 'prop-2-img',
      totalInvestment: 0,
      status: 'Vacant',
      monthlyRent: 0,
      paymentDueDay: 0,
      tenantName: '',
      tenantContact: '',
      constructionStage: values.constructionStage,
      estimatedBudget: values.estimatedBudget || 0,
      createdAt: new Date().toISOString(),
      isDeleted: false,
      members: { [user.uid]: 'admin' },
      totalConstructionCost: 0,
      totalRentReceived: 0,
      totalMaintenanceCost: 0,
      remainingInvestment: 0,
      totalProfit: 0,
      netProfit: 0,
    };

    addDoc(collection(db, 'construction_properties'), propertyData)
      .then(() => {
        toast({
          title: 'Property Added',
          description: 'The construction property has been successfully added.',
        });
        form.reset();
        setOpen(false);
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: 'construction_properties',
          operation: 'create',
          requestResourceData: propertyData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Construction Property
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Construction Property</DialogTitle>
          <DialogDescription>
            Enter the details for the new project in the construction pipeline.
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
                    <Input placeholder="e.g. Oakside Apartments Phase 2" {...field} />
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
                    <Input placeholder="e.g. Downtown, Metro City" {...field} />
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
                    <Input placeholder="e.g. 12-unit building" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="constructionStage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Construction Stage</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="Foundation">Foundation</SelectItem>
                      <SelectItem value="Framing">Framing</SelectItem>
                      <SelectItem value="Roofing">Roofing</SelectItem>
                      <SelectItem value="Finishing">Finishing</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estimatedBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Budget (ZMW)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 1200000"
                      {...field}
                    />
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
