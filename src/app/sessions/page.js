'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
  getSessions, 
  createSession, 
  updateSession, 
  deleteSession 
} from '../../lib/sessionStorage';
import { getExercises } from '../../lib/exerciseStorage';
import { getStories, isStoryId } from '../../lib/storyStorage';
import { getPracticals, isPracticalId } from '../../lib/practicalStorage';
import { getStoryBooks } from '../../lib/storyBookStorage';

const CATEGORIES = ['Morgen', 'Abend', 'Kraft', 'Entspannung', 'Balance'];
const LEVELS = ['Anfänger', 'Fortgeschritten', 'Alle Levels'];

// Card type constants
const CARD_TYPES = {
  EXERCISE: 'exercise',
  STORY: 'story',
  PRACTICAL: 'practical'
};

// Card type configuration
const CARD_TYPE_CONFIG = {
  [CARD_TYPES.EXERCISE]: {
    icon: '💪',
    label: 'Exercise',
    color: '#2d7a6f',
    timeField: 'duration_minutes',
    categoryField: 'category'
  },
  [CARD_TYPES.STORY]: {
    icon: '📖',
    label: 'Story',
    color: '#c17f59',
    timeField: 'time',
    categoryField: 'mood'
  },
  [CARD_TYPES.PRACTICAL]: {
    icon: '🔔',
    label: 'Practical',
    color: '#5a9e7a',
    timeField: 'time',
    categoryField: null
  }
};

// Helper function to determine card type from ID
function getCardType(id) {
  if (isStoryId(id)) return CARD_TYPES.STORY;
  if (isPracticalId(id)) return CARD_TYPES.PRACTICAL;
  return CARD_TYPES.EXERCISE;
}

// Normalize cards to a common format using CARD_TYPE_CONFIG
function normalizeCard(item, type) {
  const config = CARD_TYPE_CONFIG[type];
  return {
    id: item.id,
    title: item.title,
    time: item[config.timeField] || 0,
    type: type,
    tags: item.tags || [],
    category: config.categoryField ? item[config.categoryField] : null,
    originalItem: item
  };
}

function SessionForm({ session, exercises, stories, practicals, storyBooks, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: session?.title || '',
    description: session?.description || '',
    story: session?.story || '',
    duration_minutes: session?.duration_minutes || 30,
    exercises: session?.exercises || [],
    category: session?.category || CATEGORIES[0],
    level: session?.level || LEVELS[0]
  });
  const [errors, setErrors] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([CARD_TYPES.EXERCISE, CARD_TYPES.STORY, CARD_TYPES.PRACTICAL]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [draggedCard, setDraggedCard] = useState(null);
  const [showAllTags, setShowAllTags] = useState(false);
  const VISIBLE_TAGS_COUNT = 8;

  // Normalize all cards into a unified list
  const allCards = useMemo(() => {
    const normalizedExercises = exercises.map(e => normalizeCard(e, CARD_TYPES.EXERCISE));
    const normalizedStories = stories.map(s => normalizeCard(s, CARD_TYPES.STORY));
    const normalizedPracticals = practicals.map(p => normalizeCard(p, CARD_TYPES.PRACTICAL));
    return [...normalizedExercises, ...normalizedStories, ...normalizedPracticals];
  }, [exercises, stories, practicals]);

  // Get all unique tags from cards
  const allTags = useMemo(() => {
    const tags = new Set();
    allCards.forEach(card => {
      card.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [allCards]);

  // Filter cards based on search, types, and tags
  const filteredCards = useMemo(() => {
    return allCards.filter(card => {
      // Filter by type
      if (!selectedTypes.includes(card.type)) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = card.title.toLowerCase().includes(query);
        if (!matchesTitle) {
          return false;
        }
      }
      
      // Filter by tags
      if (selectedTags.length > 0) {
        const hasSelectedTag = selectedTags.some(tag => card.tags.includes(tag));
        if (!hasSelectedTag) {
          return false;
        }
      }
      
      return true;
    });
  }, [allCards, searchQuery, selectedTypes, selectedTags]);

  // Create lookup map for all items
  const itemMap = useMemo(() => {
    const map = new Map();
    exercises.forEach(e => map.set(e.id, e));
    stories.forEach(s => map.set(s.id, s));
    practicals.forEach(p => map.set(p.id, p));
    return map;
  }, [exercises, stories, practicals]);

  // Create story lookup map for storybooks
  const storyMap = useMemo(() => {
    return new Map(stories.map(s => [s.id, s]));
  }, [stories]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleAddCard = (cardId) => {
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, cardId]
    }));
  };

  const handleAddStoryBook = (storyBook) => {
    // Add all stories from the story book to the session
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, ...storyBook.storyIds]
    }));
  };

  const handleRemoveCard = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Drag from card container
  const handleCardDragStart = (e, card) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', card.id);
  };

  const handleCardDragEnd = () => {
    setDraggedCard(null);
  };

  // Drag within selected items list
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedCard ? 'copy' : 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    // Handle drop from card container
    if (draggedCard) {
      setFormData(prev => {
        const newExercises = [...prev.exercises];
        newExercises.splice(dropIndex, 0, draggedCard.id);
        return { ...prev, exercises: newExercises };
      });
      setDraggedCard(null);
      return;
    }
    
    // Handle reorder within list
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    setFormData(prev => {
      const newExercises = [...prev.exercises];
      const [draggedItem] = newExercises.splice(draggedIndex, 1);
      newExercises.splice(dropIndex, 0, draggedItem);
      return { ...prev, exercises: newExercises };
    });
    
    setDraggedIndex(null);
  };

  const handleDropOnList = (e) => {
    e.preventDefault();
    
    // Handle drop from card container to end of list
    if (draggedCard) {
      handleAddCard(draggedCard.id);
      setDraggedCard(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Touch event handlers for mobile drag and drop
  const touchStartY = useRef(null);
  const touchStartX = useRef(null);
  const touchStartTime = useRef(null);
  const longPressTimer = useRef(null);
  const [isDraggingTouch, setIsDraggingTouch] = useState(false);
  const [touchDraggedCardIndex, setTouchDraggedCardIndex] = useState(null);
  const [touchDropIndicator, setTouchDropIndicator] = useState(null);

  // Touch handlers for cards in container
  const handleCardTouchStart = (e, card) => {
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    touchStartX.current = touch.clientX;
    touchStartTime.current = Date.now();
    
    longPressTimer.current = setTimeout(() => {
      setDraggedCard(card);
      setIsDraggingTouch(true);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 200);
  };

  const handleCardTouchMove = (e) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!isDraggingTouch || !draggedCard) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    
    // Check if over the selected items list
    const selectedList = document.querySelector('.selected-exercises-list');
    if (selectedList) {
      const rect = selectedList.getBoundingClientRect();
      if (currentY >= rect.top && currentY <= rect.bottom) {
        const items = document.querySelectorAll('.selected-exercise-item');
        let hoveredIndex = null;
        
        items.forEach((el, idx) => {
          const itemRect = el.getBoundingClientRect();
          if (currentY >= itemRect.top && currentY <= itemRect.bottom) {
            hoveredIndex = idx;
          }
        });
        
        if (hoveredIndex !== null) {
          setTouchDropIndicator(hoveredIndex);
        } else if (items.length === 0) {
          setTouchDropIndicator(0);
        }
      }
    }
  };

  const handleCardTouchEnd = (card) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Detect if this was a quick tap (not a drag)
    const touchDuration = Date.now() - (touchStartTime.current || 0);
    const isQuickTap = touchDuration < 200 && !isDraggingTouch;

    if (isQuickTap) {
      // Quick tap - add card immediately
      handleAddCard(card.id);
    } else if (isDraggingTouch && draggedCard && touchDropIndicator !== null) {
      setFormData(prev => {
        const newExercises = [...prev.exercises];
        newExercises.splice(touchDropIndicator, 0, draggedCard.id);
        return { ...prev, exercises: newExercises };
      });
    } else if (isDraggingTouch && draggedCard) {
      // Drop at end
      handleAddCard(draggedCard.id);
    }

    setIsDraggingTouch(false);
    setDraggedCard(null);
    setTouchDropIndicator(null);
    touchStartTime.current = null;
  };

  // Touch handlers for selected items reordering
  const handleItemTouchStart = (e, index) => {
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    
    longPressTimer.current = setTimeout(() => {
      setDraggedIndex(index);
      setTouchDraggedCardIndex(index);
      setIsDraggingTouch(true);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 200);
  };

  const handleItemTouchMove = (e, index) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!isDraggingTouch || touchDraggedCardIndex === null) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    
    const items = document.querySelectorAll('.selected-exercise-item');
    let hoveredIndex = null;
    
    items.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      if (currentY >= rect.top && currentY <= rect.bottom) {
        hoveredIndex = idx;
      }
    });
    
    if (hoveredIndex !== null && hoveredIndex !== touchDraggedCardIndex) {
      setTouchDropIndicator(hoveredIndex);
    }
  };

  const handleItemTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!isDraggingTouch) return;

    if (touchDraggedCardIndex !== null && touchDropIndicator !== null && touchDraggedCardIndex !== touchDropIndicator) {
      setFormData(prev => {
        const newExercises = [...prev.exercises];
        const [draggedItem] = newExercises.splice(touchDraggedCardIndex, 1);
        newExercises.splice(touchDropIndicator, 0, draggedItem);
        return { ...prev, exercises: newExercises };
      });
    }

    setIsDraggingTouch(false);
    setDraggedIndex(null);
    setTouchDraggedCardIndex(null);
    setTouchDropIndicator(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const handleTypeToggle = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors([]);
    
    const result = onSubmit(formData);
    if (!result.success) {
      setErrors(result.errors);
    }
  };

  // Get item info for display
  const getItemInfo = (itemId) => {
    const item = itemMap.get(itemId);
    const cardType = getCardType(itemId);
    const config = CARD_TYPE_CONFIG[cardType];
    return { item, cardType, config };
  };

  return (
    <form onSubmit={handleSubmit} className="session-form session-builder">
      <h2>{session ? 'Session bearbeiten' : 'Neue Session erstellen'}</h2>
      
      {errors.length > 0 && (
        <div className="form-errors">
          {errors.map((error, idx) => (
            <p key={idx} className="error-message">{error}</p>
          ))}
        </div>
      )}

      {/* Session Details Section */}
      <div className="session-details-section">
        <div className="form-group">
          <label htmlFor="title">Titel *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="z.B. Morgen-Energie"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Beschreibung *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Eine kurze Beschreibung der Session"
            rows={2}
          />
        </div>

        <div className="form-group">
          <label htmlFor="story">Story</label>
          <textarea
            id="story"
            name="story"
            value={formData.story}
            onChange={handleChange}
            placeholder="Die Geschichte/Erzählung der Session"
            rows={2}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Kategorie *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="level">Level *</label>
            <select
              id="level"
              name="level"
              value={formData.level}
              onChange={handleChange}
            >
              {LEVELS.map(lvl => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="duration_minutes">Dauer (Minuten) *</label>
            <input
              type="number"
              id="duration_minutes"
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleChange}
              min={1}
            />
          </div>
        </div>
      </div>

      {/* Card Builder Section - Side by Side Layout */}
      <div className="session-builder-container">
        {/* Left: Card Container with Filters */}
        <div className="card-container-panel">
          <h3>📦 Verfügbare Karten</h3>
          
          {/* Search */}
          <div className="card-search">
            <input
              type="text"
              placeholder="🔍 Karten suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Type Filters */}
          <div className="type-filters">
            {Object.entries(CARD_TYPE_CONFIG).map(([type, { icon, label, color }]) => (
              <button
                key={type}
                type="button"
                className={`type-filter-btn ${selectedTypes.includes(type) ? 'active' : ''}`}
                style={{ '--type-color': color }}
                onClick={() => handleTypeToggle(type)}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="tag-filters">
              <span className="tag-filters-label">Tags:</span>
              <div className="tag-filters-list">
                {(showAllTags ? allTags : allTags.slice(0, VISIBLE_TAGS_COUNT)).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-filter-pill ${selectedTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    #{tag}
                  </button>
                ))}
                {allTags.length > VISIBLE_TAGS_COUNT && (
                  <button
                    type="button"
                    className="tag-show-more-btn"
                    onClick={() => setShowAllTags(!showAllTags)}
                  >
                    {showAllTags ? '◂ Less' : `+${allTags.length - VISIBLE_TAGS_COUNT} more`}
                  </button>
                )}
                {selectedTags.length > 0 && (
                  <button
                    type="button"
                    className="tag-clear-btn"
                    onClick={() => setSelectedTags([])}
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cards List */}
          <div className="cards-list">
            <p className="cards-hint">
              Klicken oder ziehen Sie Karten in die Session ({filteredCards.length} verfügbar)
            </p>
            {filteredCards.length === 0 ? (
              <p className="no-cards">Keine Karten gefunden</p>
            ) : (
              filteredCards.map(card => {
                const config = CARD_TYPE_CONFIG[card.type];
                return (
                  <div
                    key={card.id}
                    className={`draggable-card card-type-${card.type}`}
                    style={{ '--card-color': config.color }}
                    draggable
                    onDragStart={(e) => handleCardDragStart(e, card)}
                    onDragEnd={handleCardDragEnd}
                    onTouchStart={(e) => handleCardTouchStart(e, card)}
                    onTouchMove={handleCardTouchMove}
                    onTouchEnd={() => handleCardTouchEnd(card)}
                    onClick={() => handleAddCard(card.id)}
                  >
                    <span className="card-type-icon">{config.icon}</span>
                    <div className="card-info">
                      <span className="card-title">{card.title}</span>
                      <span className="card-time">{card.time} Min.</span>
                    </div>
                    <span className="card-add-icon">➕</span>
                  </div>
                );
              })
            )}

            {/* Story Books Section */}
            {storyBooks.length > 0 && (
              <>
                <div className="cards-section-divider">
                  <span>📚 Story Books</span>
                </div>
                {storyBooks.map(storyBook => {
                  const bookStories = storyBook.storyIds
                    .map(id => storyMap.get(id))
                    .filter(Boolean);
                  const totalTime = bookStories.reduce((sum, s) => sum + (s.time || 0), 0);
                  return (
                    <div
                      key={storyBook.id}
                      className="draggable-card card-type-storybook"
                      onClick={() => handleAddStoryBook(storyBook)}
                    >
                      <span className="card-type-icon">📚</span>
                      <div className="card-info">
                        <span className="card-title">{storyBook.title}</span>
                        <span className="card-time">{storyBook.storyIds.length} Stories, {totalTime} Min.</span>
                      </div>
                      <span className="card-add-icon">➕</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Right: Session Builder */}
        <div className="session-builder-panel">
          <h3>🧘 Session Ablauf ({formData.exercises.length} Elemente)</h3>
          <p className="builder-hint">Ziehen Sie Elemente hierher oder ordnen Sie sie per Drag&Drop neu</p>
          
          <div 
            className={`selected-exercises-list ${draggedCard ? 'drop-target' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDropOnList}
          >
            {formData.exercises.length === 0 ? (
              <div className="empty-session-placeholder">
                <span className="empty-icon">📥</span>
                <p>Ziehen Sie Karten hierher oder klicken Sie auf eine Karte</p>
              </div>
            ) : (
              formData.exercises.map((itemId, idx) => {
                const { item, cardType, config } = getItemInfo(itemId);
                
                if (!item) {
                  return (
                    <div
                      key={`missing-${itemId}-${idx}`}
                      className="selected-exercise-item missing"
                    >
                      <span className="exercise-number">{idx + 1}.</span>
                      <span className="exercise-name" style={{ color: '#c62828' }}>
                        Element nicht gefunden (ID: {itemId})
                      </span>
                      <button
                        type="button"
                        className="btn-remove-exercise"
                        onClick={() => handleRemoveCard(idx)}
                        aria-label="Fehlendes Element entfernen"
                      >
                        ✕
                      </button>
                    </div>
                  );
                }

                const timeValue = cardType === CARD_TYPES.EXERCISE 
                  ? item.duration_minutes 
                  : item.time;

                return (
                  <div
                    key={`${itemId}-${idx}`}
                    className={`selected-exercise-item item-type-${cardType} ${draggedIndex === idx ? 'dragging' : ''}`}
                    style={{ '--item-color': config.color }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={(e) => handleItemTouchStart(e, idx)}
                    onTouchMove={(e) => handleItemTouchMove(e, idx)}
                    onTouchEnd={handleItemTouchEnd}
                  >
                    <span className="drag-handle">☰</span>
                    <span className="exercise-number">{idx + 1}.</span>
                    <span className="item-type-icon">{config.icon}</span>
                    <span className="exercise-name">{item.title}</span>
                    <span className="exercise-duration">({timeValue} Min.)</span>
                    <button
                      type="button"
                      className="btn-remove-exercise"
                      onClick={() => handleRemoveCard(idx)}
                      aria-label={`${item.title} entfernen`}
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Abbrechen
        </button>
        <button type="submit" className="btn btn-primary">
          {session ? 'Speichern' : 'Erstellen'}
        </button>
      </div>
    </form>
  );
}

function SessionCard({ session, exercises, stories, practicals, onEdit, onDelete }) {
  const exerciseMap = new Map(exercises.map(e => [e.id, e]));
  const storyMap = new Map(stories.map(s => [s.id, s]));
  const practicalMap = new Map(practicals.map(p => [p.id, p]));
  const itemMap = new Map([...exerciseMap, ...storyMap, ...practicalMap]);
  
  const sessionItems = session.exercises
    .map(id => {
      const item = itemMap.get(id);
      if (!item) {
        console.warn(`Item with ID "${id}" not found in session "${session.title}"`);
        return null;
      }
      const cardType = getCardType(id);
      return { ...item, cardType };
    })
    .filter(Boolean);
  
  const exerciseCount = sessionItems.filter(item => item.cardType === CARD_TYPES.EXERCISE).length;
  const storyCount = sessionItems.filter(item => item.cardType === CARD_TYPES.STORY).length;
  const practicalCount = sessionItems.filter(item => item.cardType === CARD_TYPES.PRACTICAL).length;

  return (
    <div className="session-card">
      <div className="session-card-header">
        <h3>{session.title}</h3>
        <div className="session-badges">
          <span className="badge badge-category">{session.category}</span>
          <span className="badge badge-level">{session.level}</span>
        </div>
      </div>
      <p className="session-description">{session.description}</p>
      {session.story && (
        <p className="session-story"><em>{session.story}</em></p>
      )}
      <div className="session-meta">
        <span>⏱️ {session.duration_minutes} Minuten</span>
        {exerciseCount > 0 && <span>💪 {exerciseCount} Übungen</span>}
        {storyCount > 0 && <span>📖 {storyCount} Stories</span>}
        {practicalCount > 0 && <span>🔔 {practicalCount} Praktisch</span>}
      </div>
      <div className="session-exercises">
        <strong>Ablauf:</strong>
        <ol>
          {sessionItems.map((item, idx) => {
            const config = CARD_TYPE_CONFIG[item.cardType];
            return (
              <li key={`${item.id}-${idx}`}>
                {config.icon} {item.title}
              </li>
            );
          })}
        </ol>
      </div>
      <div className="session-card-actions">
        <button className="btn btn-edit" onClick={() => onEdit(session)}>
          ✏️ Bearbeiten
        </button>
        <button className="btn btn-delete" onClick={() => onDelete(session.id)}>
          🗑️ Löschen
        </button>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [stories, setStories] = useState([]);
  const [practicals, setPracticals] = useState([]);
  const [storyBooks, setStoryBooks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  const loadData = useCallback(() => {
    setSessions(getSessions());
    setExercises(getExercises());
    setStories(getStories());
    setPracticals(getPracticals());
    setStoryBooks(getStoryBooks());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = (formData) => {
    const result = createSession(formData);
    if (result.success) {
      loadData();
      setShowForm(false);
    }
    return result;
  };

  const handleUpdate = (formData) => {
    const result = updateSession(editingSession.id, formData);
    if (result.success) {
      loadData();
      setEditingSession(null);
      setShowForm(false);
    }
    return result;
  };

  const handleDelete = (id) => {
    if (window.confirm('Möchten Sie diese Session wirklich löschen?')) {
      deleteSession(id);
      loadData();
    }
  };

  const handleEdit = (session) => {
    setEditingSession(session);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSession(null);
  };

  return (
    <main className="sessions-page">
      <header className="header">
        <div className="header-content">
          <h1>🧘 Session Verwaltung</h1>
          <p>Erstellen und verwalten Sie Ihre Yoga-Sessions</p>
        </div>
      </header>

      <div className="sessions-container">
        {showForm ? (
          <SessionForm
            session={editingSession}
            exercises={exercises}
            stories={stories}
            practicals={practicals}
            storyBooks={storyBooks}
            onSubmit={editingSession ? handleUpdate : handleCreate}
            onCancel={handleCancel}
          />
        ) : (
          <>
            <div className="sessions-header">
              <h2>Ihre Sessions ({sessions.length})</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                ➕ Neue Session
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="empty-state">
                <p>Noch keine Sessions vorhanden.</p>
                <p>Erstellen Sie Ihre erste Session!</p>
              </div>
            ) : (
              <div className="sessions-grid">
                {sessions.map(session => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    exercises={exercises}
                    stories={stories}
                    practicals={practicals}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <div className="back-link">
          <Link href="/">← Zurück zur Übersicht</Link>
        </div>
      </div>
    </main>
  );
}
