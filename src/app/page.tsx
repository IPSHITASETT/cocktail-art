import Hero from "@/components/Hero";
import ProductShowcase from "@/components/Productshowcase";

export default function Home() {
  return (
    <main className="w-full h-full">
      <Hero />
      <ProductShowcase />

      {/* Later sections */}
      <section className="h-screen bg-black" />
      <section className="h-screen bg-black" />
    </main>
  );
}
