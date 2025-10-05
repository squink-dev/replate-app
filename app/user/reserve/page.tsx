"use client";

import { useRouter } from "next/navigation";
import Footer from "@/components/footer";
import Header from "@/components/header";

export default function ReservePage() {
  const router = useRouter();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Food Reservation System
            </h1>
            <p className="text-gray-600 mb-8">
              Select a specific business location to make a reservation for
              their available food items.
            </p>

            <div className="space-y-4">
              <p className="text-sm text-gray-500">To make a reservation:</p>
              <ol className="text-left max-w-md mx-auto space-y-2 text-sm text-gray-600">
                <li>1. Go back to the search page</li>
                <li>2. Find a business with available food items</li>
                <li>3. Click "Reserve Items" on the business card</li>
                <li>4. Select the quantities you want to reserve</li>
                <li>5. Confirm your reservation</li>
              </ol>
            </div>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => router.push("/user/view")}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium cursor-pointer"
              >
                Find Food Near Me
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
