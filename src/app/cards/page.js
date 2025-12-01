'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import CardModal, { CARD_TYPES, CARD_TYPE_CONFIG } from '../components/CardModal';
import { getExercises, createExercise, deleteExercise } from '../../lib/exerciseStorage';
import { getStories, createStory, updateStory, deleteStory } from '../../lib/storyStorage';
import { getPracticals, createPractical, updatePractical, deletePractical } from '../../lib/practicalStorage';

// Normalize cards to a common format for display
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
        <span>🏷️ Filter by Tags {selectedTags.length > 0 && `(${selectedTags.length})`}</span>
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
              ✕ Clear all filters
            </button>
          )}
          {allTags.length === 0 ? (
            <p className="tag-filter-empty">No tags available</p>
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
      {Object.entries(CARD_TYPE_CONFIG).map(([type, { icon, label, color }]) => (
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

// Unified card component with edit/delete actions
function UnifiedCard({ card, onEdit, onDelete }) {
  const { icon, label, color } = CARD_TYPE_CONFIG[card.type];
  
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
      
      <div className="unified-card-actions">
        <button className="btn btn-edit" onClick={() => onEdit(card)}>
          ✏️ Edit
        </button>
        <button className="btn btn-delete" onClick={() => onDelete(card)}>
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}

export default function CardsPage() {
  const [exercises, setExercises] = useState([]);
  const [stories, setStories] = useState([]);
  const [practicals, setPracticals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([CARD_TYPES.EXERCISE, CARD_TYPES.STORY, CARD_TYPES.PRACTICAL]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

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

  // Handle card creation/update
  const handleSubmit = (cardType, data, editId) => {
    let result;
    
    if (cardType === CARD_TYPES.EXERCISE) {
      if (editId) {
        // Exercises don't have update in current storage, so we delete and recreate
        deleteExercise(editId);
        result = createExercise(data);
      } else {
        result = createExercise(data);
      }
    } else if (cardType === CARD_TYPES.STORY) {
      if (editId) {
        result = updateStory(editId, data);
      } else {
        result = createStory(data);
      }
    } else {
      if (editId) {
        result = updatePractical(editId, data);
      } else {
        result = createPractical(data);
      }
    }

    if (result.success) {
      loadData();
      setEditingCard(null);
    }
    
    return result;
  };

  // Handle card deletion
  const handleDelete = (card) => {
    const typeLabel = CARD_TYPE_CONFIG[card.type].label;
    if (window.confirm(`Are you sure you want to delete this ${typeLabel}?`)) {
      if (card.type === CARD_TYPES.EXERCISE) {
        deleteExercise(card.id);
      } else if (card.type === CARD_TYPES.STORY) {
        deleteStory(card.id);
      } else {
        deletePractical(card.id);
      }
      loadData();
    }
  };

  // Handle edit
  const handleEdit = (card) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
  };

  // Open modal for new card
  const handleOpenNewCard = () => {
    setEditingCard(null);
    setIsModalOpen(true);
  };

  return (
    <main className="sessions-page cards-page">
      <header className="header">
        <div className="header-content">
          <h1>🎴 Cards</h1>
          <p>Create and manage all your yoga session elements in one place</p>
        </div>
      </header>

      <div className="sessions-container">
        {/* Search and filter controls */}
        <div className="storybook-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search by title or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
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
              className="btn btn-primary btn-create-card"
              onClick={handleOpenNewCard}
            >
              ➕ Create New Card
            </button>
          </div>
        </div>

        {/* Results summary */}
        <div className="storybook-summary">
          <span>{filteredCards.length} of {allCards.length} cards</span>
          {selectedTags.length > 0 && (
            <div className="active-filters">
              {selectedTags.map(tag => (
                <span key={tag} className="active-filter-tag">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                    aria-label={`Remove ${tag} filter`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Cards Grid */}
        {filteredCards.length === 0 ? (
          <div className="empty-state">
            <p>No cards found.</p>
            {allCards.length === 0 ? (
              <p>Create your first card to get started!</p>
            ) : (
              <p>Try a different search or filter.</p>
            )}
          </div>
        ) : (
          <div className="unified-cards-grid">
            {filteredCards.map(card => (
              <UnifiedCard
                key={`${card.type}-${card.id}`}
                card={card}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        <div className="back-link">
          <Link href="/">← Back to Home</Link>
        </div>
      </div>

      {/* Card Creation/Edit Modal */}
      <CardModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editCard={editingCard}
      />
    </main>
  );
}
