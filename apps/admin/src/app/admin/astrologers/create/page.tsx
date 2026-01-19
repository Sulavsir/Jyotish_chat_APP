'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Button, Input, Textarea } from '@jyotish/ui';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  ArrowLeftIcon,
  CheckIcon,
} from '@jyotish/ui';
import { ADMIN_ROUTES } from '@/constants';
import {
  createAstrologerSchema,
  parseCommaSeparatedToArray,
  type CreateAstrologerFormData,
} from '@/constants/validators.constants';
import { toast } from 'sonner';

export default function CreateAstrologerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateAstrologerFormData>({
    resolver: zodResolver(createAstrologerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      gender: 'MALE',
      specialization: [],
      experience: 5,
      commissionRate: 15,
      category: 'ORDINARY',
      appointmentFee: null,
      languages: [],
      bio: '',
    },
  });

  const onSubmit = async (data: CreateAstrologerFormData) => {
    setIsSubmitting(true);

    try {
      // Transform data to match backend expectations
      const transformedData = {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        password: data.password,
        gender: data.gender || 'MALE',
        specialization: Array.isArray(data.specialization) ? data.specialization : [],
        experience: Number(data.experience) || 0,
        commissionRate: Number(data.commissionRate) || 10,
        category: data.category,
        appointmentFee: data.appointmentFee ? Number(data.appointmentFee) : null,
        languages: Array.isArray(data.languages) ? data.languages : [],
        bio: data.bio?.trim() || '',
      };

      

      const response = await adminApi.astrologers.create(transformedData);

      toast.success('✅ Astrologer created successfully!');
      router.push(ADMIN_ROUTES.ASTROLOGERS);
    } catch (error: any) {
      console.error('❌ Failed to create astrologer:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);

      // Show detailed error message
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create astrologer. Please try again.';

      toast.error(`❌ Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} type="button">
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-white">Add New Astrologer</h2>
            <p className="text-slate-400 mt-1">Create a new cosmic advisor account</p>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="cosmic-card rounded-xl p-8">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 9876543210" {...field} />
                        </FormControl>
                        <FormDescription>Format: +[country code][number]</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Min 8 chars, 1 uppercase, 1 number, 1 special
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender *</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Professional Details */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">
                  Professional Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialization *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Vedic, Numerology, Tarot"
                            onChange={(e) => {
                              const array = parseCommaSeparatedToArray(e.target.value);
                              field.onChange(array);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormDescription>Comma-separated list (e.g., Vedic, Tarot)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience (years) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="5"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="commissionRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Rate (%) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>Platform commission percentage (0-100%)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="ORDINARY">Ordinary - Chat only</option>
                            <option value="PROFESSIONAL">Professional - Chat & Appointments</option>
                            <option value="PREMIUM">Premium - Appointments only</option>
                          </select>
                        </FormControl>
                        <FormDescription>
                          Determines service availability and features
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="appointmentFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Appointment Fee (Rs)
                          {(form.watch('category') === 'PROFESSIONAL' ||
                            form.watch('category') === 'PREMIUM') &&
                            ' *'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="500"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseInt(e.target.value) : null)
                            }
                            disabled={form.watch('category') === 'ORDINARY'}
                          />
                        </FormControl>
                        <FormDescription>
                          {form.watch('category') === 'ORDINARY'
                            ? 'Not applicable for ordinary astrologers'
                            : 'Fee charged per appointment session'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="languages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Languages</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="English, Hindi, Sanskrit"
                            onChange={(e) => {
                              const array = parseCommaSeparatedToArray(e.target.value);
                              field.onChange(array);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormDescription>Comma-separated list (optional)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">
                  Additional Information
                </h3>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about this astrologer's expertise and background..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Maximum 1000 characters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-6 border-t border-slate-700">
                <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                  {isSubmitting ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <CheckIcon className="w-5 h-5" />
                      Create Astrologer
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
