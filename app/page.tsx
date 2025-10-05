import Footer from "@/components/footer";
import Header from "@/components/header";
import HomePage from "@/components/homepage";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <HomePage />
      <Footer />
    </div>
  );
}
