'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getExercises } from '../../lib/exerciseStorage';
import { getStories } from '../../lib/storyStorage';
import { 
  getPracticals, 
  createPractical, 
  updatePractical,
  deletePractical 
} from '../../lib/practicalStorage';

const CARD_TYPES = {
  EXERCISE: 'exercise',
  STORY: 'story',
  PRACTICAL: 'practical'
};

const CARD_TYPE_LABELS = {
  [CARD_TYPES.EXERCISE]: { icon: '💪', label: 'Exercise', color: '#6b4d8a' },
  [CARD_TYPES.STORY]: { icon: '📖', label: 'Story', color: '#e67e22' },
  [CARD_TYPES.PRACTICAL]: { icon: '🔔', label: 'Practical', color: '#27ae60' }
};

// Normalize cards to a common format
function normalizeCard(item, type) {
  return {
    id: item.id,
    title: item.title,
    text: type === CARD_TYPES.EXERCISE ? item.description : (item.text || item.instruction),
    tags: item.tags || [],
    time: type === CARD_TYPES.EXERCISE ? item.duration_minutes : item.time,
    type: type,
    category: item.category || item.mood || null,
    originalItem: item
  };
}

// Multi-select filter dropdown component
function TagFilter({ allTags, selectedTags, onTagsChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  return (
    <div className="tag-filter">
      <button
        type="button"
        className="tag-filter-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>🏷️ Tags filtern {selectedTags.length > 0 && `(${selectedTags.length})`}</span>
        <span className={`tag-filter-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      
      {isOpen && (
        <div className="tag-filter-dropdown" role="listbox" aria-multiselectable="true">
          {selectedTags.length > 0 && (
            <button
              type="button"
              className="tag-filter-clear"
              onClick={handleClearAll}
            >
              ✕ Alle Filter entfernen
            </button>
          )}
          {allTags.length === 0 ? (
            <p className="tag-filter-empty">Keine Tags verfügbar</p>
          ) : (
            allTags.map(tag => (
              <label
                key={tag}
                className={`tag-filter-option ${selectedTags.includes(tag) ? 'selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                />
                <span>#{tag}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Card type filter component
function TypeFilter({ selectedTypes, onTypesChange }) {
  const handleTypeToggle = (type) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter(t => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  return (
    <div className="type-filter">
      {Object.entries(CARD_TYPE_LABELS).map(([type, { icon, label, color }]) => (
        <button
          key={type}
          type="button"
          className={`type-filter-btn ${selectedTypes.includes(type) ? 'active' : ''}`}
          onClick={() => handleTypeToggle(type)}
          style={{ '--type-color': color }}
          aria-pressed={selectedTypes.includes(type)}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}

// Unified card component
function UnifiedCard({ card, onEdit, onDelete }) {
  const { icon, label, color } = CARD_TYPE_LABELS[card.type];
  
  return (
    <div 
      className={`unified-card unified-card-${card.type}`}
      style={{ '--card-accent': color }}
    >
      <div className="unified-card-header">
        <div className="unified-card-type-badge" style={{ background: color }}>
          {icon} {label}
        </div>
        <h3>{card.title}</h3>
      </div>
      
      <p className="unified-card-text">{card.text}</p>
      
      <div className="unified-card-meta">
        {card.category && (
          <span className="unified-card-category">{card.category}</span>
        )}
        <span className="unified-card-time">⏱️ {card.time} Min.</span>
      </div>
      
      {card.tags && card.tags.length > 0 && (
        <div className="unified-card-tags">
          {card.tags.map(tag => (
            <span key={tag} className="unified-card-tag">#{tag}</span>
          ))}
        </div>
      )}
      
      {card.type === CARD_TYPES.PRACTICAL && (
        <div className="unified-card-actions">
          <button className="btn btn-edit" onClick={() => onEdit(card)}>
            ✏️ Bearbeiten
          </button>
          <button className="btn btn-delete" onClick={() => onDelete(card.id)}>
            🗑️ Löschen
          </button>
        </div>
      )}
    </div>
  );
}

// Practical element form
function PracticalForm({ practical, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: practical?.originalItem?.title || '',
    instruction: practical?.originalItem?.instruction || '',
    tags: practical?.originalItem?.tags?.join(', ') || '',
    time: practical?.originalItem?.time || 1
  });
  const [errors, setErrors] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors([]);
    
    const tagsArray = (formData.tags || '')
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    const result = onSubmit({
      ...formData,
      tags: tagsArray,
      time: parseFloat(formData.time)
    });
    
    if (!result.success) {
      setErrors(result.errors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="session-form practical-form">
      <h2>{practical ? 'Praktische Anweisung bearbeiten' : 'Neue praktische Anweisung erstellen'}</h2>
      
      {errors.length > 0 && (
        <div className="form-errors">
          {errors.map((error, idx) => (
            <p key={idx} className="error-message">{error}</p>
          ))}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="title">Titel *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="z.B. Glocke läuten"
        />
      </div>

      <div className="form-group">
        <label htmlFor="instruction">Anweisung *</label>
        <textarea
          id="instruction"
          name="instruction"
          value={formData.instruction}
          onChange={handleChange}
          placeholder="Die Handlungsanweisung, z.B. 'Läuten Sie die Glocke dreimal, um die Meditation zu beginnen...'"
          rows={4}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="time">Zeit (Minuten) *</label>
          <input
            type="number"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            min="0.5"
            step="0.5"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="tags">Tags (kommagetrennt)</label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="z.B. beginn, ritual, glocke"
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Abbrechen
        </button>
        <button type="submit" className="btn btn-primary">
          {practical ? 'Speichern' : 'Erstellen'}
        </button>
      </div>
    </form>
  );
}

// Group cards by tag
function groupCardsByTag(cards, selectedTags) {
  if (selectedTags.length === 0) {
    return { 'Alle Elemente': cards };
  }
  
  const groups = {};
  
  selectedTags.forEach(tag => {
    groups[tag] = cards.filter(card => card.tags.includes(tag));
  });
  
  // Add items that match selected tags but might have additional tags
  const matchingCards = cards.filter(card => 
    selectedTags.some(tag => card.tags.includes(tag))
  );
  
  if (matchingCards.length > 0 && selectedTags.length > 0) {
    return groups;
  }
  
  return groups;
}

export default function StoryBooksPage() {
  const [exercises, setExercises] = useState([]);
  const [stories, setStories] = useState([]);
  const [practicals, setPracticals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([CARD_TYPES.EXERCISE, CARD_TYPES.STORY, CARD_TYPES.PRACTICAL]);
  const [showForm, setShowForm] = useState(false);
  const [editingPractical, setEditingPractical] = useState(null);

  const loadData = useCallback(() => {
    setExercises(getExercises());
    setStories(getStories());
    setPracticals(getPracticals());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Normalize all cards to a common format
  const allCards = useMemo(() => {
    const normalizedExercises = exercises.map(e => normalizeCard(e, CARD_TYPES.EXERCISE));
    const normalizedStories = stories.map(s => normalizeCard(s, CARD_TYPES.STORY));
    const normalizedPracticals = practicals.map(p => normalizeCard(p, CARD_TYPES.PRACTICAL));
    return [...normalizedExercises, ...normalizedStories, ...normalizedPracticals];
  }, [exercises, stories, practicals]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set();
    allCards.forEach(card => {
      card.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [allCards]);

  // Filter cards based on search query, selected tags, and selected types
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
        const matchesText = card.text?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesText) {
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
  }, [allCards, searchQuery, selectedTags, selectedTypes]);

  // Group filtered cards by tag
  const groupedCards = useMemo(() => {
    return groupCardsByTag(filteredCards, selectedTags);
  }, [filteredCards, selectedTags]);

  const handleCreatePractical = (formData) => {
    const result = createPractical(formData);
    if (result.success) {
      loadData();
      setShowForm(false);
    }
    return result;
  };

  const handleUpdatePractical = (formData) => {
    const result = updatePractical(editingPractical.id, formData);
    if (result.success) {
      loadData();
      setEditingPractical(null);
      setShowForm(false);
    }
    return result;
  };

  const handleDeletePractical = (id) => {
    if (window.confirm('Möchten Sie diese praktische Anweisung wirklich löschen?')) {
      deletePractical(id);
      loadData();
    }
  };

  const handleEditPractical = (card) => {
    setEditingPractical(card);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPractical(null);
  };

  return (
    <main className="sessions-page storybooks-page">
      <header className="header">
        <div className="header-content">
          <h1>📚 Storybook - Alle Elemente</h1>
          <p>Durchsuchen und filtern Sie alle verfügbaren Karten für Ihre Yoga-Sessions</p>
        </div>
      </header>

      <div className="sessions-container">
        {showForm ? (
          <PracticalForm
            practical={editingPractical}
            onSubmit={editingPractical ? handleUpdatePractical : handleCreatePractical}
            onCancel={handleCancel}
          />
        ) : (
          <>
            {/* Search and filter controls */}
            <div className="storybook-controls">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="🔍 Suche nach Titel oder Text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  aria-label="Suche"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="search-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label="Suche löschen"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <div className="filter-row">
                <TypeFilter
                  selectedTypes={selectedTypes}
                  onTypesChange={setSelectedTypes}
                />
                <TagFilter
                  allTags={allTags}
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                />
              </div>
              
              <div className="storybook-actions">
                <button 
                  className="btn btn-primary btn-practical"
                  onClick={() => setShowForm(true)}
                >
                  🔔 Neue praktische Anweisung
                </button>
                <Link href="/exercises" className="btn btn-secondary">
                  💪 Übungen verwalten
                </Link>
                <Link href="/stories" className="btn btn-secondary">
                  📖 Stories verwalten
                </Link>
              </div>
            </div>

            {/* Results summary */}
            <div className="storybook-summary">
              <span>{filteredCards.length} von {allCards.length} Elementen</span>
              {selectedTags.length > 0 && (
                <div className="active-filters">
                  {selectedTags.map(tag => (
                    <span key={tag} className="active-filter-tag">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                        aria-label={`Filter ${tag} entfernen`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Card groups */}
            {Object.entries(groupedCards).map(([groupName, cards]) => (
              <div key={groupName} className="card-group">
                {selectedTags.length > 0 && (
                  <h3 className="card-group-title">#{groupName} ({cards.length})</h3>
                )}
                
                {cards.length === 0 ? (
                  <div className="empty-state">
                    <p>Keine Elemente gefunden.</p>
                    {searchQuery && <p>Versuchen Sie eine andere Suche.</p>}
                  </div>
                ) : (
                  <div className="unified-cards-grid">
                    {cards.map(card => (
                      <UnifiedCard
                        key={`${card.type}-${card.id}`}
                        card={card}
                        onEdit={card.type === CARD_TYPES.PRACTICAL ? handleEditPractical : undefined}
                        onDelete={card.type === CARD_TYPES.PRACTICAL ? handleDeletePractical : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {allCards.length === 0 && (
              <div className="empty-state">
                <p>Noch keine Elemente vorhanden.</p>
                <p>Erstellen Sie Übungen, Stories oder praktische Anweisungen!</p>
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
