// src/components/ForumList.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/ForumList.css';

interface Forum {
    id: number;
    subject: string;
    message: string;
    userId: number;
    username: string;
    courseId: string;
    createdAt: string;
    updatedAt: string;
}

interface Course {
    id: string;
    title: string;
    description: string;
}

const ForumList: React.FC = () => {
    const [forums, setForums] = useState<Forum[]>([]);
    const [course, setCourse] = useState<Course | null>(null);
    const [newForumSubject, setNewForumSubject] = useState('');
    const [newForumMessage, setNewForumMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const { userId, isAuthenticated, username } = useAuth();
    const { courseId } = useParams<{ courseId: string }>();

    useEffect(() => {
        console.log(`Загрузка форумов для курса: ${courseId}`);
        fetchCourseDetails();
        fetchForums();
    }, [courseId]);

    const fetchCourseDetails = async () => {
        try {
            const response = await axios.get<Course>(`http://localhost:5001/api/courses/${courseId}`);
            setCourse(response.data);
        } catch (error) {
            console.error('Ошибка загрузки деталей курса:', error);
        }
    };

    const fetchForums = async () => {
        try {
            console.log(`Отправка GET запроса на: http://localhost:5001/api/course/${courseId}/forums`);
            const response = await axios.get<Forum[]>(`http://localhost:5001/api/course/${courseId}/forums`);
            console.log('Форумы загружены:', response.data);
            setForums(response.data);
        } catch (error) {
            console.error('Ошибка загрузки форумов:', error);
        } finally {
            setLoading(false);
        }
    };

    const createForum = async () => {
        if (!isAuthenticated || !userId) {
            console.error('Пользователь не авторизован');
            alert('Необходимо войти в систему');
            return;
        }

        if (!newForumSubject.trim() || !newForumMessage.trim()) {
            alert('Заполните тему и сообщение');
            return;
        }

        const forumData = {
            subject: newForumSubject,
            message: newForumMessage,
            userId: userId,
            username: username || 'Пользователь',
            courseId: courseId,
        };

        try {
            const response = await axios.post<Forum>('http://localhost:5001/api/forum', forumData);
            setForums([response.data, ...forums]);
            setNewForumSubject('');
            setNewForumMessage('');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    console.error('Данные ошибки ответа:', error.response.data);
                    console.error('Статус ошибки ответа:', error.response.status);
                    alert(`Ошибка: ${error.response.data.error || 'Не удалось создать форум'}`);
                } else if (error.request) {
                    console.error('Данные запроса с ошибкой:', error.request);
                    alert('Нет ответа от сервера');
                } else {
                    console.error('Сообщение об ошибке:', error.message);
                    alert('Ошибка при создании форума');
                }
            } else {
                console.error('Неожиданная ошибка:', error);
                alert('Произошла непредвиденная ошибка');
            }
        }
    };

    if (loading) {
        return <div className="forum-list-container">Загрузка форумов...</div>;
    }

    return (
        <div className="forum-list-container">
            <h1 className="forum-list-header">Форумы курса «{course ? course.title : courseId}»</h1>
            
            {forums.length === 0 && <p className="no-forums-message">Форумы отсутствуют</p>}
            
            <ul>
                {forums.map(forum => (
                    <li key={forum.id} className="forum-item">
                        <Link to={`/course/${courseId}/forum/${forum.id}`} className="forum-link">
                            <div className="forum-subject">{forum.subject}</div>
                            <div className="forum-meta">
                                <span>Автор: {forum.username}</span>
                                <span>Дата: {new Date(forum.createdAt).toLocaleDateString('ru-RU')}</span>
                            </div>
                            <div className="forum-preview">{forum.message.substring(0, 100)}...</div>
                        </Link>
                    </li>
                ))}
            </ul>
            
            {isAuthenticated && (
                <div className="forum-inputs">
                    <h3>Создать новый форум</h3>
                    <input
                        type="text"
                        value={newForumSubject}
                        onChange={(e) => setNewForumSubject(e.target.value)}
                        placeholder="Тема нового форума"
                        className="forum-input"
                    />
                    <textarea
                        value={newForumMessage}
                        onChange={(e) => setNewForumMessage(e.target.value)}
                        placeholder="Сообщение форума"
                        className="forum-textarea"
                        rows={4}
                    />
                    <button onClick={createForum} className="create-forum-button">Создать форум</button>
                </div>
            )}
        </div>
    );
};

export default ForumList;