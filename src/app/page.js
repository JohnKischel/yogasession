'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { exercises, session } from '../data/yoga-data';

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
  
  return sessionExercises.map((exercise) => {
    const startMinutes = currentMinutes;
    const endMinutes = currentMinutes + exercise.duration_minutes;
    
    const result = {
      ...exercise,
      startTime: formatTime(startMinutes),
      endTime: formatTime(endMinutes),
      endMinutes: endMinutes,
    };
    
    currentMinutes = endMinutes;
    return result;
  });
}

function ExerciseCard({ exercise, index }) {
  return (
    <div className="timeline-item" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="timeline-time">
        {exercise.startTime} - {exercise.endTime}
      </div>
      <div className="exercise-card">
        <div className="card-header">
          <span className="exercise-icon">{exercise.icon}</span>
          <div>
            <h3 className="exercise-title">{exercise.title}</h3>
            <span className="exercise-category">{exercise.category}</span>
          </div>
        </div>
        <p className="exercise-description">{exercise.description}</p>
        <div className="exercise-tags">
          {exercise.tags.map((tag) => (
            <span key={tag} className="exercise-tag">#{tag}</span>
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
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedMsRef = useRef(0);
  const timelineContainerRef = useRef(null);
  
  const sessionExercises = useMemo(() => {
    return session.exercises.map(id => exercises.find(e => e.id === id));
  }, []);
  
  const exercisesWithTimes = useMemo(() => {
    return calculateExerciseTimes(startTime, sessionExercises);
  }, [startTime, sessionExercises]);
  
  const sessionEndTime = useMemo(() => {
    if (exercisesWithTimes.length === 0) return startTime;
    return exercisesWithTimes[exercisesWithTimes.length - 1].endTime;
  }, [exercisesWithTimes, startTime]);

  const totalDurationMs = session.total_duration_minutes * 60 * 1000;

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
  
  return (
    <main>
      <header className="header">
        <div className="header-content">
          <h1>🧘 {session.title}</h1>
          <p>{session.description}</p>
        </div>
      </header>
      
      <section className="session-info">
        <div className="session-meta">
          <div className="session-meta-item">
            <span className="session-meta-icon">⏱️</span>
            <span>{session.total_duration_minutes} Minuten</span>
          </div>
          <div className="session-meta-item">
            <span className="session-meta-icon">📊</span>
            <span>{session.level}</span>
          </div>
          <div className="session-meta-item">
            <span className="session-meta-icon">🧘</span>
            <span>{session.exercises.length} Übungen</span>
          </div>
        </div>
        <div className="session-story">
          <p>{session.story}</p>
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
        <div className="timeline">
          {exercisesWithTimes.map((exercise, index) => (
            <ExerciseCard key={exercise.id} exercise={exercise} index={index} />
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
