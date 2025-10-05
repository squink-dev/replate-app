export default function Footer() {
  return (
    <footer className="w-full py-4 text-center text-gray-700 text-sm border-t border-white/50 bg-white/60 backdrop-blur-md shadow-lg">
      © {new Date().getFullYear()} Replate. All rights reserved.
    </footer>
  );
}
