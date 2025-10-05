import { Suspense } from "react";
import BusinessSignUp from "@/components/businesssignup";
import Footer from "@/components/footer";
import Header from "@/components/header";
export default function SignUpB() {
  return (
    <>
      <Header />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            Loading...
          </div>
        }
      >
        <BusinessSignUp />
      </Suspense>

      <Footer />
    </>
  );
}
