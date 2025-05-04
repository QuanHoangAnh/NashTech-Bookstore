import React from 'react';
import './AboutPage.css'; // Keep for potential minor overrides

function AboutPage() {
  return (
    // Use Bootstrap container and vertical padding
    <div className="container my-4 about-page-custom">
      <h1 className="border-bottom pb-3 mb-4 page-title-custom">About Us</h1>

      <section className="text-center mb-5 welcome-section-custom">
        <h2 className="mb-3">Welcome to Bookworm</h2>
        <p className="lead col-md-8 mx-auto"> {/* Use lead class for emphasis, center */}
          "Bookworm is an independent New York bookstore and language school with
          locations in Manhattan and Brooklyn. We specialize in travel books and language
          classes."
        </p>
      </section>

      {/* Use Bootstrap row for two-column layout */}
      <div className="row g-5"> {/* Add gap */}
        <section className="col-md-6 about-section-custom">
          <h2 className="mb-3">Our Story</h2>
          <p>
            The name Bookworm was taken from the original name for New
            York International Airport, which was renamed JFK in December 1963.
          </p>
          <p>
            Our Manhattan store has just moved to the West Village.
            Our new location is 170 7th Avenue South, at the corner of Perry Street.
          </p>
          <p>
            From March 2008 through May 2016, the store was located in
            the Flatiron District.
          </p>
        </section>

        <section className="col-md-6 about-section-custom">
          <h2 className="mb-3">Our Vision</h2>
          <p>
            One of the last travel bookstores in the country, our
            Manhattan store carries a range of guidebooks (all 10% off) to suit the needs and tastes of
            every traveller and budget.
          </p>
          <p>
            We believe that a novel or travelogue can be just as
            valuable a key to a place as any guidebook, and our well-read, well-travelled staff is happy to make
            reading recommendations for any traveller, book lover, or gift giver.
          </p>
        </section>
      </div>
    </div>
  );
}

export default AboutPage;