'use client';

import { useState, useEffect } from 'react';

const CARD_TYPES = {
  EXERCISE: 'exercise',
  STORY: 'story',
  PRACTICAL: 'practical'
};

const CARD_TYPE_CONFIG = {
  [CARD_TYPES.EXERCISE]: {
    icon: '💪',
    label: 'Exercise',
    color: '#6b4d8a',
    categories: ['Stehübungen', 'Liegeübungen', 'Sitzübungen', 'Gleichgewicht', 'Entspannung']
  },
  [CARD_TYPES.STORY]: {
    icon: '📖',
    label: 'Story',
    color: '#e67e22',
    categories: ['Ruhig', 'Energetisch', 'Meditativ', 'Motivierend', 'Entspannend']
  },
  [CARD_TYPES.PRACTICAL]: {
    icon: '🔔',
    label: 'Practical',
    color: '#27ae60',
    categories: []
  }
};

export default function CardModal({ isOpen, onClose, onSubmit, editCard = null }) {
  const [cardType, setCardType] = useState(CARD_TYPES.EXERCISE);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    duration: 5
  });
  const [errors, setErrors] = useState([]);

  // Reset form when modal opens or editCard changes
  useEffect(() => {
    if (isOpen) {
      if (editCard) {
        // Editing existing card
        setCardType(editCard.type);
        setFormData({
          title: editCard.title || '',
          content: editCard.type === CARD_TYPES.EXERCISE 
            ? editCard.originalItem?.description || ''
            : editCard.type === CARD_TYPES.STORY 
              ? editCard.originalItem?.text || ''
              : editCard.originalItem?.instruction || '',
          category: editCard.category || CARD_TYPE_CONFIG[editCard.type]?.categories?.[0] || '',
          tags: editCard.tags?.join(', ') || '',
          duration: editCard.time || 5
        });
      } else {
        // Creating new card
        setFormData({
          title: '',
          content: '',
          category: CARD_TYPE_CONFIG[CARD_TYPES.EXERCISE].categories[0],
          tags: '',
          duration: 5
        });
        setCardType(CARD_TYPES.EXERCISE);
      }
      setErrors([]);
    }
  }, [isOpen, editCard]);

  // Update category when card type changes (only for new cards)
  useEffect(() => {
    if (!editCard) {
      const categories = CARD_TYPE_CONFIG[cardType].categories;
      if (categories.length > 0) {
        setFormData(prev => ({ ...prev, category: categories[0] }));
      } else {
        setFormData(prev => ({ ...prev, category: '' }));
      }
    }
  }, [cardType, editCard]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleTypeChange = (type) => {
    setCardType(type);
    setErrors([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors([]);

    const tagsArray = (formData.tags || '')
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    // Prepare data based on card type
    let submitData;
    if (cardType === CARD_TYPES.EXERCISE) {
      submitData = {
        title: formData.title,
        description: formData.content,
        category: formData.category,
        tags: tagsArray,
        duration_minutes: formData.duration
      };
    } else if (cardType === CARD_TYPES.STORY) {
      submitData = {
        title: formData.title,
        text: formData.content,
        mood: formData.category,
        tags: tagsArray,
        time: formData.duration
      };
    } else {
      submitData = {
        title: formData.title,
        instruction: formData.content,
        tags: tagsArray,
        time: formData.duration
      };
    }

    const result = onSubmit(cardType, submitData, editCard?.id);
    
    if (!result.success) {
      setErrors(result.errors);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const config = CARD_TYPE_CONFIG[cardType];
  const categories = config.categories;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editCard ? 'Edit Card' : 'Create New Card'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Card Type Selector - only show when creating new */}
        {!editCard && (
          <div className="card-type-selector">
            {Object.entries(CARD_TYPE_CONFIG).map(([type, cfg]) => (
              <button
                key={type}
                type="button"
                className={`card-type-btn ${cardType === type ? 'active' : ''}`}
                style={{ '--type-color': cfg.color }}
                onClick={() => handleTypeChange(type)}
              >
                <span className="card-type-icon">{cfg.icon}</span>
                <span className="card-type-label">{cfg.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Current type indicator when editing */}
        {editCard && (
          <div className="card-type-indicator" style={{ '--type-color': config.color }}>
            <span className="card-type-icon">{config.icon}</span>
            <span className="card-type-label">{config.label}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {errors.length > 0 && (
            <div className="form-errors">
              {errors.map((error, idx) => (
                <p key={idx} className="error-message">{error}</p>
              ))}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={
                cardType === CARD_TYPES.EXERCISE ? 'e.g. Warrior I' :
                cardType === CARD_TYPES.STORY ? 'e.g. Grounding Transition' :
                'e.g. Ring the Bell'
              }
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">
              {cardType === CARD_TYPES.EXERCISE ? 'Description' :
               cardType === CARD_TYPES.STORY ? 'Text' :
               'Instruction'} *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder={
                cardType === CARD_TYPES.EXERCISE ? 'Describe the exercise...' :
                cardType === CARD_TYPES.STORY ? 'The narrative text...' :
                'The action instruction...'
              }
              rows={4}
            />
          </div>

          <div className="form-row">
            {categories.length > 0 && (
              <div className="form-group">
                <label htmlFor="category">
                  {cardType === CARD_TYPES.EXERCISE ? 'Category' : 'Mood'}
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="duration">Duration (minutes) *</label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min={cardType === CARD_TYPES.EXERCISE ? 1 : 0.5}
                step={cardType === CARD_TYPES.EXERCISE ? 1 : 0.5}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (comma separated)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g. strength, balance, stretching"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ background: config.color }}
            >
              {config.icon} {editCard ? 'Save' : 'Create'} {config.label}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { CARD_TYPES, CARD_TYPE_CONFIG };
