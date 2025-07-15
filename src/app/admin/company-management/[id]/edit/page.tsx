
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Building, Save, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';

const updateCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  domain: z.string().min(2, 'Domain is required'),
  website: z.string().url().optional().or(z.literal("")),
  size: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']),
  industry: z.string().min(2, 'Industry is required'),
  location: z.string().min(2, 'Location is required'),
  description: z.string().max(2000).optional(),
  founded: z.number().min(1800).max(new Date().getFullYear()).optional(),
  status: z.enum(['active', 'suspended', 'pending'])
});

type UpdateCompanyFormValues = z.infer<typeof updateCompanySchema>;

export default function EditCompanyPage() {
  const { loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const authenticatedFetch = useAuthenticatedFetch();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<UpdateCompanyFormValues>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: {
      name: '',
      domain: '',
      website: '',
      size: '1-10',
      industry: '',
      location: '',
      description: '',
      status: 'active'
    }
  });

  const fetchCompanyData = useCallback(async () => {
    if (authLoading || !id) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await authenticatedFetch(`/api/admin/companies/${id}`);
      const company = result.data.company;

      form.reset({
        name: company.name,
        domain: company.domain,
        website: company.website,
        size: company.size,
        industry: company.industry,
        location: company.location,
        description: company.description,
        founded: company.founded,
        status: company.status.toLowerCase() as any,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load company data');
    } finally {
      setIsLoading(false);
    }
  }, [id, authLoading, authenticatedFetch, form]);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  const onSubmit = async (data: UpdateCompanyFormValues) => {
    setIsSaving(true);
    try {
      await authenticatedFetch(`/api/admin/companies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      
      toast({
        title: '✅ Success',
        description: 'Company details updated successfully.',
      });
      router.push(`/admin/company-management/${id}`);
    } catch (err) {
      toast({
        title: '❌ Error',
        description: err instanceof Error ? err.message : 'Failed to update company',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <Container className="py-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </Container>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Container className="py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold">Error</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container className="py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="mb-8">
              <Link href={`/admin/company-management/${id}`} passHref>
                <Button variant="ghost" size="sm" className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Company Details
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <Building className="mr-3 h-8 w-8 text-primary" />
                Edit Company: {form.getValues('name')}
              </h1>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Update the core details of the company.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domain</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Company Size</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-10">1-10 employees</SelectItem>
                            <SelectItem value="11-50">11-50 employees</SelectItem>
                            <SelectItem value="51-200">51-200 employees</SelectItem>
                            <SelectItem value="201-1000">201-1000 employees</SelectItem>
                            <SelectItem value="1000+">1000+ employees</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
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
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </Container>
    </AdminLayout>
  );
}
