import "./globals.css";

export const metadata = {
  title: "Cocktail Art",
  description: "Simple Next.js app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-black">
      <body className="bg-black">{children}</body>
    </html>
  );
}