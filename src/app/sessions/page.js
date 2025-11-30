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

const CATEGORIES = ['Morgen', 'Abend', 'Kraft', 'Entspannung', 'Balance'];
const LEVELS = ['Anfänger', 'Fortgeschritten', 'Alle Levels'];

function SessionForm({ session, exercises, onSubmit, onCancel }) {
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

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleExerciseToggle = (exerciseId) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.includes(exerciseId)
        ? prev.exercises.filter(id => id !== exerciseId)
        : [...prev.exercises, exerciseId]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors([]);
    
    const result = onSubmit(formData);
    if (!result.success) {
      setErrors(result.errors);
    }
  };

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
        <label>Übungen auswählen *</label>
        <div className="exercise-selector">
          {exercises.length === 0 ? (
            <p className="no-exercises">Keine Übungen verfügbar. Erstellen Sie zuerst Übungen.</p>
          ) : (
            exercises.map(exercise => (
              <label key={exercise.id} className="exercise-option">
                <input
                  type="checkbox"
                  checked={formData.exercises.includes(exercise.id)}
                  onChange={() => handleExerciseToggle(exercise.id)}
                />
                <span className="exercise-label">
                  {exercise.title} ({exercise.duration_minutes} Min.)
                </span>
              </label>
            ))
          )}
        </div>
        <p className="selected-count">
          {formData.exercises.length} Übung(en) ausgewählt
        </p>
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

function SessionCard({ session, exercises, onEdit, onDelete }) {
  const sessionExercises = session.exercises
    .map(id => exercises.find(e => e.id === id))
    .filter(Boolean);

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
        <span>🧘 {session.exercises.length} Übungen</span>
      </div>
      <div className="session-exercises">
        <strong>Übungen:</strong>
        <ul>
          {sessionExercises.map(ex => (
            <li key={ex.id}>{ex.title}</li>
          ))}
        </ul>
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
  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  const loadData = useCallback(() => {
    setSessions(getSessions());
    setExercises(getExercises());
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
