import React from 'react';
import MixedQuizPlayer from '../components/MixedQuizPlayer';

const TOTAL = 15;

export default function Learning() {
  const current = 1;
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Learning</h2>
      <p>Start your next Skill here.</p>
      <MixedQuizPlayer current={current} total={TOTAL}>
        <p>Question text goes here.</p>
      </MixedQuizPlayer>
    </div>
  );
}
