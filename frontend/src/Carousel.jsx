import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SHOE1 from "./images/SHOE1.jpg";
import WhatsApp1 from "./images/WhatsApp Image 2026-01-13 at 7.57.38 PM.jpeg";
import WhatsApp2 from "./images/WhatsApp Image 2026-01-13 at 7.57.39 PM (1).jpeg";
import WhatsApp3 from "./images/WhatsApp Image 2026-01-13 at 7.57.39 PM.jpeg";
import WhatsApp4 from "./images/WhatsApp Image 2026-01-13 at 7.57.40 PM.jpeg";

const defaultImages = [
  { id: 1, url: SHOE1, title: "BRANDED SHOES" },
  { id: 2, url: WhatsApp1, title: "Premium Collection" },
  { id: 3, url: WhatsApp2, title: "New Arrivals" },
  { id: 4, url: WhatsApp3, title: "Premium Sneakers" },
  { id: 5, url: WhatsApp4, title: "Latest Trends" },
];

export default function Carousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselImages, setCarouselImages] = useState(defaultImages);

  useEffect(() => {
    const saved = localStorage.getItem("carouselImages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCarouselImages(parsed);
        } else {
          setCarouselImages(defaultImages);
        }
      } catch (e) {
        console.error("Error loading carousel:", e);
        setCarouselImages(defaultImages);
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const goToPrevious = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + carouselImages.length) % carouselImages.length
    );
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  return (
    <div className="relative w-full h-48 md:h-64 lg:h-96 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center">
        {carouselImages.map((image, index) => (
          <div
            key={image.id}
            className={`absolute w-full h-full transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={image.url}
              alt={image.title}
              className="w-full h-full object-cover floating-image"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-4">
              <h2 className="text-white text-2xl md:text-2xl md:text-4xl font-bold text-center">
                {image.title}
              </h2>
            </div>
          </div>
        ))}

        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/50 hover:bg-white/80 rounded-full p-3 transition z-10"
        >
          <ChevronLeft size={24} className="text-gray-800" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/50 hover:bg-white/80 rounded-full p-3 transition z-10"
        >
          <ChevronRight size={24} className="text-gray-800" />
        </button>

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition ${
                index === currentSlide
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
