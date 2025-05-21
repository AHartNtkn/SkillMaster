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

function parseQuestionsYaml(text: string): ASQuestion[] {
  const lines = text.split(/\r?\n/);
  const qs: ASQuestion[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.startsWith('- id:')) {
      const q: ASQuestion = {
        id: line.slice(5).trim(),
        stem: '',
        choices: [],
        correct: 0
      };
      i++;
      while (i < lines.length && /^\s+/.test(lines[i])) {
        const l = lines[i].trim();
        if (l.startsWith('stem:')) {
          q.stem = l.slice(5).trim().replace(/^"|"$/g, '');
        } else if (l.startsWith('choices:')) {
          const arr = l
            .slice(8)
            .trim()
            .replace(/^\[|\]$/g, '')
            .split(',')
            .map(s => s.trim().replace(/^"|"$/g, ''));
          q.choices = arr;
        } else if (l.startsWith('correct:')) {
          q.correct = parseInt(l.slice(8).trim(), 10);
        } else if (l.startsWith('solution:')) {
          q.solution = l.slice(9).trim().replace(/^"|"$/g, '');
        }
        i++;
      }
      qs.push(q);
    } else {
      i++;
    }
  }
  return qs;
}

export async function loadQuestions(
  coursePath: string,
  asId: string
): Promise<ASQuestion[]> {
  try {
    const res = await fetch(`/${coursePath}as_questions/${asId}.yaml`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const txt = await res.text();
    return parseQuestionsYaml(txt);
  } catch (e) {
    console.error('Failed to load questions', e);
    return [];
  }
}

