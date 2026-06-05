// src/pages/ReviewPage.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ReviewList from '../components/ReviewList';
import SubmitReview from '../components/SubmitReview';
import debounce from 'lodash/debounce';
import '../styles/ReviewPage.css';

interface Review {
  id: number;
  userId: number;
  courseId: number;
  rating: number;
  comment?: string;
  User: { id: number; username: string };
}

const ReviewPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<{ id: number, title: string } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  const fetchSearchResults = async (query: string) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/courses/search?search=${query}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Ошибка поиска курсов:', error);
    }
  };

  const debouncedFetchSearchResults = debounce(fetchSearchResults, 300);

  useEffect(() => {
    if (searchQuery) {
      debouncedFetchSearchResults(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleReviewSubmitted = (newReview: Review) => {
    setReviews((prevReviews) => [...prevReviews, newReview]);
  };

  useEffect(() => {
    if (selectedCourse) {
      const fetchReviews = async () => {
        try {
          const response = await axios.get(`http://localhost:5001/api/courses/${selectedCourse.id}/reviews`);
          setReviews(response.data);
        } catch (error) {
          console.error('Ошибка загрузки отзывов:', error);
        }
      };

      fetchReviews();
    }
  }, [selectedCourse]);

  return (
    <div className="review-page">
      <h2>Отзывы</h2>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Поиск курса"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">Найти</button>
      </form>

      {searchResults.length > 0 && (
        <ul className="search-results">
          {searchResults.map((course) => (
            <li key={course.id}>
              <Link to="#" onClick={() => setSelectedCourse({ id: course.id, title: course.title })} className="course-link">
                {course.title}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {selectedCourse && (
        <>
          <ReviewList courseId={selectedCourse.id} courseTitle={selectedCourse.title} reviews={reviews} />
          <SubmitReview courseId={selectedCourse.id} onReviewSubmitted={handleReviewSubmitted} />
        </>
      )}

      <Link to="/courses" className="back-link">Назад к курсам</Link>
    </div>
  );
};

export default ReviewPage;