'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { exercises as defaultExercises, session as defaultSession } from '../data/yoga-data';
import { getSessions, reorderSessionExercises } from '../lib/sessionStorage';
import { getExercises } from '../lib/exerciseStorage';
import { getStories, isStoryId } from '../lib/storyStorage';
import { exercises, session } from '../data/yoga-data';

function calculateItemTimings(sessionItems) {
  let cumulativeMs = 0;
  
  return sessionItems.map((item, idx) => {
    const startMs = cumulativeMs;
    // Stories use 'time' field, exercises use 'duration_minutes'
    const durationMinutes = item.type === 'story' ? (item.time || 0) : (item.duration_minutes || 0);
    const durationMs = durationMinutes * 60 * 1000;
    const endMs = cumulativeMs + durationMs;
    
    const result = {
      ...item,
      uniqueIndex: idx,
      startMs: startMs,
      endMs: endMs,
      durationMs: durationMs,
      duration_minutes: durationMinutes, // Normalize duration for display
    };
    
    cumulativeMs = endMs;
    return result;
  });
}

// Helper function to truncate text with ellipsis
function truncateText(text, maxLength = 50) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Constants
const USER_SCROLL_RESET_DELAY = 3000; // Reset auto-scroll after this many ms of user inactivity
const SCROLL_THROTTLE_MS = 500; // Throttle scroll updates

function ExerciseCard({ exercise, index, onDragStart, onDragOver, onDrop, onDragEnd, isDragging, isActive, isPast }) {
  const isStory = exercise.type === 'story';
  // Use duration_minutes which is normalized in calculateItemTimings for both exercises and stories
  const durationMinutes = exercise.duration_minutes || 0;
  
  return (
    <div 
      className={`timeline-item ${isDragging ? 'dragging' : ''} ${isStory ? 'story-timeline-item' : ''} ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`} 
      style={{ animationDelay: `${index * 0.1}s` }}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      <div className={`timeline-time ${isStory ? 'story-marker' : ''}`}>
        {isStory ? `📖 ${durationMinutes} min` : `${durationMinutes} min`}
      </div>
      <div className={`exercise-card ${isStory ? 'story-card' : ''}`}>
        <div className="card-header">
          <span className="drag-handle" title="Drag to reorder">☰</span>
          <span className="exercise-icon">{isStory ? '📖' : exercise.icon}</span>
          <div>
            <h3 className="exercise-title">{exercise.title}</h3>
            <span className="exercise-category">{isStory ? exercise.mood || 'Story Element' : exercise.category}</span>
          </div>
        </div>
        {/* Show full description only when active, collapsed view otherwise */}
        {isActive ? (
          <>
            <p className="exercise-description">{isStory ? exercise.text : exercise.description}</p>
            <div className="exercise-duration">
              <span>⏱️</span>
              <span>{durationMinutes} Minuten</span>
            </div>
          </>
        ) : (
          <p className="exercise-description-collapsed">
            {truncateText(isStory ? exercise.text : exercise.description)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [allSessions, setAllSessions] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [allStories, setAllStories] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('default');
  const [currentExerciseOrder, setCurrentExerciseOrder] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [userScrolled, setUserScrolled] = useState(false);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedMsRef = useRef(0);
  const timelineContainerRef = useRef(null);
  const itemRefs = useRef([]);

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
    return calculateItemTimings(sessionItems);
  }, [sessionItems]);

  // Calculate total duration (only exercises have duration, stories are 0)
  const totalDuration = useMemo(() => {
    return sessionItems.reduce((sum, item) => sum + (item.duration_minutes || 0), 0);
  }, [sessionItems]);

  const totalDurationMs = totalDuration * 60 * 1000;
  
  // Calculate current item index based on elapsed time
  const currentItemIndex = useMemo(() => {
    if (itemsWithTimes.length === 0) return -1;
    
    for (let i = 0; i < itemsWithTimes.length; i++) {
      const item = itemsWithTimes[i];
      if (elapsedMs >= item.startMs && elapsedMs < item.endMs) {
        return i;
      }
    }
    // If past all items
    if (elapsedMs >= totalDurationMs) {
      return itemsWithTimes.length - 1;
    }
    return 0;
  }, [elapsedMs, itemsWithTimes, totalDurationMs]);

  // Keep elapsedMsRef in sync with elapsedMs state
  useEffect(() => {
    elapsedMsRef.current = elapsedMs;
  }, [elapsedMs]);

  const handleScroll = useCallback(() => {
    if (!timelineContainerRef.current) return;
    if (totalDurationMs <= 0) return;
    if (userScrolled) return; // Don't auto-scroll if user manually scrolled
    
    // Scroll to the current active item
    if (currentItemIndex >= 0 && itemRefs.current[currentItemIndex]) {
      itemRefs.current[currentItemIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [totalDurationMs, userScrolled, currentItemIndex]);

  // Throttled scroll effect - only update scroll position periodically
  const lastScrollTimeRef = useRef(0);

  // Track manual scroll by user
  useEffect(() => {
    let scrollTimeout;
    const handleUserScroll = () => {
      if (isRunning) {
        setUserScrolled(true);
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          setUserScrolled(false);
        }, USER_SCROLL_RESET_DELAY);
      }
    };

    window.addEventListener('wheel', handleUserScroll);
    window.addEventListener('touchmove', handleUserScroll);

    return () => {
      window.removeEventListener('wheel', handleUserScroll);
      window.removeEventListener('touchmove', handleUserScroll);
      clearTimeout(scrollTimeout);
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    
    const now = performance.now();
    if (now - lastScrollTimeRef.current >= SCROLL_THROTTLE_MS) {
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
        // Update both ref and state immediately to ensure consistency
        elapsedMsRef.current = 0;
        startTimeRef.current = performance.now();
        setElapsedMs(0);
      }
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    // Update both ref and state immediately to ensure consistency
    elapsedMsRef.current = 0;
    startTimeRef.current = performance.now();
    setElapsedMs(0);
    setUserScrolled(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Jump to previous item
  const handlePrevious = useCallback(() => {
    if (itemsWithTimes.length === 0) return;
    
    const targetIndex = Math.max(0, currentItemIndex - 1);
    
    const targetItem = itemsWithTimes[targetIndex];
    const newTime = targetItem.startMs;
    
    // Update both ref and state immediately to prevent animation loop from overwriting
    elapsedMsRef.current = newTime;
    startTimeRef.current = performance.now() - newTime;
    setElapsedMs(newTime);
    setUserScrolled(false);
    
    // Scroll to the item
    if (itemRefs.current[targetIndex]) {
      itemRefs.current[targetIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentItemIndex, itemsWithTimes]);

  // Jump to next item
  const handleNext = useCallback(() => {
    if (itemsWithTimes.length === 0) return;
    
    const targetIndex = Math.min(itemsWithTimes.length - 1, currentItemIndex + 1);
    
    const targetItem = itemsWithTimes[targetIndex];
    const newTime = targetItem.startMs;
    
    // Update both ref and state immediately to prevent animation loop from overwriting
    elapsedMsRef.current = newTime;
    startTimeRef.current = performance.now() - newTime;
    setElapsedMs(newTime);
    setUserScrolled(false);
    
    // Scroll to the item
    if (itemRefs.current[targetIndex]) {
      itemRefs.current[targetIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentItemIndex, itemsWithTimes]);

  // Scroll to current time position
  const scrollToCurrentItem = useCallback(() => {
    setUserScrolled(false);
    if (currentItemIndex >= 0 && itemRefs.current[currentItemIndex]) {
      itemRefs.current[currentItemIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentItemIndex]);

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

      <section className="timeline-container" ref={timelineContainerRef}>
        <h2 className="timeline-title">Deine Session Timeline</h2>
        <p className="drag-hint">☰ Ziehen Sie die Elemente, um die Reihenfolge zu ändern</p>
        <div className="timeline">
          {itemsWithTimes.map((item, index) => (
            <div 
              key={`${item.id}-${item.uniqueIndex}`}
              ref={el => itemRefs.current[index] = el}
            >
              <ExerciseCard 
                exercise={item} 
                index={index}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                isDragging={draggedIndex === index}
                isActive={index === currentItemIndex}
                isPast={index < currentItemIndex}
              />
            </div>
          ))}
        </div>
        
        <div className="timeline-end">
          <div className="timeline-end-marker">
            <span className="timeline-end-icon">✨</span>
            Session Ende
          </div>
        </div>
      </section>

      {/* Floating Controls */}
      <section className="floating-controls">
        <div className="floating-controls-inner">
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
              className="btn btn-nav"
              onClick={handlePrevious}
              disabled={currentItemIndex <= 0}
              title="Previous"
            >
              ⏮️
            </button>
            <button 
              className={`btn btn-start ${isRunning ? 'running' : ''}`}
              onClick={handleStartStop}
            >
              {isRunning ? '⏸️ Pause' : '▶️ Start'}
            </button>
            <button 
              className="btn btn-nav"
              onClick={handleNext}
              disabled={currentItemIndex >= itemsWithTimes.length - 1}
              title="Next"
            >
              ⏭️
            </button>
            <button 
              className="btn btn-reset"
              onClick={handleReset}
              disabled={elapsedMs === 0 && !isRunning}
            >
              🔄
            </button>
            {userScrolled && (
              <button 
                className="btn btn-sync"
                onClick={scrollToCurrentItem}
                title="Sync scroll to current item"
              >
                📍
              </button>
            )}
          </div>
        </div>
      </section>
      
      <footer className="footer">
        <p>🙏 Namaste - Genieße deine Yoga Praxis!</p>
      </footer>
    </main>
  );
}
