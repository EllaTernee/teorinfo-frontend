// src/pages/AdminCoursesPage.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminCoursesPage.css';

interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface GlossaryTerm {
  id: number;
  term: string;
  definition: string;
  category: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: string;
  requirementValue: number;
  isHidden: boolean;
  points: number;
}

type Tab = 'courses' | 'lessons' | 'questions' | 'glossary' | 'achievements';

const AdminCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('courses');
  
  // Формы
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({ id: '', title: '', description: '', icon: '📚' });

  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState({ id: '', title: '', content: '', order: 1 });

  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState({ question: '', options: ['', '', '', ''], answer: '', explanation: '' });

  const [showGlossaryForm, setShowGlossaryForm] = useState(false);
  const [editingGlossary, setEditingGlossary] = useState<GlossaryTerm | null>(null);
  const [glossaryForm, setGlossaryForm] = useState({ term: '', definition: '', category: 'general' });

  const [showAchievementForm, setShowAchievementForm] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [achievementForm, setAchievementForm] = useState({ 
    id: '', 
    title: '', 
    description: '', 
    icon: '🏆', 
    requirement: 'lessons_completed', 
    requirementValue: 1, 
    isHidden: false, 
    points: 50 
  });

  const { token, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role !== 'admin') {
      navigate('/');
      return;
    }
    fetchAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, selectedCourseId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [coursesRes] = await Promise.all([
        axios.get('https://teorinfo-backend.onrender.com/api/courses'),
      ]);
      const sortedCourses = coursesRes.data.sort((a: Course, b: Course) => a.title.localeCompare(b.title));
      setCourses(sortedCourses);
      
      if (selectedCourseId) {
        try {
          const lessonsRes = await axios.get(`https://teorinfo-backend.onrender.com/api/courses/${selectedCourseId}/lessons`);
          setLessons(lessonsRes.data);
        } catch (error) {
          setLessons([]);
        }
        
        try {
          const questionsRes = await axios.get(`https://teorinfo-backend.onrender.com/api/quizzes/${selectedCourseId}`);
          setQuestions(questionsRes.data);
        } catch (error) {
          setQuestions([]);
        }
      }
      
      const [glossaryRes, achievementsRes] = await Promise.all([
        axios.get('https://teorinfo-backend.onrender.com/api/glossary'),
        axios.get('https://teorinfo-backend.onrender.com/api/achievements', {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);
      setGlossaryTerms(glossaryRes.data);
      setAchievements(achievementsRes.data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== КУРСЫ ==========
  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await axios.put(`https://teorinfo-backend.onrender.com/api/admin/courses/${editingCourse.id}`, courseForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('https://teorinfo-backend.onrender.com/api/admin/courses', courseForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowCourseForm(false);
      setEditingCourse(null);
      setCourseForm({ id: '', title: '', description: '', icon: '📚' });
      fetchAllData();
    } catch (error) {
      console.error('Ошибка сохранения курса:', error);
      alert('Ошибка сохранения');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Удалить курс? Это удалит все связанные уроки и вопросы.')) return;
    try {
      await axios.delete(`https://teorinfo-backend.onrender.com/api/admin/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (selectedCourseId === courseId) setSelectedCourseId('');
      fetchAllData();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка удаления');
    }
  };

  // ========== УРОКИ ==========
  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    try {
      if (editingLesson) {
        await axios.put(`https://teorinfo-backend.onrender.com/api/admin/lessons/${editingLesson.id}`, { ...lessonForm, courseId: selectedCourseId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('https://teorinfo-backend.onrender.com/api/admin/lessons', { ...lessonForm, courseId: selectedCourseId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowLessonForm(false);
      setEditingLesson(null);
      setLessonForm({ id: '', title: '', content: '', order: 1 });
      fetchAllData();
    } catch (error) {
      console.error('Ошибка сохранения урока:', error);
      alert('Ошибка сохранения');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!window.confirm('Удалить урок?')) return;
    try {
      await axios.delete(`https://teorinfo-backend.onrender.com/api/admin/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAllData();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка удаления');
    }
  };

  // ========== ВОПРОСЫ ==========
  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    try {
      const data = { ...questionForm, courseId: selectedCourseId };
      if (editingQuestion) {
        await axios.put(`https://teorinfo-backend.onrender.com/api/admin/questions/${editingQuestion.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('https://teorinfo-backend.onrender.com/api/admin/questions', data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowQuestionForm(false);
      setEditingQuestion(null);
      setQuestionForm({ question: '', options: ['', '', '', ''], answer: '', explanation: '' });
      fetchAllData();
    } catch (error) {
      console.error('Ошибка сохранения вопроса:', error);
      alert('Ошибка сохранения');
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!window.confirm('Удалить вопрос?')) return;
    try {
      await axios.delete(`https://teorinfo-backend.onrender.com/api/admin/questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAllData();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка удаления');
    }
  };

  // ========== ГЛОССАРИЙ ==========
  const handleGlossarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGlossary) {
        await axios.put(`https://teorinfo-backend.onrender.com/api/admin/glossary/${editingGlossary.id}`, glossaryForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('https://teorinfo-backend.onrender.com/api/admin/glossary', glossaryForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowGlossaryForm(false);
      setEditingGlossary(null);
      setGlossaryForm({ term: '', definition: '', category: 'general' });
      fetchAllData();
    } catch (error) {
      console.error('Ошибка сохранения термина:', error);
      alert('Ошибка сохранения');
    }
  };

  const handleDeleteGlossary = async (termId: number) => {
    if (!window.confirm('Удалить термин?')) return;
    try {
      await axios.delete(`https://teorinfo-backend.onrender.com/api/admin/glossary/${termId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAllData();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка удаления');
    }
  };

  // ========== ДОСТИЖЕНИЯ ==========
  const handleAchievementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAchievement) {
        await axios.put(`https://teorinfo-backend.onrender.com/api/admin/achievements/${editingAchievement.id}`, achievementForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('https://teorinfo-backend.onrender.com/api/admin/achievements', achievementForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowAchievementForm(false);
      setEditingAchievement(null);
      setAchievementForm({ 
        id: '', 
        title: '', 
        description: '', 
        icon: '🏆', 
        requirement: 'lessons_completed', 
        requirementValue: 1, 
        isHidden: false, 
        points: 50 
      });
      fetchAllData();
    } catch (error) {
      console.error('Ошибка сохранения достижения:', error);
      alert('Ошибка сохранения');
    }
  };

  const handleDeleteAchievement = async (achievementId: string) => {
    if (!window.confirm('Удалить достижение?')) return;
    try {
      await axios.delete(`https://teorinfo-backend.onrender.com/api/admin/achievements/${achievementId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAllData();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка удаления');
    }
  };

  if (loading) return <div className="admin-courses">Загрузка...</div>;

  return (
    <div className="admin-courses">
      <div className="admin-header">
        <h1>Управление контентом</h1>
      </div>

      <div className="admin-tabs">
        <button className={activeTab === 'courses' ? 'tab active' : 'tab'} onClick={() => setActiveTab('courses')}>📋 Курсы</button>
        <button className={activeTab === 'lessons' ? 'tab active' : 'tab'} onClick={() => setActiveTab('lessons')}>📖 Уроки</button>
        <button className={activeTab === 'questions' ? 'tab active' : 'tab'} onClick={() => setActiveTab('questions')}>❓ Вопросы</button>
        <button className={activeTab === 'glossary' ? 'tab active' : 'tab'} onClick={() => setActiveTab('glossary')}>📚 Глоссарий</button>
        <button className={activeTab === 'achievements' ? 'tab active' : 'tab'} onClick={() => setActiveTab('achievements')}>🏆 Достижения</button>
      </div>

      {/* КУРСЫ */}
      {activeTab === 'courses' && (
        <div className="tab-content">
          <button className="btn-add" onClick={() => { setShowCourseForm(true); setEditingCourse(null); setCourseForm({ id: '', title: '', description: '', icon: '📚' }); }}>
            + Создать курс
          </button>

          {showCourseForm && (
            <div className="edit-form">
              <h3>{editingCourse ? '✏️ Редактировать курс' : '➕ Новый курс'}</h3>
              <form onSubmit={handleCourseSubmit}>
                <div className="form-group">
                  <label>🔑 ID курса (латиницей, уникальный)</label>
                  <input type="text" value={courseForm.id} onChange={(e) => setCourseForm({ ...courseForm, id: e.target.value })} required disabled={!!editingCourse} placeholder="например: programming-basics" />
                  <small>Будет использоваться в URL. Нельзя изменить после создания.</small>
                </div>
                <div className="form-group">
                  <label>📝 Название курса</label>
                  <input type="text" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} required placeholder="Например: Основы программирования" />
                </div>
                <div className="form-group">
                  <label>📖 Описание курса</label>
                  <textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} rows={4} required placeholder="Что будет изучаться в этом курсе?" />
                </div>
                <div className="form-group">
                  <label>🎨 Иконка курса</label>
                  <select value={courseForm.icon} onChange={(e) => setCourseForm({ ...courseForm, icon: e.target.value })} required>
                    <option value="📚">📚</option>
                    <option value="💻">💻</option>
                    <option value="🔢">🔢</option>
                    <option value="🌐">🌐</option>
                    <option value="📊">📊</option>
                    <option value="🎓">🎓</option>
                    <option value="🤖">🤖</option>
                    <option value="🔐">🔐</option>
                    <option value="📈">📈</option>
                    <option value="🎮">🎮</option>
                    <option value="📖">📖</option>
                    <option value="🏆">🏆</option>
                    <option value="⚙️">⚙️</option>
                    <option value="🐍">🐍</option>
                    <option value="☕">☕</option>
                    <option value="📱">📱</option>
                    <option value="🎨">🎨</option>
                    <option value="🎵">🎵</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-save">💾 Сохранить</button>
                  <button type="button" className="btn-cancel" onClick={() => { setShowCourseForm(false); setEditingCourse(null); }}>❌ Отмена</button>
                </div>
              </form>
            </div>
          )}

          <div className="data-table">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Иконка</th>
                  <th>Название</th>
                  <th>Описание</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.id}>
                    <td>{course.id}</td>
                    <td style={{ fontSize: '24px' }}>{course.icon}</td>
                    <td>{course.title}</td>
                    <td className="desc-cell">{course.description.substring(0, 50)}...</td>
                    <td>
                      <button className="btn-edit" onClick={() => { setEditingCourse(course); setCourseForm(course); setShowCourseForm(true); }}>✏️</button>
                      <button className="btn-delete" onClick={() => handleDeleteCourse(course.id)}>🗑️</button>
                      <button className="btn-select" onClick={() => { setSelectedCourseId(course.id); setActiveTab('lessons'); }}>📖 Уроки</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* УРОКИ */}
      {activeTab === 'lessons' && (
        <div className="tab-content">
          <div className="course-selector">
            <label>📚 Выберите курс:</label>
            <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
              <option value="">-- Выберите курс --</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          {selectedCourseId && (
            <>
              <button className="btn-add" onClick={() => { setShowLessonForm(true); setEditingLesson(null); setLessonForm({ id: '', title: '', content: '', order: lessons.length + 1 }); }}>
                + Добавить урок
              </button>

              {showLessonForm && (
                <div className="edit-form">
                  <h3>{editingLesson ? '✏️ Редактировать урок' : '➕ Новый урок'}</h3>
                  <form onSubmit={handleLessonSubmit}>
                    <div className="form-group">
                      <label>🔑 ID урока (латиницей)</label>
                      <input type="text" value={lessonForm.id} onChange={(e) => setLessonForm({ ...lessonForm, id: e.target.value })} required disabled={!!editingLesson} placeholder="например: lesson-1" />
                    </div>
                    <div className="form-group">
                      <label>📝 Название урока</label>
                      <input type="text" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} required placeholder="01. Введение в тему" />
                    </div>
                    <div className="form-group">
                      <label>📄 Содержание урока</label>
                      <textarea value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} rows={6} required placeholder="Текст урока..." />
                    </div>
                    <div className="form-group">
                      <label>🔢 Порядок урока</label>
                      <input type="number" value={lessonForm.order} onChange={(e) => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) })} placeholder="1" />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-save">💾 Сохранить</button>
                      <button type="button" className="btn-cancel" onClick={() => { setShowLessonForm(false); setEditingLesson(null); }}>❌ Отмена</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="data-table">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Порядок</th>
                      <th>Название урока</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessons.sort((a,b) => a.order - b.order).map(lesson => (
                      <tr key={lesson.id}>
                        <td>{lesson.id}</td>
                        <td>{lesson.order}</td>
                        <td>{lesson.title}</td>
                        <td>
                          <button className="btn-edit" onClick={() => { setEditingLesson(lesson); setLessonForm(lesson); setShowLessonForm(true); }}>✏️</button>
                          <button className="btn-delete" onClick={() => handleDeleteLesson(lesson.id)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ВОПРОСЫ */}
      {activeTab === 'questions' && (
        <div className="tab-content">
          <div className="course-selector">
            <label>📚 Выберите курс:</label>
            <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
              <option value="">-- Выберите курс --</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          {selectedCourseId && (
            <>
              <button className="btn-add" onClick={() => { setShowQuestionForm(true); setEditingQuestion(null); setQuestionForm({ question: '', options: ['', '', '', ''], answer: '', explanation: '' }); }}>
                + Добавить вопрос
              </button>

              {showQuestionForm && (
                <div className="edit-form">
                  <h3>{editingQuestion ? '✏️ Редактировать вопрос' : '➕ Новый вопрос'}</h3>
                  <form onSubmit={handleQuestionSubmit}>
                    <div className="form-group">
                      <label>❓ Текст вопроса</label>
                      <textarea value={questionForm.question} onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })} rows={2} required placeholder="Введите вопрос..." />
                    </div>
                    <div className="form-group">
                      <label>📋 Варианты ответов</label>
                      {[0,1,2,3].map(i => (
                        <input key={i} type="text" placeholder={`Вариант ${i+1}`} value={questionForm.options[i]} onChange={(e) => {
                          const newOpts = [...questionForm.options];
                          newOpts[i] = e.target.value;
                          setQuestionForm({ ...questionForm, options: newOpts });
                        }} required />
                      ))}
                    </div>
                    <div className="form-group">
                      <label>✅ Правильный ответ</label>
                      <input type="text" value={questionForm.answer} onChange={(e) => setQuestionForm({ ...questionForm, answer: e.target.value })} required placeholder="Точно как в варианте ответа" />
                    </div>
                    <div className="form-group">
                      <label>💡 Пояснение (почему этот ответ правильный)</label>
                      <textarea value={questionForm.explanation} onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })} rows={2} placeholder="Объяснение..." />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-save">💾 Сохранить</button>
                      <button type="button" className="btn-cancel" onClick={() => { setShowQuestionForm(false); setEditingQuestion(null); }}>❌ Отмена</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="data-table">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Вопрос</th>
                      <th>Правильный ответ</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map(q => (
                      <tr key={q.id}>
                        <td className="desc-cell">{q.question.substring(0, 60)}...</td>
                        <td>{q.answer}</td>
                        <td>
                          <button className="btn-edit" onClick={() => { setEditingQuestion(q); setQuestionForm(q); setShowQuestionForm(true); }}>✏️</button>
                          <button className="btn-delete" onClick={() => handleDeleteQuestion(q.id)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ГЛОССАРИЙ */}
      {activeTab === 'glossary' && (
        <div className="tab-content">
          <button className="btn-add" onClick={() => { setShowGlossaryForm(true); setEditingGlossary(null); setGlossaryForm({ term: '', definition: '', category: 'general' }); }}>
            + Добавить термин
          </button>

          {showGlossaryForm && (
            <div className="edit-form">
              <h3>{editingGlossary ? '✏️ Редактировать термин' : '➕ Новый термин'}</h3>
              <form onSubmit={handleGlossarySubmit}>
                <div className="form-group">
                  <label>📖 Термин</label>
                  <input type="text" value={glossaryForm.term} onChange={(e) => setGlossaryForm({ ...glossaryForm, term: e.target.value })} required placeholder="Например: Алгоритм" />
                </div>
                <div className="form-group">
                  <label>📝 Определение</label>
                  <textarea value={glossaryForm.definition} onChange={(e) => setGlossaryForm({ ...glossaryForm, definition: e.target.value })} rows={3} required placeholder="Определение термина..." />
                </div>
                <div className="form-group">
                  <label>🏷️ Категория</label>
                  <input type="text" value={glossaryForm.category} onChange={(e) => setGlossaryForm({ ...glossaryForm, category: e.target.value })} placeholder="programming, web, algorithms..." />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-save">💾 Сохранить</button>
                  <button type="button" className="btn-cancel" onClick={() => { setShowGlossaryForm(false); setEditingGlossary(null); }}>❌ Отмена</button>
                </div>
              </form>
            </div>
          )}

          <div className="data-table">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Термин</th>
                  <th>Определение</th>
                  <th>Категория</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {glossaryTerms.map(term => (
                  <tr key={term.id}>
                    <td>{term.term}</td>
                    <td className="desc-cell">{term.definition.substring(0, 60)}...</td>
                    <td>{term.category}</td>
                    <td>
                      <button className="btn-edit" onClick={() => { setEditingGlossary(term); setGlossaryForm(term); setShowGlossaryForm(true); }}>✏️</button>
                      <button className="btn-delete" onClick={() => handleDeleteGlossary(term.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ДОСТИЖЕНИЯ */}
      {activeTab === 'achievements' && (
        <div className="tab-content">
          <button className="btn-add" onClick={() => { setShowAchievementForm(true); setEditingAchievement(null); setAchievementForm({ id: '', title: '', description: '', icon: '🏆', requirement: 'lessons_completed', requirementValue: 1, isHidden: false, points: 50 }); }}>
            + Добавить достижение
          </button>

          {showAchievementForm && (
            <div className="edit-form">
              <h3>{editingAchievement ? '✏️ Редактировать достижение' : '➕ Новое достижение'}</h3>
              <form onSubmit={handleAchievementSubmit}>
                <div className="form-group">
                  <label>🔑 ID (латиницей, уникальный)</label>
                  <input type="text" value={achievementForm.id} onChange={(e) => setAchievementForm({ ...achievementForm, id: e.target.value })} required disabled={!!editingAchievement} placeholder="например: first-step" />
                </div>
                <div className="form-group">
                  <label>🏆 Название достижения</label>
                  <input type="text" value={achievementForm.title} onChange={(e) => setAchievementForm({ ...achievementForm, title: e.target.value })} required placeholder="Первый шаг" />
                </div>
                <div className="form-group">
                  <label>📝 Описание</label>
                  <textarea value={achievementForm.description} onChange={(e) => setAchievementForm({ ...achievementForm, description: e.target.value })} rows={2} required placeholder="Описание достижения..." />
                </div>
                <div className="form-group">
                  <label>🎨 Иконка (эмодзи)</label>
                  <input type="text" value={achievementForm.icon} onChange={(e) => setAchievementForm({ ...achievementForm, icon: e.target.value })} placeholder="🏆" />
                </div>
                <div className="form-group">
                  <label>📊 Тип требования</label>
                  <select value={achievementForm.requirement} onChange={(e) => setAchievementForm({ ...achievementForm, requirement: e.target.value })}>
                    <option value="lessons_completed">Количество пройденных уроков</option>
                    <option value="questions_answered">Количество отвеченных вопросов</option>
                    <option value="perfect_course">Идеальное прохождение курса</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>🔢 Значение требования</label>
                  <input type="number" value={achievementForm.requirementValue} onChange={(e) => setAchievementForm({ ...achievementForm, requirementValue: parseInt(e.target.value) || 1 })} placeholder="1" min="1" />
                </div>
                <div className="form-group">
                  <label>⭐ Очки за достижение</label>
                  <input type="number" value={achievementForm.points} onChange={(e) => setAchievementForm({ ...achievementForm, points: parseInt(e.target.value) || 50 })} placeholder="50" min="10" />
                </div>
                <div className="form-group checkbox">
                  <label>
                    <input type="checkbox" checked={achievementForm.isHidden} onChange={(e) => setAchievementForm({ ...achievementForm, isHidden: e.target.checked })} />
                    🔒 Скрытое достижение
                  </label>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-save">💾 Сохранить</button>
                  <button type="button" className="btn-cancel" onClick={() => { setShowAchievementForm(false); setEditingAchievement(null); }}>❌ Отмена</button>
                </div>
              </form>
            </div>
          )}

          <div className="data-table">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Иконка</th>
                  <th>Название</th>
                  <th>Требование</th>
                  <th>Очки</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {achievements.map(ach => (
                  <tr key={ach.id}>
                    <td>{ach.id}</td>
                    <td style={{ fontSize: '24px' }}>{ach.icon}</td>
                    <td>{ach.title}</td>
                    <td>{ach.requirement}: {ach.requirementValue}</td>
                    <td>{ach.points}</td>
                    <td>
                      <button className="btn-edit" onClick={() => { setEditingAchievement(ach); setAchievementForm(ach); setShowAchievementForm(true); }}>✏️</button>
                      <button className="btn-delete" onClick={() => handleDeleteAchievement(ach.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoursesPage;