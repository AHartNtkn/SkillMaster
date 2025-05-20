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
