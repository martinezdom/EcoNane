<script setup>
import Navbar from './components/Navbar.vue'
import Hero from './components/Hero.vue'
import PromotionSection from './components/PromotionSection.vue'
import Features from './components/Features.vue'
import Experiences from './components/Experiences.vue'
import AboutAndGallery from './components/AboutAndGallery.vue'
import FAQSection from './components/FAQSection.vue'
import ContactSection from './components/ContactSection.vue'
import Footer from './components/Footer.vue'
</script>

<template>
  <div
    class="bg-brand-cream text-brand-brown-dark selection:bg-brand-pink-light/40 selection:text-brand-brown-dark flex min-h-screen flex-col"
  >
    <Navbar />
    <main class="flex-grow">
      <Hero />
      <PromotionSection />
      <Features />
      <Experiences />
      <AboutAndGallery />
      <FAQSection />
      <ContactSection />
    </main>
    <Footer />
  </div>
</template>
