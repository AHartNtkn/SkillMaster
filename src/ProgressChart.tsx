import React, { useEffect, useState } from 'react';
import { loadLog, appendEntry } from './xpStore';

export interface XpEntry {
  id: number;
  ts: string;
  delta: number;
  source: string;
}

export function logXp(delta: number, source: string) {
  appendEntry(delta, source);
}

export default function ProgressChart() {
  const [dailyXp, setDailyXp] = useState<{ date: string; xp: number }[]>([]);

  useEffect(() => {
    const log = loadLog();
    const today = new Date();
    const days: { date: string; xp: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const xp = log
        .filter(e => e.ts.slice(0, 10) === dateStr)
        .reduce((sum, e) => sum + e.delta, 0);
      days.push({ date: dateStr, xp });
    }
    setDailyXp(days);
  }, []);

  const maxXp = Math.max(...dailyXp.map(d => d.xp), 10);

  return (
    <div>
      <h2>XP Earned Last 7 Days</h2>
      <div className="chart">
        {dailyXp.map(d => (
          <div key={d.date} className="bar" style={{ height: `${(d.xp / maxXp) * 100}%` }} title={`${d.date}: ${d.xp} XP`}></div>
        ))}
      </div>
      <div className="chart-labels">
        {dailyXp.map(d => (
          <span key={d.date}>{d.date.slice(5)}</span>
        ))}
      </div>
    </div>
  );
}
