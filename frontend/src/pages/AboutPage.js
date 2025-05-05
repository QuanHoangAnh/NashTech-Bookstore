import React from 'react';
import './AboutPage.css';

function AboutPage() {
  return (
    <div className="container py-5 about-page-custom">
      <div className="row">
        <div className="col-12">
          <h1 className="about-title mb-4">About Us</h1>
          <hr className="mb-5" />
        </div>
      </div>
      
      <div className="row mb-5">
        <div className="col-lg-8 col-md-10 mx-auto text-center">
          <h2 className="mb-4">Welcome to Bookworm</h2>
          <p className="welcome-text">
            "Bookworm is an independent New York bookstore and language school with 
            locations in Manhattan and Brooklyn. We specialize in travel books and language 
            classes."
          </p>
        </div>
      </div>
      
      <div className="row mb-5">
        <div className="col-md-6 mb-4 mb-md-0">
          <div className="about-card p-4 h-100">
            <h3 className="mb-3">Our Story</h3>
            <p>
              The name Bookworm was taken from the 
              original name for New York International Airport, 
              which was renamed JFK in December 1963.
            </p>
            <p>
              Our Manhattan store has just moved to the 
              West Village. Our new location is 170 7th 
              Avenue South, at the corner of Perry Street.
            </p>
            <p>
              From March 2008 through May 2016, the store 
              was located in the Flatiron District.
            </p>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="about-card p-4 h-100">
            <h3 className="mb-3">Our Vision</h3>
            <p>
              One of the last travel bookstores in the country, 
              our Manhattan store carries a range of 
              guidebooks (all 10% off) to suit the needs and 
              tastes of every traveler and budget.
            </p>
            <p>
              We believe that a novel or travelogue can be 
              just as valuable a key to a place as any 
              guidebook, and our well-read, well-traveled staff 
              is happy to make reading recommendations for 
              any traveler, book lover, or gift giver.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;


