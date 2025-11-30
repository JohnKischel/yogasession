'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { exercises as defaultExercises, session as defaultSession } from '../data/yoga-data';
import { getSessions, reorderSessionExercises } from '../lib/sessionStorage';
import { getExercises } from '../lib/exerciseStorage';
import { getStories, isStoryId } from '../lib/storyStorage';
import { exercises, session } from '../data/yoga-data';

function formatTime(totalMinutes) {
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const mins = totalMinutes % 60;
  const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  return days > 0 ? `${timeStr} (+${days})` : timeStr;
}

function calculateExerciseTimes(startTime, sessionItems) {
  const [hours, mins] = startTime.split(':').map(Number);
  let currentMinutes = hours * 60 + mins;
  
  return sessionItems.map((item, idx) => {
    const startMinutes = currentMinutes;
    // Story elements have 0 duration, they are just narrative pauses
    const duration = item.duration_minutes || 0;
    const endMinutes = currentMinutes + duration;
    
    const result = {
      ...item,
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
  const isStory = exercise.type === 'story';
  
  return (
    <div 
      className={`timeline-item ${isDragging ? 'dragging' : ''} ${isStory ? 'story-timeline-item' : ''}`} 
      style={{ animationDelay: `${index * 0.1}s` }}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      {!isStory && (
        <div className="timeline-time">
          {exercise.startTime} - {exercise.endTime}
        </div>
      )}
      {isStory && (
        <div className="timeline-time story-marker">
          📖 Story
        </div>
      )}
      <div className={`exercise-card ${isStory ? 'story-card' : ''}`}>
        <div className="card-header">
          <span className="drag-handle" title="Drag to reorder">☰</span>
          <span className="exercise-icon">{isStory ? '📖' : exercise.icon}</span>
          <div>
            <h3 className="exercise-title">{exercise.title}</h3>
            <span className="exercise-category">{isStory ? exercise.mood || 'Story Element' : exercise.category}</span>
          </div>
        </div>
        <p className="exercise-description">{isStory ? exercise.text : exercise.description}</p>
        {exercise.tags && exercise.tags.length > 0 && (
          <div className="exercise-tags">
            {exercise.tags.map((tag, tagIdx) => (
              <span key={`${tag}-${tagIdx}`} className="exercise-tag">#{tag}</span>
            ))}
          </div>
        )}
        {!isStory && (
          <div className="exercise-duration">
            <span>⏱️</span>
            <span>{exercise.duration_minutes} Minuten</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [startTime, setStartTime] = useState('13:00');
  const [allSessions, setAllSessions] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [allStories, setAllStories] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('default');
  const [currentExerciseOrder, setCurrentExerciseOrder] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedMsRef = useRef(0);
  const timelineContainerRef = useRef(null);

  // Load sessions, exercises, and stories from localStorage
  useEffect(() => {
    const storedSessions = getSessions();
    const storedExercises = getExercises();
    const storedStories = getStories();
    setAllSessions(storedSessions);
    setAllExercises(storedExercises);
    setAllStories(storedStories);
    
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

  // Build item lookup map from default exercises, stored exercises, and stories
  const itemMap = useMemo(() => {
    const map = new Map();
    defaultExercises.forEach(e => map.set(e.id, e));
    allExercises.forEach(e => map.set(e.id, e));
    allStories.forEach(s => map.set(s.id, { ...s, type: 'story' }));
    return map;
  }, [allExercises, allStories]);

  // Get items (exercises and stories) for the current session
  const sessionItems = useMemo(() => {
    return currentExerciseOrder
      .map(id => {
        const item = itemMap.get(id);
        if (!item) {
          console.warn(`Item with ID "${id}" not found in item map`);
        }
        return item;
      })
      .filter(Boolean);
  }, [currentExerciseOrder, itemMap]);
  
  const itemsWithTimes = useMemo(() => {
    return calculateExerciseTimes(startTime, sessionItems);
  }, [startTime, sessionItems]);

  // Calculate total duration (only exercises have duration, stories are 0)
  const totalDuration = useMemo(() => {
    return sessionItems.reduce((sum, item) => sum + (item.duration_minutes || 0), 0);
  }, [sessionItems]);
  
  const sessionEndTime = useMemo(() => {
    if (itemsWithTimes.length === 0) return startTime;
    return itemsWithTimes[itemsWithTimes.length - 1].endTime;
  }, [itemsWithTimes, startTime]);

  const totalDurationMs = totalDuration * 60 * 1000;

  // Keep elapsedMsRef in sync with elapsedMs state
  useEffect(() => {
    elapsedMsRef.current = elapsedMs;
  }, [elapsedMs]);

  const handleScroll = useCallback(() => {
    if (!timelineContainerRef.current) return;
    if (totalDurationMs <= 0) return;
    
    const container = timelineContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerTop = container.offsetTop;
    const containerHeight = containerRect.height;
    const viewportHeight = window.innerHeight;
    
    // Calculate the scrollable range
    const scrollStart = Math.max(0, containerTop - viewportHeight * 0.3);
    const scrollEnd = containerTop + containerHeight - viewportHeight;
    const scrollRange = Math.max(0, scrollEnd - scrollStart);
    
    const progress = Math.min(elapsedMs / totalDurationMs, 1);
    const targetScrollY = scrollStart + scrollRange * progress;
    
    window.scrollTo({
      top: Math.max(0, targetScrollY),
      behavior: 'auto'
    });
  }, [elapsedMs, totalDurationMs]);

  // Throttled scroll effect - only update scroll position periodically
  const lastScrollTimeRef = useRef(0);
  const scrollThrottleMs = 100; // Update scroll every 100ms

  useEffect(() => {
    if (!isRunning) return;
    
    const now = performance.now();
    if (now - lastScrollTimeRef.current >= scrollThrottleMs) {
      handleScroll();
      lastScrollTimeRef.current = now;
    }
  }, [isRunning, handleScroll, elapsedMs]);

  useEffect(() => {
    if (!isRunning) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    startTimeRef.current = performance.now() - elapsedMsRef.current;

    const animate = (currentTime) => {
      const newElapsed = currentTime - startTimeRef.current;
      
      if (newElapsed >= totalDurationMs) {
        setElapsedMs(totalDurationMs);
        setIsRunning(false);
        return;
      }
      
      setElapsedMs(newElapsed);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, totalDurationMs]);

  const handleStartStop = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      if (elapsedMs >= totalDurationMs) {
        setElapsedMs(0);
      }
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedMs(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatElapsed = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = Math.min((elapsedMs / totalDurationMs) * 100, 100);

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
    // Reset timer when session changes
    setIsRunning(false);
    setElapsedMs(0);
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

      <section className="session-controls">
        <div className="session-timer">
          <span className="timer-display">{formatElapsed(elapsedMs)} / {formatElapsed(totalDurationMs)}</span>
          <div className="progress-bar">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="session-buttons">
          <button 
            className={`btn btn-start ${isRunning ? 'running' : ''}`}
            onClick={handleStartStop}
          >
            {isRunning ? '⏸️ Pause' : '▶️ Start'}
          </button>
          <button 
            className="btn btn-reset"
            onClick={handleReset}
            disabled={elapsedMs === 0 && !isRunning}
          >
            🔄 Reset
          </button>
        </div>
      </section>
      
      <section className="timeline-container" ref={timelineContainerRef}>
        <h2 className="timeline-title">Deine Session Timeline</h2>
        <p className="drag-hint">☰ Ziehen Sie die Elemente, um die Reihenfolge zu ändern</p>
        <div className="timeline">
          {itemsWithTimes.map((item, index) => (
            <ExerciseCard 
              key={`${item.id}-${item.uniqueIndex}`} 
              exercise={item} 
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
