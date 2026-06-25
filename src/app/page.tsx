import Hero from "@/components/Hero";

export default function Home() {
  return (
    <main className="w-full h-full">
      <Hero />

      {/* Later sections */}
      <section className="h-screen bg-black" />
      <section className="h-screen bg-black" />
    </main>
  );
}
