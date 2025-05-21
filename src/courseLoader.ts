export interface CourseMeta {
  id: string;
  name: string;
  path: string;
}

export interface CoursesFile {
  format: string;
  courses: CourseMeta[];
}

export async function loadCourses(): Promise<CourseMeta[]> {
  try {
    const res = await fetch('/courses.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: CoursesFile = await res.json();
    return data.courses || [];
  } catch (e) {
    console.error('Failed to load courses.json', e);
    return [];
  }
}

export interface Catalog {
  format: string;
  course_id: string;
  entry_topics: string[];
  description: string;
}

export interface Topic {
  id: string;
  name: string;
  ass: string[];
}

export interface Skill {
  id: string;
  name: string;
  prereqs?: string[];
  weights?: Record<string, number>;
}

export interface ASQuestion {
  id: string;
  stem: string;
  choices: string[];
  correct: number;
  solution?: string;
}

export async function loadCatalog(coursePath: string): Promise<Catalog | null> {
  try {
    const res = await fetch(`/${coursePath}catalog.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Catalog;
  } catch (e) {
    console.error('Failed to load catalog', e);
    return null;
  }
}

export async function loadTopic(
  coursePath: string,
  topicId: string
): Promise<Topic | null> {
  try {
    const res = await fetch(`/${coursePath}topics/${topicId}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Topic;
  } catch (e) {
    console.error('Failed to load topic', e);
    return null;
  }
}

export async function loadSkill(
  coursePath: string,
  asId: string
): Promise<Skill | null> {
  try {
    const res = await fetch(`/${coursePath}skills/${asId}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Skill;
  } catch (e) {
    console.error('Failed to load skill', e);
    return null;
  }
}

export async function loadMarkdown(
  coursePath: string,
  asId: string
): Promise<string> {
  try {
    const res = await fetch(`/${coursePath}as_md/${asId}.md`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (e) {
    console.error('Failed to load markdown', e);
    return '';
  }
}

function parseQuestionsYaml(text: string): {
  id: string;
  questions: ASQuestion[];
} {
  const lines = text.split(/\r?\n/);
  let yamlId = '';
  const qs: ASQuestion[] = [];
  let current: ASQuestion | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('id:')) {
      yamlId = line.slice(3).trim();
      continue;
    }
    if (line.startsWith('- id:')) {
      if (current) qs.push(current);
      current = {
        id: line.slice(5).trim(),
        stem: '',
        choices: [],
        correct: 0
      };
      continue;
    }
    if (!current) continue;
    if (line.startsWith('stem:')) {
      current.stem = line.slice(5).trim().replace(/^"|"$/g, '');
    } else if (line.startsWith('choices:')) {
      const arr = line
        .slice(8)
        .trim()
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map(s => s.trim().replace(/^"|"$/g, ''));
      current.choices = arr.filter(s => s.length > 0);
    } else if (line.startsWith('correct:')) {
      current.correct = parseInt(line.slice(8).trim(), 10);
    } else if (line.startsWith('solution:')) {
      current.solution = line.slice(9).trim().replace(/^"|"$/g, '');
    }
  }
  if (current) qs.push(current);
  return { id: yamlId, questions: qs };
}

export async function loadQuestions(
  coursePath: string,
  asId: string
): Promise<ASQuestion[]> {
  try {
    const res = await fetch(`/${coursePath}as_questions/${asId}.yaml`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const txt = await res.text();
    const parsed = parseQuestionsYaml(txt);
    const expected = asId.replace(':', '_');
    if (parsed.id && parsed.id !== expected) {
      console.warn(`YAML id ${parsed.id} does not match ${expected}`);
    }
    return parsed.questions;
  } catch (e) {
    console.error('Failed to load questions', e);
    return [];
  }
}

