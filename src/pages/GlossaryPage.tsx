// src/pages/GlossaryPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../styles/GlossaryPage.css';

interface GlossaryTerm {
  id: number;
  term: string;
  definition: string;
  category: string;
}

const GlossaryPage: React.FC = () => {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [filteredTerms, setFilteredTerms] = useState<GlossaryTerm[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('все');
  const [categories, setCategories] = useState<string[]>(['все']);
  const [loading, setLoading] = useState(true);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Весь русский алфавит
  const russianAlphabet = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И', 'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т', 'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь', 'Э', 'Ю', 'Я'];

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await axios.get<GlossaryTerm[]>('http://localhost:5001/api/glossary');
        setTerms(response.data);
        setFilteredTerms(response.data);
        
        const uniqueCategoriesSet = new Set<string>();
        response.data.forEach(t => {
          if (t.category) {
            uniqueCategoriesSet.add(t.category);
          }
        });
        const uniqueCategories = ['все', ...Array.from(uniqueCategoriesSet)];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Ошибка загрузки глоссария:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  useEffect(() => {
    let filtered = terms;
    
    if (selectedCategory !== 'все') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(t => 
        t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.definition.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredTerms(filtered);
  }, [searchQuery, selectedCategory, terms]);

  // Группируем термины по первой букве
  const groupedTerms = filteredTerms.reduce((acc, term) => {
    const firstLetter = term.term.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(term);
    return acc;
  }, {} as Record<string, GlossaryTerm[]>);

  // Какие буквы присутствуют в терминах
  const availableLetters = new Set(Object.keys(groupedTerms));

  // Функция прокрутки к букве
  const scrollToLetter = (letter: string) => {
    const section = sectionRefs.current[letter];
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return <div className="glossary-page">Загрузка глоссария...</div>;
  }

  return (
    <div className="glossary-page">
      <div className="glossary-header">
        <h1>📖 Словарь</h1>
        <p>Словарь терминов по информатике. Найдите быстрое объяснение или используйте справочник как материал для повторения.</p>
      </div>

      <div className="glossary-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 ПОИСК ПО ТЕРМИНАМ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="categories-filter">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'все' ? '📚 все' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="glossary-layout">
        {/* Левая панель с буквами (весь алфавит) */}
        <div className="glossary-nav">
          <div className="nav-title">Алфавит</div>
          <div className="nav-letters">
            {russianAlphabet.map(letter => {
              const hasTerms = availableLetters.has(letter);
              return (
                <button
                  key={letter}
                  className={`nav-letter ${hasTerms ? 'active' : 'disabled'}`}
                  onClick={() => hasTerms && scrollToLetter(letter)}
                  disabled={!hasTerms}
                  title={hasTerms ? `Перейти к букве ${letter}` : `Нет терминов на букву ${letter}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Правая панель с контентом */}
        <div className="glossary-content">
          {russianAlphabet.map(letter => {
            const termsForLetter = groupedTerms[letter];
            if (!termsForLetter || termsForLetter.length === 0) return null;
            
            return (
              <div 
                key={letter} 
                className="glossary-section"
                ref={el => sectionRefs.current[letter] = el}
              >
                <h2 className="section-letter">{letter}</h2>
                <div className="terms-list">
                  {termsForLetter.map(term => (
                    <div key={term.id} className="term-card">
                      <h3 className="term-title">{term.term}</h3>
                      <p className="term-definition">{term.definition}</p>
                      <span className="term-category">{term.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {Object.keys(groupedTerms).length === 0 && (
            <div className="no-results">
              <p>😕 Ничего не найдено</p>
              <p>Попробуйте изменить поисковый запрос или выберите другую категорию</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlossaryPage;