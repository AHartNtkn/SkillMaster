// src/mock-tauri-fs.ts
// This is a mock for @tauri-apps/api/fs to allow Vite to resolve the import
// when not running in a full Tauri environment.
// The actual Tauri APIs will be used when running via 'tauri dev'.

export const createDir = async (...args: any[]): Promise<void> => {
  console.warn('Mocked tauri fs.createDir called. Args:', ...args);
};

export const exists = async (...args: any[]): Promise<boolean> => {
  console.warn('Mocked tauri fs.exists called. Args:', ...args);
  return false;
};

export const readTextFile = async (...args: any[]): Promise<string> => {
  console.warn('Mocked tauri fs.readTextFile called. Args:', ...args);
  return '';
};

export const writeFile = async (...args: any[]): Promise<void> => {
  console.warn('Mocked tauri fs.writeFile called. Args:', ...args);
};

// Based on usage in fileStore.ts: fs.BaseDirectory.App
export enum BaseDirectory {
  Audio = 1,
  Cache = 2,
  Config = 3,
  Data = 4,
  LocalData = 5,
  Desktop = 6,
  Document = 7,
  Download = 8,
  Executable = 9,
  Font = 10,
  Home = 11,
  Picture = 12,
  Public = 13,
  Runtime = 14,
  Template = 15,
  Video = 16,
  Resource = 17,
  App = 18, // This is the one used
  Log = 19,
  Temp = 20,
  AppConfig = 21,
  AppData = 22,
  AppLocalData = 23,
  AppCache = 24,
  AppLog = 25,
}

// Add any other functions or enums from @tauri-apps/api/fs that your fileStore.ts
// or other files might use, if they also cause issues. 