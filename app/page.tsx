import Footer from "@/components/footer";
import Header from "@/components/header";
import HomePage from "@/components/homepage";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-white">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-[180%] h-[180%] bg-gradient-to-br from-emerald-200/40 via-green-200/35 to-teal-200/40 rounded-[40%] blur-3xl animate-wave"></div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-[160%] h-[160%] bg-gradient-to-tr from-green-300/35 via-emerald-300/30 to-lime-200/35 rounded-[50%] blur-3xl animate-wave-reverse"></div>
        </div>

        <div className="absolute top-0 right-1/4 w-96 h-96 md:w-[32rem] md:h-[32rem] bg-gradient-to-br from-teal-200/35 to-emerald-200/35 rounded-[45%] blur-2xl animate-drift"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 md:w-[30rem] md:h-[30rem] bg-gradient-to-tl from-green-200/35 to-lime-200/40 rounded-[42%] blur-2xl animate-drift-slow"></div>
        <div className="absolute top-1/3 left-1/2 w-72 h-72 md:w-[28rem] md:h-[28rem] bg-gradient-to-r from-emerald-200/30 to-teal-300/35 rounded-[48%] blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-l from-green-300/30 to-emerald-300/30 rounded-[43%] blur-2xl animate-drift-alt"></div>

        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/15 to-white/25"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <HomePage />
        <Footer />
      </div>
    </div>
  );
}
