import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

export default function ImageCarousel({ images, make, model }) {
  if (!images || images.length === 0) return null;

  return (
    <div className="carousel-wrapper">
      <Carousel
        showArrows
        showStatus={false}
        showThumbs={false}
        infiniteLoop
        autoPlay={false}
        swipeable
        dynamicHeight={false}
      >
        {images.map((url, idx) => (
          <div className="slide" key={idx}>
            <img src={url} alt={`${make} ${model} #${idx + 1}`} />
          </div>
        ))}
      </Carousel>
    </div>
  );
}