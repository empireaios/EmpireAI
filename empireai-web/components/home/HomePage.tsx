import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { Features } from "./Features";
import { HowItWorks } from "./HowItWorks";
import { ProductCategories } from "./ProductCategories";
import { Pricing } from "./Pricing";
import { Testimonials } from "./Testimonials";
import { FAQ } from "./FAQ";
import { Footer } from "./Footer";

export function HomePage() {
  return (
    <div className="relative min-h-full overflow-x-hidden bg-[#030303] text-[#f5f0e6]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"
      />

      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <ProductCategories />
        <Pricing />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
