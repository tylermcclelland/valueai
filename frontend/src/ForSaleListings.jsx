// frontend/src/ForSaleListings.jsx

import React from 'react';

function ForSaleListings({ listings }) {
  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <div className="listings-container">
      <h3 className="section-title">Cars like this for sale</h3>
      <div className="listings-grid">
        {listings.map((listing) => (
          <a
            key={listing.id}
            href={listing.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="listing-card"
          >
            <img src={listing.imageUrl} alt={listing.title} className="listing-image" />
            <div className="listing-info">
              <h4 className="listing-title">{listing.title}</h4>
              <p className="listing-price">{listing.price}</p>
              <p className="listing-mileage">{listing.mileage}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default ForSaleListings;