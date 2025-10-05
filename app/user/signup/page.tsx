import { Suspense } from "react";
import Footer from "@/components/footer";
import Header from "@/components/header";
import UserSignUp from "@/components/usersignup";

export default function SignUp() {
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
        <UserSignUp />
      </Suspense>
      <Footer />
    </>
  );
}
