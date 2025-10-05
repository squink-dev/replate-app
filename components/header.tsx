import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b bg-white shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <Link href="/" className="text-2xl font-extrabold text-green-600">
          Free Food Findr
        </Link>
      </div>
    </header>
  );
}
