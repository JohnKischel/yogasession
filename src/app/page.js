'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { exercises as defaultExercises, session as defaultSession } from '../data/yoga-data';
import { getSessions, reorderSessionExercises } from '../lib/sessionStorage';
import { getExercises } from '../lib/exerciseStorage';

function formatTime(totalMinutes) {
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const mins = totalMinutes % 60;
  const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  return days > 0 ? `${timeStr} (+${days})` : timeStr;
}

function calculateExerciseTimes(startTime, sessionExercises) {
  const [hours, mins] = startTime.split(':').map(Number);
  let currentMinutes = hours * 60 + mins;
  
  return sessionExercises.map((exercise, idx) => {
    const startMinutes = currentMinutes;
    const endMinutes = currentMinutes + exercise.duration_minutes;
    
    const result = {
      ...exercise,
      uniqueIndex: idx,
      startTime: formatTime(startMinutes),
      endTime: formatTime(endMinutes),
      endMinutes: endMinutes,
    };
    
    currentMinutes = endMinutes;
    return result;
  });
}

function ExerciseCard({ exercise, index, onDragStart, onDragOver, onDrop, onDragEnd, isDragging }) {
  return (
    <div 
      className={`timeline-item ${isDragging ? 'dragging' : ''}`} 
      style={{ animationDelay: `${index * 0.1}s` }}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      <div className="timeline-time">
        {exercise.startTime} - {exercise.endTime}
      </div>
      <div className="exercise-card">
        <div className="card-header">
          <span className="drag-handle" title="Drag to reorder">☰</span>
          <span className="exercise-icon">{exercise.icon}</span>
          <div>
            <h3 className="exercise-title">{exercise.title}</h3>
            <span className="exercise-category">{exercise.category}</span>
          </div>
        </div>
        <p className="exercise-description">{exercise.description}</p>
        <div className="exercise-tags">
          {exercise.tags.map((tag, tagIdx) => (
            <span key={`${tag}-${tagIdx}`} className="exercise-tag">#{tag}</span>
          ))}
        </div>
        <div className="exercise-duration">
          <span>⏱️</span>
          <span>{exercise.duration_minutes} Minuten</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [startTime, setStartTime] = useState('13:00');
  const [allSessions, setAllSessions] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('default');
  const [currentExerciseOrder, setCurrentExerciseOrder] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load sessions and exercises from localStorage
  useEffect(() => {
    const storedSessions = getSessions();
    const storedExercises = getExercises();
    setAllSessions(storedSessions);
    setAllExercises(storedExercises);
    
    // Initialize with default session exercises
    setCurrentExerciseOrder(defaultSession.exercises);
    setIsLoaded(true);
  }, []);

  // Get current session data
  const currentSession = useMemo(() => {
    if (selectedSessionId === 'default') {
      return defaultSession;
    }
    return allSessions.find(s => s.id === selectedSessionId) || defaultSession;
  }, [selectedSessionId, allSessions]);

  // Update exercise order when session changes
  useEffect(() => {
    if (isLoaded) {
      setCurrentExerciseOrder(currentSession.exercises);
    }
  }, [currentSession, isLoaded]);

  // Build exercise lookup map from both default and stored exercises
  const exerciseMap = useMemo(() => {
    const map = new Map();
    defaultExercises.forEach(e => map.set(e.id, e));
    allExercises.forEach(e => map.set(e.id, e));
    return map;
  }, [allExercises]);

  // Get exercises for the current session
  const sessionExercises = useMemo(() => {
    return currentExerciseOrder
      .map(id => exerciseMap.get(id))
      .filter(Boolean);
  }, [currentExerciseOrder, exerciseMap]);
  
  const exercisesWithTimes = useMemo(() => {
    return calculateExerciseTimes(startTime, sessionExercises);
  }, [startTime, sessionExercises]);

  // Calculate total duration
  const totalDuration = useMemo(() => {
    return sessionExercises.reduce((sum, ex) => sum + ex.duration_minutes, 0);
  }, [sessionExercises]);
  
  const sessionEndTime = useMemo(() => {
    if (exercisesWithTimes.length === 0) return startTime;
    return exercisesWithTimes[exercisesWithTimes.length - 1].endTime;
  }, [exercisesWithTimes, startTime]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newOrder = [...currentExerciseOrder];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    
    setCurrentExerciseOrder(newOrder);
    
    // Save to localStorage if it's not the default session
    if (selectedSessionId !== 'default') {
      reorderSessionExercises(selectedSessionId, newOrder);
    }
    
    setDraggedIndex(null);
  }, [draggedIndex, currentExerciseOrder, selectedSessionId]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleSessionChange = (e) => {
    setSelectedSessionId(e.target.value);
  };

  if (!isLoaded) {
    return (
      <main>
        <header className="header">
          <div className="header-content">
            <h1>🧘 Loading...</h1>
          </div>
        </header>
      </main>
    );
  }

  return (
    <main>
      <header className="header">
        <div className="header-content">
          <h1>🧘 {currentSession.title}</h1>
          <p>{currentSession.description}</p>
        </div>
      </header>

      <section className="session-selector-container">
        <label htmlFor="session-selector">📋 Session auswählen:</label>
        <select
          id="session-selector"
          value={selectedSessionId}
          onChange={handleSessionChange}
          className="session-selector"
        >
          <option value="default">{defaultSession.title} (Standard)</option>
          {allSessions.map(session => (
            <option key={session.id} value={session.id}>
              {session.title}
            </option>
          ))}
        </select>
      </section>
      
      <section className="session-info">
        <div className="session-meta">
          <div className="session-meta-item">
            <span className="session-meta-icon">⏱️</span>
            <span>{totalDuration} Minuten</span>
          </div>
          <div className="session-meta-item">
            <span className="session-meta-icon">📊</span>
            <span>{currentSession.level}</span>
          </div>
          <div className="session-meta-item">
            <span className="session-meta-icon">🧘</span>
            <span>{currentExerciseOrder.length} Übungen</span>
          </div>
        </div>
        <div className="session-story">
          <p>{currentSession.story}</p>
        </div>
      </section>
      
      <section className="time-selector">
        <label htmlFor="start-time">🕐 Session Start:</label>
        <input
          type="time"
          id="start-time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </section>
      
      <section className="timeline-container">
        <h2 className="timeline-title">Deine Session Timeline</h2>
        <p className="drag-hint">☰ Ziehen Sie die Übungen, um die Reihenfolge zu ändern</p>
        <div className="timeline">
          {exercisesWithTimes.map((exercise, index) => (
            <ExerciseCard 
              key={`${exercise.id}-${exercise.uniqueIndex}`} 
              exercise={exercise} 
              index={index}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              isDragging={draggedIndex === index}
            />
          ))}
        </div>
        
        <div className="timeline-end">
          <div className="timeline-end-marker">
            <span className="timeline-end-icon">✨</span>
            Session Ende: {sessionEndTime}
          </div>
        </div>
      </section>
      
      <footer className="footer">
        <p>🙏 Namaste - Genieße deine Yoga Praxis!</p>
      </footer>
    </main>
  );
}
