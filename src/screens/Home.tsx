import React from 'react';
import XpProgress from '../components/XpProgress';

const SAMPLE_XP = 75;
const THRESHOLD = 150;

export default function Home() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <p>Welcome to Skill Mastery.</p>
      <XpProgress current={SAMPLE_XP} threshold={THRESHOLD} />
    </div>
  );
}
