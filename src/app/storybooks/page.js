'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  getStoryBooks, 
  createStoryBook, 
  updateStoryBook,
  deleteStoryBook 
} from '../../lib/storyBookStorage';
import { getStories } from '../../lib/storyStorage';

const THEMES = ['Natur', 'Reise', 'Entspannung', 'Meditation', 'Energie', 'Balance'];

function StoryBookForm({ storyBook, stories, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: storyBook?.title || '',
    description: storyBook?.description || '',
    theme: storyBook?.theme || THEMES[0],
    storyIds: storyBook?.storyIds || []
  });
  const [errors, setErrors] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddStory = (storyId) => {
    setFormData(prev => ({
      ...prev,
      storyIds: [...prev.storyIds, storyId]
    }));
  };

  const handleRemoveStory = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      storyIds: prev.storyIds.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    setFormData(prev => {
      const newStoryIds = [...prev.storyIds];
      const [draggedItem] = newStoryIds.splice(draggedIndex, 1);
      newStoryIds.splice(dropIndex, 0, draggedItem);
      return { ...prev, storyIds: newStoryIds };
    });
    
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors([]);
    
    const result = onSubmit(formData);
    if (!result.success) {
      setErrors(result.errors);
    }
  };

  // Create story lookup map
  const storyMap = new Map(stories.map(s => [s.id, s]));

  // Calculate total time for selected stories
  const totalTime = formData.storyIds.reduce((sum, storyId) => {
    const story = storyMap.get(storyId);
    return sum + (story?.time || 0);
  }, 0);

  return (
    <form onSubmit={handleSubmit} className="session-form">
      <h2>{storyBook ? 'Story Book bearbeiten' : 'Neues Story Book erstellen'}</h2>
      
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
          placeholder="z.B. Waldspaziergang"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Beschreibung *</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Eine Beschreibung der Geschichte, die dieses Story Book erzählt..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="theme">Thema</label>
        <select
          id="theme"
          name="theme"
          value={formData.theme}
          onChange={handleChange}
        >
          {THEMES.map(theme => (
            <option key={theme} value={theme}>{theme}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label id="stories-label">Story Elemente hinzufügen</label>
        <p className="exercise-hint">Klicken Sie auf ein Story Element, um es zum Story Book hinzuzufügen</p>
        <div className="exercise-selector" role="group" aria-labelledby="stories-label">
          {stories.length === 0 ? (
            <p className="no-exercises">Keine Story Elemente verfügbar. <Link href="/stories">Erstellen Sie Story Elemente</Link>.</p>
          ) : (
            stories.map(story => (
              <button
                type="button"
                key={story.id}
                className="exercise-add-btn story-add-btn"
                onClick={() => handleAddStory(story.id)}
                aria-label={`${story.title} hinzufügen (${story.time} Minuten)`}
              >
                <span className="exercise-add-icon">➕</span>
                <span className="exercise-label">
                  📖 {story.title} ({story.time} Min.)
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Ausgewählte Story Elemente ({formData.storyIds.length}) - Gesamt: {totalTime} Min.</label>
        <p className="exercise-hint">Ziehen Sie die Elemente, um die Reihenfolge zu ändern</p>
        <div className="selected-exercises-list">
          {formData.storyIds.length === 0 ? (
            <p className="no-exercises">Noch keine Story Elemente ausgewählt</p>
          ) : (
            formData.storyIds.map((storyId, idx) => {
              const story = storyMap.get(storyId);
              if (!story) {
                return (
                  <div
                    key={`missing-${storyId}-${idx}`}
                    className="selected-exercise-item missing"
                  >
                    <span className="exercise-number">{idx + 1}.</span>
                    <span className="exercise-name" style={{ color: '#c62828' }}>
                      Story nicht gefunden (ID: {storyId})
                    </span>
                    <button
                      type="button"
                      className="btn-remove-exercise"
                      onClick={() => handleRemoveStory(idx)}
                      aria-label="Fehlende Story entfernen"
                    >
                      ✕
                    </button>
                  </div>
                );
              }
              return (
                <div
                  key={`${storyId}-${idx}`}
                  className={`selected-exercise-item story-item ${draggedIndex === idx ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="drag-handle">☰</span>
                  <span className="exercise-number">{idx + 1}.</span>
                  <span className="exercise-name">📖 {story.title}</span>
                  <span className="exercise-duration">({story.time} Min.)</span>
                  <button
                    type="button"
                    className="btn-remove-exercise"
                    onClick={() => handleRemoveStory(idx)}
                    aria-label={`${story.title} entfernen`}
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Abbrechen
        </button>
        <button type="submit" className="btn btn-primary">
          {storyBook ? 'Speichern' : 'Erstellen'}
        </button>
      </div>
    </form>
  );
}

function StoryBookCard({ storyBook, stories, onEdit, onDelete }) {
  const storyMap = new Map(stories.map(s => [s.id, s]));
  
  const bookStories = storyBook.storyIds
    .map(id => storyMap.get(id))
    .filter(Boolean);
  
  const totalTime = bookStories.reduce((sum, story) => sum + (story.time || 0), 0);

  return (
    <div className="session-card storybook-card">
      <div className="session-card-header">
        <h3>📚 {storyBook.title}</h3>
        <div className="session-badges">
          {storyBook.theme && <span className="badge badge-category">{storyBook.theme}</span>}
          <span className="badge badge-duration">⏱️ {totalTime} Min.</span>
          <span className="badge badge-level">{bookStories.length} Stories</span>
        </div>
      </div>
      <p className="session-description">{storyBook.description}</p>
      {bookStories.length > 0 && (
        <div className="session-exercises">
          <strong>Story Elemente:</strong>
          <ol>
            {bookStories.map((story, idx) => (
              <li key={`${story.id}-${idx}`}>
                📖 {story.title} ({story.time} Min.)
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="session-card-actions">
        <button className="btn btn-edit" onClick={() => onEdit(storyBook)}>
          ✏️ Bearbeiten
        </button>
        <button className="btn btn-delete" onClick={() => onDelete(storyBook.id)}>
          🗑️ Löschen
        </button>
      </div>
    </div>
  );
}

export default function StoryBooksPage() {
  const [storyBooks, setStoryBooks] = useState([]);
  const [stories, setStories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStoryBook, setEditingStoryBook] = useState(null);

  const loadData = useCallback(() => {
    setStoryBooks(getStoryBooks());
    setStories(getStories());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = (formData) => {
    const result = createStoryBook(formData);
    if (result.success) {
      loadData();
      setShowForm(false);
    }
    return result;
  };

  const handleUpdate = (formData) => {
    const result = updateStoryBook(editingStoryBook.id, formData);
    if (result.success) {
      loadData();
      setEditingStoryBook(null);
      setShowForm(false);
    }
    return result;
  };

  const handleDelete = (id) => {
    if (window.confirm('Möchten Sie dieses Story Book wirklich löschen?')) {
      deleteStoryBook(id);
      loadData();
    }
  };

  const handleEdit = (storyBook) => {
    setEditingStoryBook(storyBook);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStoryBook(null);
  };

  return (
    <main className="sessions-page">
      <header className="header">
        <div className="header-content">
          <h1>📚 Story Books</h1>
          <p>Sammeln Sie Story Elemente zu thematischen Geschichten</p>
        </div>
      </header>

      <div className="sessions-container">
        {showForm ? (
          <StoryBookForm
            storyBook={editingStoryBook}
            stories={stories}
            onSubmit={editingStoryBook ? handleUpdate : handleCreate}
            onCancel={handleCancel}
          />
        ) : (
          <>
            <div className="sessions-header">
              <h2>Ihre Story Books ({storyBooks.length})</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                ➕ Neues Story Book
              </button>
            </div>

            {storyBooks.length === 0 ? (
              <div className="empty-state">
                <p>Noch keine Story Books vorhanden.</p>
                <p>Erstellen Sie Ihr erstes Story Book!</p>
                <p className="form-hint" style={{ marginTop: '1rem' }}>
                  Story Books sind Sammlungen von Story Elementen, die zusammen 
                  eine kohärente Geschichte erzählen und in Sessions verwendet werden können.
                </p>
              </div>
            ) : (
              <div className="sessions-grid">
                {storyBooks.map(storyBook => (
                  <StoryBookCard
                    key={storyBook.id}
                    storyBook={storyBook}
                    stories={stories}
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
