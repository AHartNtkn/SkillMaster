import React, { useEffect, useState } from 'react';
import {
  loadCourses,
  CourseMeta,
  loadCatalog,
  Catalog,
  loadTopic,
  Topic,
  loadSkill,
  Skill,
} from './courseLoader';
import { initMastery } from './engine.js';
import { loadMastery } from './masteryStore';
import { Card } from 'ts-fsrs';

interface Mastery {
  status: 'unseen' | 'in_progress' | 'mastered';
  card: Card;
  n: number;
  lastGrades: number[];
  next_q_index: number;
}

function loadMasteryLocal(asId: string): Mastery {
  try {
    const m = loadMastery(asId) as unknown as Mastery;
    m.card.due = new Date(m.card.due);
    if (m.card.last_review) m.card.last_review = new Date(m.card.last_review as any);
    return m;
  } catch (e) {
    console.error('Failed to load mastery', e);
    return initMastery();
  }
}

export default function CourseLibrary() {
  const [courses, setCourses] = useState<CourseMeta[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseMeta | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<{ skill: Skill; mastery: Mastery } | null>(null);

  useEffect(() => {
    loadCourses().then(setCourses);
  }, []);

  async function chooseCourse(course: CourseMeta) {
    setSelectedCourse(course);
    setSelectedTopic(null);
    setSelectedSkill(null);
    const catalog = await loadCatalog(course.path);
    if (catalog) {
      const loaded: Topic[] = [];
      for (const tid of catalog.entry_topics) {
        const t = await loadTopic(course.path, tid);
        if (t) loaded.push(t);
      }
      setTopics(loaded);
    } else {
      setTopics([]);
    }
  }

  async function chooseTopic(topic: Topic) {
    if (!selectedCourse) return;
    setSelectedTopic(topic);
    setSelectedSkill(null);
    const loaded: Skill[] = [];
    for (const as of topic.ass) {
      const s = await loadSkill(selectedCourse.path, as);
      if (s) loaded.push(s);
    }
    setSkills(loaded);
  }

  function chooseSkill(skill: Skill) {
    const mastery = loadMasteryLocal(skill.id);
    setSelectedSkill({ skill, mastery });
  }

  function backToCourses() {
    setSelectedCourse(null);
    setSelectedTopic(null);
    setSelectedSkill(null);
  }

  function backToTopics() {
    setSelectedTopic(null);
    setSelectedSkill(null);
  }

  function backToSkills() {
    setSelectedSkill(null);
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Course Library</h2>
      {!selectedCourse && (
        <ul>
          {courses.map(c => (
            <li key={c.id}>
              <button className="btn" onClick={() => chooseCourse(c)}>
                {c.name} ({c.id})
              </button>
            </li>
          ))}
        </ul>
      )}
      {selectedCourse && !selectedTopic && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3>{selectedCourse.name}</h3>
            <button className="btn" onClick={backToCourses}>
              Back to Courses
            </button>
          </div>
          {topics.length === 0 && <p>No topics found.</p>}
          <ul>
            {topics.map(t => (
              <li key={t.id}>
                <button className="btn" onClick={() => chooseTopic(t)}>
                  {t.name} ({t.id})
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedCourse && selectedTopic && !selectedSkill && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3>{selectedTopic.name}</h3>
            <button className="btn" onClick={backToTopics}>
              Back to Topics
            </button>
          </div>
          {skills.length === 0 && <p>No skills found.</p>}
          <ul>
            {skills.map(s => (
              <li key={s.id}>
                <button className="btn" onClick={() => chooseSkill(s)}>
                  {s.name} ({s.id})
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedCourse && selectedTopic && selectedSkill && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3>{selectedSkill.skill.name}</h3>
            <button className="btn" onClick={backToSkills}>
              Back to Skills
            </button>
          </div>
          <p>Status: {selectedSkill.mastery.status}</p>
          <p>Attempts: {selectedSkill.mastery.n}</p>
          {selectedSkill.mastery.lastGrades.length > 0 ? (
            <p>Last Grades: {selectedSkill.mastery.lastGrades.join(', ')}</p>
          ) : (
            <p>No history yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
