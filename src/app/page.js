'use client';

import { useState, useMemo } from 'react';
import { exercises, session } from '../data/yoga-data';

function formatTime(hours, minutes) {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function calculateExerciseTimes(startTime, sessionExercises) {
  const [hours, mins] = startTime.split(':').map(Number);
  let currentMinutes = hours * 60 + mins;
  
  return sessionExercises.map((exercise) => {
    const startHours = Math.floor(currentMinutes / 60) % 24;
    const startMins = currentMinutes % 60;
    const endMinutes = currentMinutes + exercise.duration_minutes;
    const endHours = Math.floor(endMinutes / 60) % 24;
    const endMins = endMinutes % 60;
    
    const result = {
      ...exercise,
      startTime: formatTime(startHours, startMins),
      endTime: formatTime(endHours, endMins),
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
      
      <section className="timeline-container">
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
