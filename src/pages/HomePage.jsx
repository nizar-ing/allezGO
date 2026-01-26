import React from "react";
import Carousel from "../ui/Carrousel.jsx";
import {carouselImages, destinations, testimonials} from "../data/data.js";
import BookingHotels from "../ui/BookingHotels.jsx";
import TestimonialCarousel from "../components/TestimonialsCarousel.jsx";
import OrganizedTrips from "../components/OrganizedTrips.jsx";
import Gallery from "../ui/Gallery.jsx";
import PartnerCarrousel from "../ui/PartnerCarrousel.jsx";
import HotelShowcase from "../components/HotelShowcase.jsx";

function HomePage() {
  return (
    <section
      id="nos-atouts"
      className="flex flex-col text-white items-center justify-center scroll-mt-[100vh]"
    >
      <Carousel images={carouselImages} />
      <BookingHotels />
      <HotelShowcase cityId={10} />
      <OrganizedTrips destinations={destinations} />
      <Gallery />
      <TestimonialCarousel testimonials={testimonials} />
      <PartnerCarrousel />
    </section>
  );
}

export default HomePage;
