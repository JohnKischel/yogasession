'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  getExerciseSets, 
  createExerciseSet, 
  updateExerciseSet, 
  deleteExerciseSet,
  initializeDefaultExerciseSets 
} from '../../lib/exerciseSetStorage';
import { 
  getStorySets, 
  createStorySet, 
  updateStorySet, 
  deleteStorySet 
} from '../../lib/storySetStorage';
import { 
  getPracticalSets, 
  createPracticalSet, 
  updatePracticalSet, 
  deletePracticalSet 
} from '../../lib/practicalSetStorage';
import { getExercises, initializeDefaultExercises } from '../../lib/exerciseStorage';
import { getStories } from '../../lib/storyStorage';
import { getPracticals } from '../../lib/practicalStorage';

const SET_TYPES = {
  EXERCISE: 'exercise',
  STORY: 'story',
  PRACTICAL: 'practical'
};

const SET_TYPE_CONFIG = {
  [SET_TYPES.EXERCISE]: {
    label: 'Exercise Sets',
    icon: '🧘',
    color: '#4CAF50',
    cardLabel: 'Exercises'
  },
  [SET_TYPES.STORY]: {
    label: 'Story Sets',
    icon: '📖',
    color: '#2196F3',
    cardLabel: 'Stories'
  },
  [SET_TYPES.PRACTICAL]: {
    label: 'Practical Sets',
    icon: '🔔',
    color: '#FF9800',
    cardLabel: 'Practicals'
  }
};

// Set Card Component
function SetCard({ set, type, onEdit, onDelete, onView, cardCount }) {
  const config = SET_TYPE_CONFIG[type];
  
  return (
    <div className="set-card" style={{ '--set-color': config.color }}>
      <div className="set-card-header">
        <div className="set-card-icon">{config.icon}</div>
        <h3>{set.name}</h3>
        {set.isDefault && <span className="set-default-badge">Default</span>}
      </div>
      
      {set.description && (
        <p className="set-card-description">{set.description}</p>
      )}
      
      <div className="set-card-info">
        <span className="set-card-count">
          {cardCount} {config.cardLabel}
        </span>
        {set.createdAt && (
          <span className="set-card-date">
            Created: {new Date(set.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>
      
      <div className="set-card-actions">
        <button className="btn btn-secondary" onClick={() => onView(set)}>
          👁️ View Cards
        </button>
        <button className="btn btn-edit" onClick={() => onEdit(set)}>
          ✏️ Edit
        </button>
        {!set.isDefault && (
          <button className="btn btn-delete" onClick={() => onDelete(set)}>
            🗑️ Delete
          </button>
        )}
      </div>
    </div>
  );
}

// Set Modal Component
function SetModal({ isOpen, onClose, onSubmit, editSet, type, availableCards }) {
  const config = SET_TYPE_CONFIG[type];
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cardIds: []
  });
  const [errors, setErrors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (editSet) {
      const cardIdsKey = type === SET_TYPES.EXERCISE ? 'exerciseIds' : 
                         type === SET_TYPES.STORY ? 'storyIds' : 'practicalIds';
      setFormData({
        name: editSet.name,
        description: editSet.description || '',
        cardIds: editSet[cardIdsKey] || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        cardIds: []
      });
    }
    setErrors([]);
    setSearchQuery('');
  }, [editSet, isOpen, type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors([]);
    
    const cardIdsKey = type === SET_TYPES.EXERCISE ? 'exerciseIds' : 
                       type === SET_TYPES.STORY ? 'storyIds' : 'practicalIds';
    
    const result = onSubmit({
      name: formData.name,
      description: formData.description,
      [cardIdsKey]: formData.cardIds
    });
    
    if (result.success) {
      onClose();
    } else {
      setErrors(result.errors || ['Failed to save set']);
    }
  };

  const toggleCard = (cardId) => {
    setFormData(prev => ({
      ...prev,
      cardIds: prev.cardIds.includes(cardId)
        ? prev.cardIds.filter(id => id !== cardId)
        : [...prev.cardIds, cardId]
    }));
  };

  const filteredCards = useMemo(() => {
    if (!searchQuery) return availableCards;
    const query = searchQuery.toLowerCase();
    return availableCards.filter(card => 
      card.title.toLowerCase().includes(query)
    );
  }, [availableCards, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content set-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editSet ? 'Edit' : 'Create'} {config.label.slice(0, -1)}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {errors.length > 0 && (
            <div className="error-messages">
              {errors.map((error, index) => (
                <p key={index} className="error-message">{error}</p>
              ))}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="set-name">Set Name *</label>
            <input
              type="text"
              id="set-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={editSet?.isDefault}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="set-description">Description</label>
            <textarea
              id="set-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label>Select {config.cardLabel}</label>
            <input
              type="text"
              placeholder={`🔍 Search ${config.cardLabel.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <div className="card-selection-list">
              {filteredCards.length === 0 ? (
                <p className="no-cards-message">No {config.cardLabel.toLowerCase()} available</p>
              ) : (
                filteredCards.map(card => (
                  <label key={card.id} className="card-selection-item">
                    <input
                      type="checkbox"
                      checked={formData.cardIds.includes(card.id)}
                      onChange={() => toggleCard(card.id)}
                    />
                    <span>{card.title}</span>
                  </label>
                ))
              )}
            </div>
            <p className="selection-count">
              {formData.cardIds.length} {config.cardLabel.toLowerCase()} selected
            </p>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editSet ? 'Update' : 'Create'} Set
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// View Set Cards Modal
function ViewSetCardsModal({ isOpen, onClose, set, type, cards }) {
  if (!isOpen || !set) return null;
  
  const config = SET_TYPE_CONFIG[type];
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content view-set-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{config.icon} {set.name}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        {set.description && (
          <p className="set-description">{set.description}</p>
        )}
        
        <div className="view-set-cards">
          <h3>{config.cardLabel} in this set:</h3>
          {cards.length === 0 ? (
            <p className="no-cards-message">No {config.cardLabel.toLowerCase()} in this set</p>
          ) : (
            <ul className="set-cards-list">
              {cards.map(card => (
                <li key={card.id} className="set-card-item">
                  <span className="card-title">{card.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SetsPage() {
  const [activeTab, setActiveTab] = useState(SET_TYPES.EXERCISE);
  const [exerciseSets, setExerciseSets] = useState([]);
  const [storySets, setStorySets] = useState([]);
  const [practicalSets, setPracticalSets] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [stories, setStories] = useState([]);
  const [practicals, setPracticals] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [viewingSet, setViewingSet] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    // Initialize default exercises first
    await initializeDefaultExercises();
    
    // Then initialize default exercise sets
    initializeDefaultExerciseSets();
    
    setExerciseSets(getExerciseSets());
    setStorySets(getStorySets());
    setPracticalSets(getPracticalSets());
    setExercises(getExercises());
    setStories(getStories());
    setPracticals(getPracticals());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentSets = activeTab === SET_TYPES.EXERCISE ? exerciseSets :
                      activeTab === SET_TYPES.STORY ? storySets : practicalSets;
  
  const currentCards = activeTab === SET_TYPES.EXERCISE ? exercises :
                       activeTab === SET_TYPES.STORY ? stories : practicals;

  const filteredSets = useMemo(() => {
    if (!searchQuery) return currentSets;
    const query = searchQuery.toLowerCase();
    return currentSets.filter(set => 
      set.name.toLowerCase().includes(query) ||
      set.description?.toLowerCase().includes(query)
    );
  }, [currentSets, searchQuery]);

  const handleCreateSet = () => {
    setEditingSet(null);
    setIsModalOpen(true);
  };

  const handleEditSet = (set) => {
    setEditingSet(set);
    setIsModalOpen(true);
  };

  const handleDeleteSet = (set) => {
    const config = SET_TYPE_CONFIG[activeTab];
    if (window.confirm(`Are you sure you want to delete "${set.name}"?`)) {
      if (activeTab === SET_TYPES.EXERCISE) {
        deleteExerciseSet(set.id);
      } else if (activeTab === SET_TYPES.STORY) {
        deleteStorySet(set.id);
      } else {
        deletePracticalSet(set.id);
      }
      loadData();
    }
  };

  const handleSubmit = (data) => {
    let result;
    
    if (activeTab === SET_TYPES.EXERCISE) {
      if (editingSet) {
        result = updateExerciseSet(editingSet.id, data);
      } else {
        result = createExerciseSet(data);
      }
    } else if (activeTab === SET_TYPES.STORY) {
      if (editingSet) {
        result = updateStorySet(editingSet.id, data);
      } else {
        result = createStorySet(data);
      }
    } else {
      if (editingSet) {
        result = updatePracticalSet(editingSet.id, data);
      } else {
        result = createPracticalSet(data);
      }
    }
    
    if (result.success) {
      loadData();
      setEditingSet(null);
    }
    
    return result;
  };

  const handleViewSet = (set) => {
    setViewingSet(set);
  };

  const getSetCards = (set) => {
    if (activeTab === SET_TYPES.EXERCISE) {
      return exercises.filter(e => set.exerciseIds?.includes(e.id));
    } else if (activeTab === SET_TYPES.STORY) {
      return stories.filter(s => set.storyIds?.includes(s.id));
    } else {
      return practicals.filter(p => set.practicalIds?.includes(p.id));
    }
  };

  const getCardCount = (set) => {
    return getSetCards(set).length;
  };

  return (
    <main className="sessions-page sets-page">
      <header className="header">
        <div className="header-content">
          <h1>📚 Card Sets</h1>
          <p>Organize your cards into reusable sets</p>
        </div>
      </header>

      <div className="sessions-container">
        {/* Tab Navigation */}
        <div className="set-tabs">
          {Object.entries(SET_TYPE_CONFIG).map(([type, config]) => (
            <button
              key={type}
              className={`set-tab ${activeTab === type ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(type);
                setSearchQuery('');
              }}
              style={{ '--tab-color': config.color }}
            >
              {config.icon} {config.label}
            </button>
          ))}
        </div>

        {/* Search and Actions */}
        <div className="storybook-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search sets..."
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
          
          <div className="storybook-actions">
            <button 
              className="btn btn-primary"
              onClick={handleCreateSet}
            >
              ➕ Create New Set
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="storybook-summary">
          <span>{filteredSets.length} of {currentSets.length} sets</span>
        </div>

        {/* Sets Grid */}
        {filteredSets.length === 0 ? (
          <div className="empty-state">
            <p>No sets found.</p>
            {currentSets.length === 0 ? (
              <p>Create your first set to get started!</p>
            ) : (
              <p>Try a different search.</p>
            )}
          </div>
        ) : (
          <div className="sets-grid">
            {filteredSets.map(set => (
              <SetCard
                key={set.id}
                set={set}
                type={activeTab}
                onEdit={handleEditSet}
                onDelete={handleDeleteSet}
                onView={handleViewSet}
                cardCount={getCardCount(set)}
              />
            ))}
          </div>
        )}

        <div className="back-link">
          <Link href="/">← Back to Home</Link>
        </div>
      </div>

      {/* Set Creation/Edit Modal */}
      <SetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSet(null);
        }}
        onSubmit={handleSubmit}
        editSet={editingSet}
        type={activeTab}
        availableCards={currentCards}
      />

      {/* View Set Cards Modal */}
      <ViewSetCardsModal
        isOpen={!!viewingSet}
        onClose={() => setViewingSet(null)}
        set={viewingSet}
        type={activeTab}
        cards={viewingSet ? getSetCards(viewingSet) : []}
      />
    </main>
  );
}
