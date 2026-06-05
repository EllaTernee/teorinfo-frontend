// src/components/ForumDetail.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/ForumDetail.css';

interface Reply {
  id: string;
  content: string;
  userId: string;
  username: string;
  forumId: string;
  parentId: string | null;
  createdAt: string;
}

interface Forum {
  id: string;
  subject: string;
  message: string;
  userId: string;
  username: string;
  courseId: string;
  createdAt: string;
}

const ForumDetail: React.FC = () => {
  const params = useParams<{ courseId: string; forumId: string }>();
  const { courseId, forumId } = params;
  const [forum, setForum] = useState<Forum | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [mainReplyContent, setMainReplyContent] = useState('');
  const [nestedReplyContent, setNestedReplyContent] = useState('');
  const { userId, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [replyToId, setReplyToId] = useState<string | null>(null);

  useEffect(() => {
    if (courseId && forumId) {
      fetchForum();
      fetchReplies();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, forumId]);

  const fetchForum = async () => {
    try {
      const response = await axios.get<Forum>(`https://teorinfo-backend.onrender.com/api/forum/${forumId}`);
      setForum(response.data);
    } catch (error) {
      console.error('Ошибка загрузки форума:', error);
    }
  };

  const fetchReplies = async () => {
    try {
      const response = await axios.get<Reply[]>(`https://teorinfo-backend.onrender.com/api/forum/${forumId}/replies`);
      setReplies(response.data);
    } catch (error) {
      console.error('Ошибка загрузки ответов:', error);
    }
  };

  const createReply = async (content: string, parentId: string | null = null) => {
    if (!isAuthenticated || !userId || !forum?.id) {
      console.error('Пользователь не авторизован или отсутствуют данные');
      return;
    }

    try {
      const response = await axios.post<Reply>(`https://teorinfo-backend.onrender.com/api/forum/${forum?.id}/reply`, {
        content,
        userId,
        parentId,
      });
      setReplies([...replies, response.data]);
      if (parentId) {
        setNestedReplyContent('');
      } else {
        setMainReplyContent('');
      }
      setReplyToId(null);
    } catch (error) {
      console.error('Ошибка создания ответа:', error);
    }
  };

  const handleReplyClick = (replyId: string | null) => {
    setReplyToId(replyId);
    setNestedReplyContent('');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
  };

  const renderReplies = (parentId: string | null = null) => {
    return replies
      .filter(reply => reply.parentId === parentId)
      .map(reply => (
        <div key={reply.id} className="reply-card">
          <div className="reply-header">
            <strong>{reply.username}</strong>
            <span className="reply-date">{formatDate(reply.createdAt)}</span>
          </div>
          <div className="reply-content">{reply.content}</div>
          {isAuthenticated && (
            <button className="reply-action-btn" onClick={() => handleReplyClick(reply.id)}>
              💬 Ответить
            </button>
          )}
          {reply.id === replyToId && (
            <div className="reply-form">
              <textarea
                value={nestedReplyContent}
                onChange={(e) => setNestedReplyContent(e.target.value)}
                placeholder="Напишите ваш ответ"
                rows={3}
              />
              <button onClick={() => createReply(nestedReplyContent, reply.id)}>
                Отправить
              </button>
            </div>
          )}
          <div className="nested-replies">
            {renderReplies(reply.id)}
          </div>
        </div>
      ));
  };

  if (!forum) {
    return <div className="forum-detail-loading">Загрузка форума...</div>;
  }

  return (
    <div className="forum-detail-page">
      <div className="forum-detail-container">
        <button onClick={handleBack} className="back-btn">
          ← Назад к форумам
        </button>

        {/* Основной пост */}
        <div className="forum-main-post">
          <div className="forum-header">
            <h1>{forum.subject}</h1>
            <div className="forum-meta">
              <span>👤 {forum.username}</span>
              <span>📅 {formatDate(forum.createdAt)}</span>
            </div>
          </div>
          <div className="forum-message">
            <p>{forum.message}</p>
          </div>
        </div>

        {/* Форма ответа */}
        {isAuthenticated ? (
          <div className="reply-form-section">
            <h3>Напишите ответ</h3>
            <textarea
              value={mainReplyContent}
              onChange={(e) => setMainReplyContent(e.target.value)}
              placeholder="Поделитесь своим мнением..."
              rows={4}
            />
            <button onClick={() => createReply(mainReplyContent)} className="submit-reply-btn">
              📨 Отправить ответ
            </button>
          </div>
        ) : (
          <div className="login-prompt">
            <p>
              <Link to="/login">Войдите</Link> или <Link to="/register">зарегистрируйтесь</Link>, чтобы оставить комментарий
            </p>
          </div>
        )}

        {/* Список ответов */}
        <div className="replies-section">
          <h3>Ответы ({replies.length})</h3>
          <div className="replies-list">
            {renderReplies()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumDetail;