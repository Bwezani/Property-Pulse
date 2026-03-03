'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
import { Construction, MapPin, Ruler, Wallet, ArrowLeft, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from 'next/link';

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
    .default(0),
});

type ConstructionPropertyFormValues = z.infer<typeof formSchema>;

export default function AddConstructionPropertyPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();

  const form = useForm<ConstructionPropertyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      location: '',
      size: '',
      constructionStage: 'Foundation',
      estimatedBudget: 0,
    },
  });

  const onSubmit = async (values: ConstructionPropertyFormValues) => {
    if (!db || !user) return;

    const propertyData = {
      userId: user.uid,
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

    const targetCollection = collection(db, 'users', user.uid, 'construction_properties');

    addDoc(targetCollection, propertyData)
      .then(() => {
        toast({ title: 'Property Added', description: 'The construction property has been successfully added.' });
        router.push('/dashboard/construction');
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
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/construction">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold">New Construction Project</h1>
          <p className="text-muted-foreground">Register a property currently under development to track spending and milestones.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Construction className="h-5 w-5 text-primary" />
                Project Details
              </CardTitle>
              <CardDescription>Basic identifiers and current development status.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                name="constructionStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Construction Stage</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Planning">Planning</SelectItem>
                        <SelectItem value="Foundation">Foundation</SelectItem>
                        <SelectItem value="Framing">Framing</SelectItem>
                        <SelectItem value="Roofing">Roofing</SelectItem>
                        <SelectItem value="Finishing">Finishing</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-5 w-5 text-primary" />
                Location & Specs
              </CardTitle>
              <CardDescription>Where the project is located and its planned configuration.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Location</FormLabel>
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
                    <FormLabel>Planned Size/Configuration</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Ruler className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="e.g. 12-unit building" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Wallet className="h-5 w-5 text-primary" />
                Financial Planning
              </CardTitle>
              <CardDescription>Define your target budget for this development.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="estimatedBudget"
                render={({ field }) => (
                  <FormItem className="max-w-md">
                    <FormLabel>Total Estimated Budget (ZMW)</FormLabel>
                    <FormControl>
                      <Input type="number" className="text-lg font-semibold" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t z-50 md:left-[220px] lg:left-[280px]">
             <div className="max-w-4xl mx-auto flex justify-end gap-4">
                <Button variant="outline" type="button" asChild>
                  <Link href="/dashboard/construction">Cancel</Link>
                </Button>
                <Button type="submit" size="lg" className="px-8 font-bold" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Starting Project...' : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Initialize Project
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
