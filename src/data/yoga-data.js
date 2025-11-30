export const exercises = [
  {
    id: "1",
    title: "Sonnengruß",
    description: "Eine fließende Abfolge von Positionen, die den gesamten Körper aufwärmt und die Energie zum Fließen bringt.",
    category: "Stehübungen",
    tags: ["aufwärmen", "flow", "ganzkörper"],
    duration_minutes: 5,
    icon: "☀️"
  },
  {
    id: "2",
    title: "Krieger I (Virabhadrasana I)",
    description: "Stehende Position zur Stärkung der Beine und Öffnung der Hüften. Diese Asana fördert Kraft und Standfestigkeit.",
    category: "Stehübungen",
    tags: ["kraft", "balance", "beine"],
    duration_minutes: 4,
    icon: "⚔️"
  },
  {
    id: "3",
    title: "Herabschauender Hund (Adho Mukha Svanasana)",
    description: "Eine der wichtigsten Yoga-Positionen, die den gesamten Körper dehnt und stärkt. Beruhigt den Geist und energetisiert den Körper.",
    category: "Stehübungen",
    tags: ["dehnung", "kraft", "umkehrhaltung"],
    duration_minutes: 3,
    icon: "🐕"
  },
  {
    id: "4",
    title: "Kobra (Bhujangasana)",
    description: "Liegende Rückbeuge zur Stärkung des unteren Rückens und Öffnung des Herzraums. Verbessert die Flexibilität der Wirbelsäule.",
    category: "Liegeübungen",
    tags: ["rücken", "kraft", "rückbeuge"],
    duration_minutes: 3,
    icon: "🐍"
  },
  {
    id: "5",
    title: "Shavasana (Totenstellung)",
    description: "Die wichtigste Entspannungsposition zum Abschluss der Praxis. Ermöglicht dem Körper, die Übungen zu integrieren und tiefe Entspannung zu erfahren.",
    category: "Liegeübungen",
    tags: ["entspannung", "meditation", "abschluss"],
    duration_minutes: 5,
    icon: "🧘"
  }
];

export const session = {
  id: "1",
  title: "Basis Yoga Flow",
  description: "Eine ausgewogene Yoga-Session für Anfänger und Fortgeschrittene. Perfekt für einen energetischen Start in den Tag oder eine entspannende Pause.",
  story: "Beginne deine Reise mit dem belebenden Sonnengruß, finde Stärke im Krieger, dehne und stärke dich im herabschauenden Hund, öffne dein Herz in der Kobra und finde tiefe Entspannung in Shavasana.",
  exercises: ["1", "2", "3", "4", "5"],
  total_duration_minutes: 20,
  level: "Alle Levels"
};
