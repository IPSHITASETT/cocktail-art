import Hero from "@/components/Hero";
import ProductShowcase from "@/components/Productshowcase";
import CurvedHorizontalGallery from "@/components/CurvedHorizontalGallery";

export default function Home() {
  return (
    <main className="w-full h-full">
      <Hero />
      <ProductShowcase />
      <CurvedHorizontalGallery />

      {/* Later sections */}
      <section className="h-screen bg-black" />
      <section className="h-screen bg-black" />
    </main>
  );
}
