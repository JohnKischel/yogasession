import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'exercises.json');

function readExercises() {
  const data = fs.readFileSync(dataFilePath, 'utf-8');
  return JSON.parse(data);
}

function writeExercises(exercises) {
  fs.writeFileSync(dataFilePath, JSON.stringify(exercises, null, 2));
}

function generateId(exercises) {
  if (exercises.length === 0) {
    return '1';
  }
  const maxId = Math.max(...exercises.map(e => parseInt(e.id, 10)));
  return String(maxId + 1);
}

function validateExercise(exercise) {
  const errors = [];
  
  if (!exercise.title || typeof exercise.title !== 'string' || exercise.title.trim() === '') {
    errors.push('title is required and must be a non-empty string');
  }
  
  if (!exercise.description || typeof exercise.description !== 'string' || exercise.description.trim() === '') {
    errors.push('description is required and must be a non-empty string');
  }
  
  if (!exercise.category || typeof exercise.category !== 'string' || exercise.category.trim() === '') {
    errors.push('category is required and must be a non-empty string');
  }
  
  if (!Array.isArray(exercise.tags)) {
    errors.push('tags is required and must be an array');
  } else if (exercise.tags.some(tag => typeof tag !== 'string')) {
    errors.push('all tags must be strings');
  }
  
  if (typeof exercise.duration_minutes !== 'number' || exercise.duration_minutes <= 0) {
    errors.push('duration_minutes is required and must be a positive number');
  }
  
  return errors;
}

export async function GET() {
  const exercises = readExercises();
  return NextResponse.json(exercises);
}

export async function POST(request) {
  const body = await request.json();
  
  const validationErrors = validateExercise(body);
  if (validationErrors.length > 0) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationErrors },
      { status: 400 }
    );
  }
  
  const exercises = readExercises();
  
  const newExercise = {
    id: generateId(exercises),
    title: body.title.trim(),
    description: body.description.trim(),
    category: body.category.trim(),
    tags: body.tags.map(tag => tag.trim()),
    duration_minutes: body.duration_minutes
  };
  
  exercises.push(newExercise);
  writeExercises(exercises);
  
  return NextResponse.json(newExercise, { status: 201 });
}
