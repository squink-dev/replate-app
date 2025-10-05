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
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  age: z.number().min(1, "Age must be greater than 0").optional(),
  jobStatus: z.string().min(1, "Please select a job status"),
  isStudent: z.boolean().optional(),
  income: z.string().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function UserSignUp() {
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      jobStatus: "",
      isStudent: false,
      income: "",
      dietaryRestrictions: [],
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

  const jobStatusOptions = [
    { value: "unemployed", label: "Unemployed" },
    { value: "part_time", label: "Part-Time" },
    { value: "full_time", label: "Full-Time" },
    { value: "other", label: "Other" },
  ];

  const incomeOptions = [
    { value: "0-20k", label: "$0 - $20,000" },
    { value: "20k-50k", label: "$20,000 - $50,000" },
    { value: "50-80k", label: "$50,000 - $80,000" },
    { value: "80k+", label: "$80,000+" },
    { value: "prefer_not_to_say", label: "Prefer not to say" },
  ];

  const dietaryOptions = [
    { value: "vegan", label: "Vegan" },
    { value: "vegetarian", label: "Vegetarian" },
    { value: "gluten_free", label: "Gluten-Free" },
    { value: "halal", label: "Halal" },
    { value: "kosher", label: "Kosher" },
    { value: "dairy_free", label: "Dairy-Free" },
    { value: "nut_free", label: "Nut-Free" },
    { value: "other", label: "Other" },
  ];

  const handleToggleRestriction = (restriction: string) => {
    const currentRestrictions = form.getValues("dietaryRestrictions") || [];
    const exists = currentRestrictions.includes(restriction);
    const newRestrictions = exists
      ? currentRestrictions.filter((r) => r !== restriction)
      : [...currentRestrictions, restriction];

    form.setValue("dietaryRestrictions", newRestrictions);
    setDietaryRestrictions(newRestrictions);
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific error cases
        if (res.status === 401) {
          alert(
            "You must be logged in to create a profile. Please log in and try again.",
          );
        } else if (res.status === 409) {
          alert("A profile already exists for this account.");
        } else {
          alert(data.error || "Failed to create profile. Please try again.");
        }
        return;
      }

      alert("User profile created successfully!");
      form.reset();
      setDietaryRestrictions([]);

      // Redirect to user view page
      router.push("/user/view");
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
          Sign up
        </h1>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    First Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your first name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Last Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your last name" {...field} />
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
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter your age"
                      min="1"
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? 0 : Number(value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Job Status <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your job status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {jobStatusOptions.map((option) => (
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
              name="isStudent"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value || false}
                        onChange={field.onChange}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">
                      I am currently a student
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="income"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Income</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your income bracket" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {incomeOptions.map((option) => (
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

            <div>
              <FormLabel>Dietary Restrictions (optional)</FormLabel>
              <div className="flex flex-col gap-2 mt-3">
                {dietaryOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-gray-700 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={dietaryRestrictions.includes(option.value)}
                      onChange={() => handleToggleRestriction(option.value)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

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
