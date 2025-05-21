import React, { useEffect, useState } from 'react';

export interface XpEntry {
  id: number;
  ts: string;
  delta: number;
  source: string;
}

export interface SkillEntry {
  id: number;
  ts: string;
  asId: string;
  type: 'review' | 'mastered';
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

function loadSkillLog(): SkillEntry[] {
  try {
    const raw = localStorage.getItem('skill_log');
    if (!raw) return [];
    const obj = JSON.parse(raw);
    if (Array.isArray(obj.log)) return obj.log as SkillEntry[];
    if (Array.isArray(obj)) return obj as SkillEntry[];
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

function saveSkillLog(log: SkillEntry[]) {
  try {
    localStorage.setItem('skill_log', JSON.stringify({ format: 'SkillLog-v1', log }));
  } catch {}
}

export function logXp(delta: number, source: string) {
  const log = loadXpLog();
  const nextId = log.length > 0 ? log[log.length - 1].id + 1 : 1;
  log.push({ id: nextId, ts: new Date().toISOString(), delta, source });
  saveXpLog(log);
}

export function logSkillEvent(asId: string, type: 'review' | 'mastered') {
  const log = loadSkillLog();
  const nextId = log.length > 0 ? log[log.length - 1].id + 1 : 1;
  log.push({ id: nextId, ts: new Date().toISOString(), asId, type });
  saveSkillLog(log);
}

export default function ProgressChart() {
  const [dailyStats, setDailyStats] = useState<
    { date: string; xp: number; reviewed: number; mastered: number }[]
  >([]);

  useEffect(() => {
    const xpLog = loadXpLog();
    const skillLog = loadSkillLog();
    const today = new Date();
    const days: { date: string; xp: number; reviewed: number; mastered: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const xp = xpLog
        .filter(e => e.ts.slice(0, 10) === dateStr)
        .reduce((sum, e) => sum + e.delta, 0);
      const reviewed = skillLog.filter(e => e.ts.slice(0, 10) === dateStr && e.type === 'review').length;
      const mastered = skillLog.filter(e => e.ts.slice(0, 10) === dateStr && e.type === 'mastered').length;
      days.push({ date: dateStr, xp, reviewed, mastered });
    }
    setDailyStats(days);
  }, []);

  const maxXp = Math.max(...dailyStats.map(d => d.xp), 10);
  const maxReviewed = Math.max(...dailyStats.map(d => d.reviewed), 1);
  const maxMastered = Math.max(...dailyStats.map(d => d.mastered), 1);

  return (
    <div>
      <h2>XP Earned Last 7 Days</h2>
      <div className="chart">
        {dailyStats.map(d => (
          <div key={d.date} className="bar-container">
            <div className="bar" style={{ height: `${(d.xp / maxXp) * 100}%` }} />
            <span className="bar-value">{d.xp}</span>
          </div>
        ))}
      </div>
      <div className="chart-labels">
        {dailyStats.map(d => (
          <span key={d.date}>{d.date.slice(5)}</span>
        ))}
      </div>

      <h2 style={{ marginTop: '1rem' }}>Skills Reviewed</h2>
      <div className="chart">
        {dailyStats.map(d => (
          <div key={d.date} className="bar-container">
            <div className="bar" style={{ height: `${(d.reviewed / maxReviewed) * 100}%` }} />
            <span className="bar-value">{d.reviewed}</span>
          </div>
        ))}
      </div>
      <div className="chart-labels">
        {dailyStats.map(d => (
          <span key={d.date}>{d.date.slice(5)}</span>
        ))}
      </div>

      <h2 style={{ marginTop: '1rem' }}>New Skills Mastered</h2>
      <div className="chart">
        {dailyStats.map(d => (
          <div key={d.date} className="bar-container">
            <div className="bar" style={{ height: `${(d.mastered / maxMastered) * 100}%` }} />
            <span className="bar-value">{d.mastered}</span>
          </div>
        ))}
      </div>
      <div className="chart-labels">
        {dailyStats.map(d => (
          <span key={d.date}>{d.date.slice(5)}</span>
        ))}
      </div>
    </div>
  );
}
