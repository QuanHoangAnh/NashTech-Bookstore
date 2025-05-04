import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import "slick-carousel/slick/slick.css";
import Slider from 'react-slick'; // Keep react-slick for carousel
import apiService from '../services/api';
import BookCard from '../components/BookCard'; // Assumes BookCard is refactored
import './HomePage.css'; // Keep for custom carousel arrows, etc.

function HomePage() {
  const [onSaleBooks, setOnSaleBooks] = useState([]);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [activeFeaturedTab, setActiveFeaturedTab] = useState('recommended');
  const [loadingSale, setLoadingSale] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);

  const navigate = useNavigate();
  const sliderRef = useRef(null); // Keep ref for custom arrows

  useEffect(() => {
    // Fetch On Sale Books
    setLoadingSale(true);
    apiService.getBooks({ sort_by: 'on_sale_home', limit: 10 })
      .then(response => setOnSaleBooks(response.data.items))
      .catch(error => console.error("Error fetching on sale books:", error))
      .finally(() => setLoadingSale(false));

    // Fetch Recommended Books
    setLoadingRecommended(true);
    apiService.getBooks({ sort_by: 'recommended', limit: 8 })
      .then(response => setRecommendedBooks(response.data.items))
      .catch(error => console.error("Error fetching recommended books:", error))
      .finally(() => setLoadingRecommended(false));

    // Fetch Popular Books
    setLoadingPopular(true);
    apiService.getBooks({ sort_by: 'popularity', limit: 8 })
      .then(response => setPopularBooks(response.data.items))
      .catch(error => console.error("Error fetching popular books:", error))
      .finally(() => setLoadingPopular(false));
  }, []);

  const handleViewAllClick = () => {
    navigate('/shop', { state: { initialSort: 'on_sale_home' } });
  };

  // Keep slider settings, adjust responsive breakpoints if needed
  const sliderSettings = {
    dots: false,
    infinite: onSaleBooks.length > 4, // Only infinite if enough slides
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    // autoplay: true, // Keep or remove based on preference
    // autoplaySpeed: 5000,
    pauseOnHover: true,
    arrows: false, // Using custom arrows
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 4, slidesToScroll: 1 } },
      { breakpoint: 992, settings: { slidesToShow: 3, slidesToScroll: 1 } },
      { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 1 } },
      { breakpoint: 576, settings: { slidesToShow: 1, slidesToScroll: 1 } }
    ]
  };

  const featuredBooksToDisplay = activeFeaturedTab === 'recommended' ? recommendedBooks : popularBooks;
  const isLoadingFeatured = activeFeaturedTab === 'recommended' ? loadingRecommended : loadingPopular;

  const renderBookGrid = (books) => (
    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-3">
      {books.map(book => (
        <div className="col" key={book.id}>
          <BookCard book={book} />
        </div>
      ))}
    </div>
  );

  const renderLoadingState = () => (
    <div className="text-center p-5">
      <div className="spinner-border text-secondary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  const renderErrorState = (message) => (
     <div className="alert alert-warning text-center" role="alert">
       {message}
     </div>
  );


  return (
    // Use Bootstrap container for padding and centering
    <div className="container my-4 homepage">
      {/* On Sale Section */}
      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="m-0">On Sale</h2>
          <button onClick={handleViewAllClick} className="btn btn-outline-secondary btn-sm view-all-button-custom">
            View All <span className="arrow">▸</span>
          </button>
        </div>
        {loadingSale ? (
          renderLoadingState()
        ) : onSaleBooks.length > 0 ? (
          <div className="slider-container position-relative px-5"> {/* Added padding for arrows */}
            {/* Custom Arrows */}
            <button className="custom-arrow custom-arrow-prev" onClick={() => sliderRef.current?.slickPrev()}>❮</button>
            <Slider ref={sliderRef} {...sliderSettings}>
              {onSaleBooks.map(book => (
                <div key={book.id} className="p-2"> {/* Added padding around card */}
                  <BookCard book={book} />
                </div>
              ))}
            </Slider>
            <button className="custom-arrow custom-arrow-next" onClick={() => sliderRef.current?.slickNext()}>❯</button>
          </div>
        ) : (
          renderErrorState("No books currently on sale.")
        )}
      </section>

      {/* Featured Books Section */}
      <section>
        <h2 className="text-center mb-3">Featured Books</h2>
        {/* Bootstrap Nav Tabs */}
        <ul className="nav nav-tabs justify-content-center mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeFeaturedTab === 'recommended' ? 'active' : ''}`}
              onClick={() => setActiveFeaturedTab('recommended')}
            >
              Recommended
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeFeaturedTab === 'popular' ? 'active' : ''}`}
              onClick={() => setActiveFeaturedTab('popular')}
            >
              Popular
            </button>
          </li>
        </ul>

        {isLoadingFeatured ? (
          renderLoadingState()
        ) : featuredBooksToDisplay.length > 0 ? (
           <div className="featured-books-grid-container border rounded p-3">
             {renderBookGrid(featuredBooksToDisplay)}
           </div>
        ) : (
          renderErrorState(`No ${activeFeaturedTab} books available.`)
        )}
      </section>
    </div>
  );
}

export default HomePage;
