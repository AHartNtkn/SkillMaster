import React, { useEffect, useState } from 'react';

export interface XpEntry {
  id: number;
  ts: string;
  delta: number;
  source: string;
}

function loadXpLog(): XpEntry[] {
  try {
    const raw = localStorage.getItem('xp_log');
    if (!raw) return [];
    const obj = JSON.parse(raw);
    if (Array.isArray(obj.log)) return obj.log as XpEntry[];
    if (Array.isArray(obj)) return obj as XpEntry[];
    return [];
  } catch {
    return [];
  }
}

function saveXpLog(log: XpEntry[]) {
  try {
    localStorage.setItem('xp_log', JSON.stringify({ format: 'XP-v1', log }));
  } catch {}
}

export function logXp(delta: number, source: string) {
  const log = loadXpLog();
  const nextId = log.length > 0 ? log[log.length - 1].id + 1 : 1;
  log.push({ id: nextId, ts: new Date().toISOString(), delta, source });
  saveXpLog(log);
}

export interface SkillEvent {
  id: number;
  ts: string;
  as: string;
  type: 'review' | 'mastered';
}

function loadSkillEvents(): SkillEvent[] {
  try {
    const raw = localStorage.getItem('skill_events');
    if (!raw) return [];
    const obj = JSON.parse(raw);
    if (Array.isArray(obj.events)) return obj.events as SkillEvent[];
    if (Array.isArray(obj)) return obj as SkillEvent[];
    return [];
  } catch {
    return [];
  }
}

function saveSkillEvents(events: SkillEvent[]) {
  try {
    localStorage.setItem('skill_events', JSON.stringify({ format: 'SkillEvents-v1', events }));
  } catch {}
}

export function logSkillEvent(as: string, type: 'review' | 'mastered') {
  const events = loadSkillEvents();
  const nextId = events.length > 0 ? events[events.length - 1].id + 1 : 1;
  events.push({ id: nextId, ts: new Date().toISOString(), as, type });
  saveSkillEvents(events);
}

export default function ProgressChart() {
  const [daily, setDaily] = useState<{
    date: string;
    xp: number;
    mastered: number;
    reviewed: number;
  }[]>([]);

  useEffect(() => {
    const xpLog = loadXpLog();
    const events = loadSkillEvents();
    const today = new Date();
    const days: {
      date: string;
      xp: number;
      mastered: number;
      reviewed: number;
    }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const xp = xpLog
        .filter(e => e.ts.slice(0, 10) === dateStr)
        .reduce((sum, e) => sum + e.delta, 0);
      const masteredSet = new Set(
        events
          .filter(e => e.type === 'mastered' && e.ts.slice(0, 10) === dateStr)
          .map(e => e.as)
      );
      const reviewedSet = new Set(
        events
          .filter(e => e.type === 'review' && e.ts.slice(0, 10) === dateStr)
          .map(e => e.as)
      );
      days.push({
        date: dateStr,
        xp,
        mastered: masteredSet.size,
        reviewed: reviewedSet.size,
      });
    }
    setDaily(days);
  }, []);

  const maxXp = Math.max(...daily.map(d => d.xp), 10);

  return (
    <div>
      <h2>XP Earned Last 7 Days</h2>
      <div className="chart">
        {daily.map(d => (
          <div
            key={d.date}
            className="bar"
            style={{ height: `${(d.xp / maxXp) * 100}%` }}
            title={`${d.date}: ${d.xp} XP`}
          ></div>
        ))}
      </div>
      <div className="chart-labels">
        {daily.map(d => (
          <span key={d.date}>{d.date.slice(5)}</span>
        ))}
      </div>
      <h2 style={{ marginTop: '1rem' }}>Skills Last 7 Days</h2>
      <table className="stats-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Mastered</th>
            <th>Reviewed</th>
          </tr>
        </thead>
        <tbody>
          {daily.map(d => (
            <tr key={d.date}>
              <td>{d.date.slice(5)}</td>
              <td>{d.mastered}</td>
              <td>{d.reviewed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
