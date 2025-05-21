import React, { useEffect, useState } from 'react';
import {
  loadXpLog as loadXpFile,
  loadSkillLog as loadSkillFile,
  saveXpLog as saveXpFile,
  saveSkillLog as saveSkillFile,
  ensureSaveDir,
} from './storage';

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
  ensureSaveDir();
  try {
    return loadXpFile();
  } catch {
    return [];
  }
}

function loadSkillLog(): SkillEntry[] {
  ensureSaveDir();
  try {
    return loadSkillFile();
  } catch {
    return [];
  }
}

function saveXpLog(log: XpEntry[]) {
  try {
    saveXpFile(log);
  } catch {}
}

function saveSkillLog(log: SkillEntry[]) {
  try {
    saveSkillFile(log);
  } catch {}
}

function dispatchUpdate() {
  window.dispatchEvent(new Event('progressDataUpdated'));
}

export function logXp(delta: number, source: string) {
  const log = loadXpLog();
  const nextId = log.length > 0 ? log[log.length - 1].id + 1 : 1;
  log.push({ id: nextId, ts: new Date().toISOString(), delta, source });
  saveXpLog(log);
  dispatchUpdate();
}

export function logSkillEvent(asId: string, type: 'review' | 'mastered') {
  const log = loadSkillLog();
  const nextId = log.length > 0 ? log[log.length - 1].id + 1 : 1;
  log.push({ id: nextId, ts: new Date().toISOString(), asId, type });
  saveSkillLog(log);
  dispatchUpdate();
}

export default function ProgressChart() {
  const [dailyStats, setDailyStats] = useState<
    { date: string; xp: number; reviewed: number; mastered: number }[]
  >([]);

  const refreshStats = () => {
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
      const reviewed = skillLog.filter(
        e => e.ts.slice(0, 10) === dateStr && e.type === 'review'
      ).length;
      const mastered = skillLog.filter(
        e => e.ts.slice(0, 10) === dateStr && e.type === 'mastered'
      ).length;
      days.push({ date: dateStr, xp, reviewed, mastered });
    }
    setDailyStats(days);
  };

  useEffect(() => {
    refreshStats();
    window.addEventListener('progressDataUpdated', refreshStats);
    return () => window.removeEventListener('progressDataUpdated', refreshStats);
  }, []);

  const maxVal = Math.max(
    ...dailyStats.map(d => Math.max(d.xp, d.reviewed, d.mastered)),
    1
  );

  function makePoints(field: 'xp' | 'reviewed' | 'mastered') {
    if (dailyStats.length === 0) return '';
    return dailyStats
      .map((d, i) => {
        const x = (i / (dailyStats.length - 1)) * 100;
        const y = 100 - (d[field] / maxVal) * 100;
        return `${x},${y}`;
      })
      .join(' ');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h2>Last 7 Days</h2>
      <div className="line-chart" style={{ flexGrow: 1, position: 'relative' }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        >
          <polyline className="xp-line" points={makePoints('xp')} />
          <polyline className="reviewed-line" points={makePoints('reviewed')} />
          <polyline className="mastered-line" points={makePoints('mastered')} />
        </svg>
      </div>
      <div className="chart-labels">
        {dailyStats.map(d => (
          <span key={d.date}>{d.date.slice(5)}</span>
        ))}
      </div>
      <div className="chart-legend">
        <span className="xp-line">XP</span>
        <span className="reviewed-line">Reviewed</span>
        <span className="mastered-line">Mastered</span>
      </div>
    </div>
  );
}
