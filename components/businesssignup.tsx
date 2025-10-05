"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const formSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  email: z.string().email("Invalid email address"),
  businessType: z.string().min(1, "Please select a business type"),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function BusinessSignUp() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      email: "",
      businessType: "",
      phone: "",
    },
  });

  // Fetch the signed-in user's email on mount
  useEffect(() => {
    const fetchUserEmail = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        form.setValue("email", user.email);
      }
    };
    fetchUserEmail();
  }, [form]);

  const businessTypeOptions = [
    { value: "restaurant", label: "Restaurant" },
    { value: "grocery", label: "Grocery Store" },
    { value: "bakery", label: "Bakery" },
    { value: "cafe", label: "Cafe" },
    { value: "catering", label: "Catering" },
    { value: "distributor", label: "Distributor" },
    { value: "food bank", label: "Food Bank" },
    { value: "other", label: "Other" },
  ];

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific error cases
        if (res.status === 401) {
          alert(
            "You must be logged in to create a business profile. Please log in and try again.",
          );
        } else if (res.status === 409) {
          alert("A business profile already exists for this account.");
        } else {
          alert(
            data.error ||
              "Failed to create business profile. Please try again.",
          );
        }
        return;
      }

      alert("Business profile created successfully!");
      form.reset();

      // Redirect to business dashboard page
      router.push("/business/dashboard");
    } catch (err) {
      console.error("Error submitting form:", err);
      alert(
        "Something went wrong. Please check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-6 py-12">
      <div className="bg-white shadow-lg rounded-2xl border border-gray-200 w-full max-w-md p-8">
        <h1 className="text-4xl font-extrabold text-gray-800 text-center mb-8">
          Register your business
        </h1>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Business Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your business name" {...field} />
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
                  <FormLabel>
                    Email <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      {...field}
                      disabled
                      className="bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Business Type <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your business type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {businessTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
