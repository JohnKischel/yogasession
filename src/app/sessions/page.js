'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  getSessions, 
  createSession, 
  updateSession, 
  deleteSession 
} from '../../lib/sessionStorage';
import { getExercises } from '../../lib/exerciseStorage';
import { getStories, isStoryId } from '../../lib/storyStorage';
import { getStoryBooks } from '../../lib/storyBookStorage';

const CATEGORIES = ['Morgen', 'Abend', 'Kraft', 'Entspannung', 'Balance'];
const LEVELS = ['Anfänger', 'Fortgeschritten', 'Alle Levels'];

function SessionForm({ session, exercises, stories, storyBooks, onSubmit, onCancel }) {
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

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleAddExercise = (exerciseId) => {
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, exerciseId]
    }));
  };

  const handleAddStory = (storyId) => {
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, storyId]
    }));
  };

  const handleAddStoryBook = (storyBook) => {
    // Add all stories from the story book to the session
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, ...storyBook.storyIds]
    }));
  };

  const handleRemoveExercise = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, idx) => idx !== indexToRemove)
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
      const newExercises = [...prev.exercises];
      const [draggedItem] = newExercises.splice(draggedIndex, 1);
      newExercises.splice(dropIndex, 0, draggedItem);
      return { ...prev, exercises: newExercises };
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

  // Create exercise lookup map
  const exerciseMap = new Map(exercises.map(e => [e.id, e]));
  
  // Create story lookup map
  const storyMap = new Map(stories.map(s => [s.id, s]));
  
  // Combined map for all items
  const itemMap = new Map([...exerciseMap, ...storyMap]);

  return (
    <form onSubmit={handleSubmit} className="session-form">
      <h2>{session ? 'Session bearbeiten' : 'Neue Session erstellen'}</h2>
      
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
          rows={3}
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
          rows={3}
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

      <div className="form-group">
        <label id="exercises-label">Übungen hinzufügen</label>
        <p className="exercise-hint">Klicken Sie auf eine Übung, um sie hinzuzufügen (mehrfach möglich)</p>
        <div className="exercise-selector" role="group" aria-labelledby="exercises-label">
          {exercises.length === 0 ? (
            <p className="no-exercises">Keine Übungen verfügbar. Erstellen Sie zuerst Übungen.</p>
          ) : (
            exercises.map(exercise => (
              <button
                type="button"
                key={exercise.id}
                className="exercise-add-btn"
                onClick={() => handleAddExercise(exercise.id)}
                aria-label={`${exercise.title} hinzufügen (${exercise.duration_minutes} Minuten)`}
              >
                <span className="exercise-add-icon">➕</span>
                <span className="exercise-label">
                  💪 {exercise.title} ({exercise.duration_minutes} Min.)
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="form-group">
        <label id="stories-label">Story Elemente hinzufügen</label>
        <p className="exercise-hint">Klicken Sie auf ein Story Element, um es hinzuzufügen</p>
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
        <label id="storybooks-label">Story Books hinzufügen</label>
        <p className="exercise-hint">Klicken Sie auf ein Story Book, um alle seine Story Elemente hinzuzufügen</p>
        <div className="exercise-selector" role="group" aria-labelledby="storybooks-label">
          {storyBooks.length === 0 ? (
            <p className="no-exercises">Keine Story Books verfügbar. <Link href="/storybooks">Erstellen Sie Story Books</Link>.</p>
          ) : (
            storyBooks.map(storyBook => {
              const bookStories = storyBook.storyIds
                .map(id => storyMap.get(id))
                .filter(Boolean);
              const totalTime = bookStories.reduce((sum, s) => sum + (s.time || 0), 0);
              return (
                <button
                  type="button"
                  key={storyBook.id}
                  className="exercise-add-btn storybook-add-btn"
                  onClick={() => handleAddStoryBook(storyBook)}
                  aria-label={`${storyBook.title} hinzufügen (${storyBook.storyIds.length} Stories, ${totalTime} Minuten)`}
                >
                  <span className="exercise-add-icon">➕</span>
                  <span className="exercise-label">
                    📚 {storyBook.title} ({storyBook.storyIds.length} Stories, {totalTime} Min.)
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="form-group">
        <label>Ausgewählte Elemente ({formData.exercises.length})</label>
        <p className="exercise-hint">Ziehen Sie die Elemente, um die Reihenfolge zu ändern</p>
        <div className="selected-exercises-list">
          {formData.exercises.length === 0 ? (
            <p className="no-exercises">Noch keine Elemente ausgewählt</p>
          ) : (
            formData.exercises.map((itemId, idx) => {
              const isStory = isStoryId(itemId);
              const item = itemMap.get(itemId);
              if (!item) {
                console.warn(`Item with ID "${itemId}" not found`);
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
                      onClick={() => handleRemoveExercise(idx)}
                      aria-label="Fehlendes Element entfernen"
                    >
                      ✕
                    </button>
                  </div>
                );
              }
              return (
                <div
                  key={`${itemId}-${idx}`}
                  className={`selected-exercise-item ${isStory ? 'story-item' : ''} ${draggedIndex === idx ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="drag-handle">☰</span>
                  <span className="exercise-number">{idx + 1}.</span>
                  <span className="exercise-name">{isStory ? '📖' : '💪'} {item.title}</span>
                  {!isStory && <span className="exercise-duration">({item.duration_minutes} Min.)</span>}
                  {isStory && <span className="exercise-duration">({item.time} Min.)</span>}
                  <button
                    type="button"
                    className="btn-remove-exercise"
                    onClick={() => handleRemoveExercise(idx)}
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

function SessionCard({ session, exercises, stories, onEdit, onDelete }) {
  const exerciseMap = new Map(exercises.map(e => [e.id, e]));
  const storyMap = new Map(stories.map(s => [s.id, s]));
  const itemMap = new Map([...exerciseMap, ...storyMap]);
  
  const sessionItems = session.exercises
    .map(id => {
      const item = itemMap.get(id);
      if (!item) {
        console.warn(`Item with ID "${id}" not found in session "${session.title}"`);
        return null;
      }
      return { ...item, isStory: isStoryId(id) };
    })
    .filter(Boolean);
  
  const exerciseCount = sessionItems.filter(item => !item.isStory).length;
  const storyCount = sessionItems.filter(item => item.isStory).length;

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
        <span>💪 {exerciseCount} Übungen</span>
        {storyCount > 0 && <span>📖 {storyCount} Story Elemente</span>}
      </div>
      <div className="session-exercises">
        <strong>Ablauf:</strong>
        <ol>
          {sessionItems.map((item, idx) => (
            <li key={`${item.id}-${idx}`}>
              {item.isStory ? '📖' : '💪'} {item.title}
            </li>
          ))}
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
  const [storyBooks, setStoryBooks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  const loadData = useCallback(() => {
    setSessions(getSessions());
    setExercises(getExercises());
    setStories(getStories());
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
