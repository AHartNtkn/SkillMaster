import React, { useEffect, useState } from 'react';
import { loadCourses, CourseMeta } from './courseLoader';

export default function CourseLibrary() {
  const [courses, setCourses] = useState<CourseMeta[]>([]);
  useEffect(() => {
    loadCourses().then(setCourses);
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Course Library</h2>
      {courses.length === 0 && <p>No courses available.</p>}
      <ul>
        {courses.map(c => (
          <li key={c.id}>
            <strong>{c.name}</strong> ({c.id})
          </li>
        ))}
      </ul>
    </div>
  );
}
