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
import { Card } from 'ts-fsrs';

interface Mastery {
  status: 'unseen' | 'in_progress' | 'mastered';
  card: Card;
  n: number;
  lastGrades: number[];
  next_q_index: number;
}

function loadMastery(asId: string): Mastery {
  try {
    const raw = localStorage.getItem(`mastery_${asId}`);
    if (!raw) return initMastery();
    const obj = JSON.parse(raw);
    obj.card.due = new Date(obj.card.due);
    if (obj.card.last_review) obj.card.last_review = new Date(obj.card.last_review);
    return obj as Mastery;
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
    const mastery = loadMastery(skill.id);
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
          <button className="btn" onClick={backToCourses} style={{ marginBottom: '0.5rem' }}>
            Back to Courses
          </button>
          <h3>{selectedCourse.name}</h3>
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
          <button className="btn" onClick={backToTopics} style={{ marginBottom: '0.5rem' }}>
            Back to Topics
          </button>
          <h3>{selectedTopic.name}</h3>
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
          <button className="btn" onClick={backToSkills} style={{ marginBottom: '0.5rem' }}>
            Back to Skills
          </button>
          <h3>{selectedSkill.skill.name}</h3>
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
