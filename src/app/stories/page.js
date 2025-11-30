'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  getStories, 
  createStory, 
  updateStory,
  deleteStory 
} from '../../lib/storyStorage';

const MOODS = ['Ruhig', 'Energetisch', 'Meditativ', 'Motivierend', 'Entspannend'];

function StoryForm({ story, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: story?.title || '',
    text: story?.text || '',
    mood: story?.mood || MOODS[0],
    tags: story?.tags?.join(', ') || '',
    time: story?.time || 1
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
    <form onSubmit={handleSubmit} className="session-form">
      <h2>{story ? 'Story Element bearbeiten' : 'Neues Story Element erstellen'}</h2>
      
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
          placeholder="z.B. Übergang zur Erdung"
        />
      </div>

      <div className="form-group">
        <label htmlFor="text">Text *</label>
        <textarea
          id="text"
          name="text"
          value={formData.text}
          onChange={handleChange}
          placeholder="Der narrative Text, der während der Session vorgelesen wird..."
          rows={6}
        />
        <p className="form-hint">
          Dieser Text kann später automatisch durch LLM generiert werden.
        </p>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="mood">Stimmung</label>
          <select
            id="mood"
            name="mood"
            value={formData.mood}
            onChange={handleChange}
          >
            {MOODS.map(mood => (
              <option key={mood} value={mood}>{mood}</option>
            ))}
          </select>
        </div>
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
          placeholder="z.B. übergang, erdung, atmung"
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Abbrechen
        </button>
        <button type="submit" className="btn btn-primary">
          {story ? 'Speichern' : 'Erstellen'}
        </button>
      </div>
    </form>
  );
}

function StoryCard({ story, onEdit, onDelete }) {
  return (
    <div className="session-card">
      <div className="session-card-header">
        <h3>📖 {story.title}</h3>
        <div className="session-badges">
          {story.mood && <span className="badge badge-category">{story.mood}</span>}
          {story.time && <span className="badge badge-duration">⏱️ {story.time} Min.</span>}
          <span className="badge badge-level">Story</span>
        </div>
      </div>
      <p className="session-description">{story.text}</p>
      {story.tags && story.tags.length > 0 && (
        <div className="exercise-tags">
          {story.tags.map(tag => (
            <span key={tag} className="exercise-tag">#{tag}</span>
          ))}
        </div>
      )}
      <div className="session-card-actions">
        <button className="btn btn-edit" onClick={() => onEdit(story)}>
          ✏️ Bearbeiten
        </button>
        <button className="btn btn-delete" onClick={() => onDelete(story.id)}>
          🗑️ Löschen
        </button>
      </div>
    </div>
  );
}

export default function StoriesPage() {
  const [stories, setStories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStory, setEditingStory] = useState(null);

  const loadData = useCallback(() => {
    setStories(getStories());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = (formData) => {
    const result = createStory(formData);
    if (result.success) {
      loadData();
      setShowForm(false);
    }
    return result;
  };

  const handleUpdate = (formData) => {
    const result = updateStory(editingStory.id, formData);
    if (result.success) {
      loadData();
      setEditingStory(null);
      setShowForm(false);
    }
    return result;
  };

  const handleDelete = (id) => {
    if (window.confirm('Möchten Sie dieses Story Element wirklich löschen?')) {
      deleteStory(id);
      loadData();
    }
  };

  const handleEdit = (story) => {
    setEditingStory(story);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStory(null);
  };

  return (
    <main className="sessions-page">
      <header className="header">
        <div className="header-content">
          <h1>📖 Story Elemente</h1>
          <p>Erstellen und verwalten Sie narrative Texte für Ihre Yoga-Sessions</p>
        </div>
      </header>

      <div className="sessions-container">
        {showForm ? (
          <StoryForm
            story={editingStory}
            onSubmit={editingStory ? handleUpdate : handleCreate}
            onCancel={handleCancel}
          />
        ) : (
          <>
            <div className="sessions-header">
              <h2>Ihre Story Elemente ({stories.length})</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                ➕ Neues Story Element
              </button>
            </div>

            {stories.length === 0 ? (
              <div className="empty-state">
                <p>Noch keine Story Elemente vorhanden.</p>
                <p>Erstellen Sie Ihr erstes Story Element!</p>
                <p className="form-hint" style={{ marginTop: '1rem' }}>
                  Story Elemente sind narrative Texte, die Sie zwischen Übungen 
                  in Ihre Sessions einfügen können, um eine durchgehende Geschichte zu erzählen.
                </p>
              </div>
            ) : (
              <div className="sessions-grid">
                {stories.map(story => (
                  <StoryCard
                    key={story.id}
                    story={story}
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
