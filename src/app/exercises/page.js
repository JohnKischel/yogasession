'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  getExercises, 
  createExercise, 
  deleteExercise 
} from '../../lib/exerciseStorage';

const CATEGORIES = ['Stehübungen', 'Liegeübungen', 'Sitzübungen', 'Gleichgewicht', 'Entspannung'];

function ExerciseForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    tags: '',
    duration_minutes: 5
  });
  const [errors, setErrors] = useState([]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
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
      tags: tagsArray
    });
    
    if (!result.success) {
      setErrors(result.errors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="session-form">
      <h2>Neue Übung erstellen</h2>
      
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
          placeholder="z.B. Krieger II"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Beschreibung *</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Eine kurze Beschreibung der Übung"
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
        <label htmlFor="tags">Tags (kommagetrennt)</label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="z.B. kraft, balance, dehnung"
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Abbrechen
        </button>
        <button type="submit" className="btn btn-primary">
          Erstellen
        </button>
      </div>
    </form>
  );
}

function ExerciseCard({ exercise, onDelete }) {
  return (
    <div className="session-card">
      <div className="session-card-header">
        <h3>{exercise.title}</h3>
        <div className="session-badges">
          <span className="badge badge-category">{exercise.category}</span>
        </div>
      </div>
      <p className="session-description">{exercise.description}</p>
      <div className="session-meta">
        <span>⏱️ {exercise.duration_minutes} Minuten</span>
      </div>
      {exercise.tags && exercise.tags.length > 0 && (
        <div className="exercise-tags">
          {exercise.tags.map(tag => (
            <span key={tag} className="exercise-tag">#{tag}</span>
          ))}
        </div>
      )}
      <div className="session-card-actions">
        <button className="btn btn-delete" onClick={() => onDelete(exercise.id)}>
          🗑️ Löschen
        </button>
      </div>
    </div>
  );
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const loadData = useCallback(() => {
    setExercises(getExercises());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = (formData) => {
    const result = createExercise(formData);
    if (result.success) {
      loadData();
      setShowForm(false);
    }
    return result;
  };

  const handleDelete = (id) => {
    if (window.confirm('Möchten Sie diese Übung wirklich löschen?')) {
      deleteExercise(id);
      loadData();
    }
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <main className="sessions-page">
      <header className="header">
        <div className="header-content">
          <h1>💪 Übungen Verwaltung</h1>
          <p>Erstellen und verwalten Sie Ihre Yoga-Übungen</p>
        </div>
      </header>

      <div className="sessions-container">
        {showForm ? (
          <ExerciseForm
            onSubmit={handleCreate}
            onCancel={handleCancel}
          />
        ) : (
          <>
            <div className="sessions-header">
              <h2>Ihre Übungen ({exercises.length})</h2>
              <button 
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                ➕ Neue Übung
              </button>
            </div>

            {exercises.length === 0 ? (
              <div className="empty-state">
                <p>Noch keine Übungen vorhanden.</p>
                <p>Erstellen Sie Ihre erste Übung!</p>
              </div>
            ) : (
              <div className="sessions-grid">
                {exercises.map(exercise => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
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
