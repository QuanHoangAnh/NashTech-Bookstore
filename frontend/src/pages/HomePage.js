import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import "slick-carousel/slick/slick.css";
import Slider from 'react-slick';
import apiService from '../services/api';
import BookCard from '../components/BookCard';
import './HomePage.css';

function HomePage() {
  const [onSaleBooks, setOnSaleBooks] = useState([]);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [activeFeaturedTab, setActiveFeaturedTab] = useState('recommended');
  const [loadingSale, setLoadingSale] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);

  const navigate = useNavigate();
  const onSaleSliderRef = useRef(null);

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

  const handleViewAllClick = (sortType = 'on_sale_home') => {
    navigate('/shop', { state: { initialSort: sortType } });
  };

  const sliderSettings = {
    dots: true,
    infinite: onSaleBooks.length > 4,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    pauseOnHover: true,
    arrows: false,
    responsive: [
      { breakpoint: 1200, settings: { slidesToShow: 4, slidesToScroll: 1, dots: true } },
      { breakpoint: 992, settings: { slidesToShow: 3, slidesToScroll: 1, dots: true } },
      { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 1, dots: true } },
      { breakpoint: 576, settings: { slidesToShow: 1, slidesToScroll: 1, dots: true } }
    ]
  };

  const featuredBooksToDisplay = activeFeaturedTab === 'recommended' ? recommendedBooks : popularBooks;
  const isLoadingFeatured = activeFeaturedTab === 'recommended' ? loadingRecommended : loadingPopular;

  const renderBookGrid = (books) => (
    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
      {books.map(book => (
        <div className="col" key={book.id}>
          <BookCard book={book} />
        </div>
      ))}
    </div>
  );

  const renderLoadingState = () => (
    <div className="text-center p-4">
      <div className="spinner-border text-primary" role="status">
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
    <div className="container-fluid px-4 px-md-5 my-5 homepage">
      {/* On Sale Section */}
      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="m-0 fw-bold">On Sale</h2>
          <button onClick={() => handleViewAllClick('on_sale_home')} className="btn btn-outline-primary btn-sm view-all-button-custom">
            View All <span className="arrow">▸</span>
          </button>
        </div>
        {loadingSale ? (
          renderLoadingState()
        ) : onSaleBooks.length > 0 ? (
          <div className="slider-container position-relative px-5 py-3 bg-white rounded shadow-sm">
            <button className="custom-arrow custom-arrow-prev" onClick={() => onSaleSliderRef.current?.slickPrev()}>❮</button>
            <Slider ref={onSaleSliderRef} {...sliderSettings}>
              {onSaleBooks.map(book => (
                <div key={book.id} className="px-2">
                  <BookCard book={book} />
                </div>
              ))}
            </Slider>
            <button className="custom-arrow custom-arrow-next" onClick={() => onSaleSliderRef.current?.slickNext()}>❯</button>
          </div>
        ) : (
          renderErrorState("No books currently on sale.")
        )}
      </section>

      {/* Featured Books Section */}
      <section className="mb-5">
        <h2 className="text-center fw-bold mb-4">Featured Books</h2>
        <ul className="nav nav-pills justify-content-center mb-4">
          <li className="nav-item mx-1">
            <button
              className={`nav-link px-4 ${activeFeaturedTab === 'recommended' ? 'active' : ''}`}
              onClick={() => setActiveFeaturedTab('recommended')}
            >
              Recommended
            </button>
          </li>
          <li className="nav-item mx-1">
            <button
              className={`nav-link px-4 ${activeFeaturedTab === 'popular' ? 'active' : ''}`}
              onClick={() => setActiveFeaturedTab('popular')}
            >
              Popular
            </button>
          </li>
        </ul>

        <div className="d-flex justify-content-end mb-3">
          <button 
            onClick={() => handleViewAllClick(activeFeaturedTab === 'recommended' ? 'recommended' : 'popularity')} 
            className="btn btn-outline-primary btn-sm view-all-button-custom"
          >
            View All <span className="arrow">▸</span>
          </button>
        </div>

        {isLoadingFeatured ? (
          renderLoadingState()
        ) : featuredBooksToDisplay.length > 0 ? (
           <div className="featured-books-grid-container border rounded p-4 bg-white shadow-sm">
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




