// src/components/SubmitReview.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/SubmitReview.css';

interface Review {
  id: number;
  userId: number;
  courseId: number;
  rating: number;
  comment?: string;
  User: { id: number; username: string };
}

interface SubmitReviewProps {
  courseId: number;
  onReviewSubmitted: (review: Review) => void;
}

const SubmitReview: React.FC<SubmitReviewProps> = ({ courseId, onReviewSubmitted }) => {
  const { userId, isAuthenticated } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !userId) {
      setError('Необходимо войти в систему, чтобы оставить отзыв.');
      return;
    }

    try {
      const response = await axios.post('https://teorinfo-backend.onrender.com/api/reviews', {
        userId,
        courseId,
        rating,
        comment,
      });

      setRating(0);
      setComment('');
      setError(null);

      onReviewSubmitted(response.data.review);
    } catch (error: any) {
      console.error('Ошибка отправки отзыва:', error);
      setError(error.response?.data?.message || 'Не удалось отправить отзыв. Пожалуйста, попробуйте снова.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="submit-review-form">
      <div className="form-group">
        <label>Оценка:</label>
        <input
          type="number"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          min="1"
          max="5"
          className="rating-input"
        />
      </div>
      <div className="form-group">
        <label>Комментарий:</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="comment-input"
        />
      </div>
      {error && <p className="error-message">{error}</p>}
      <button type="submit" className="submit-button">Отправить отзыв</button>
    </form>
  );
};

export default SubmitReview;