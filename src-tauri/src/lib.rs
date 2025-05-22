use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use tauri::{AppHandle, Runtime, Window};
use tauri_plugin_shell::ShellExt;

use tauri::command;

fn persistence_dir() -> PathBuf {
  #[cfg(target_os = "android")]
  {
    PathBuf::from("Android/data/com.mathacademy/files")
  }
  #[cfg(not(target_os = "android"))]
  {
    dirs::home_dir()
      .unwrap_or_else(|| PathBuf::from("."))
      .join(".mathacademy")
  }
}

fn full_path(rel: &str) -> PathBuf {
  persistence_dir().join(rel)
}

#[command]
fn read_file(path: String) -> Result<String, String> {
  let p = full_path(&path);
  fs::read_to_string(p).map_err(|e| e.to_string())
}

#[command]
fn write_file(path: String, data: String) -> Result<(), String> {
  let p = full_path(&path);
  if let Some(parent) = p.parent() {
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
  }
  let tmp = p.with_extension("tmp");
  {
    let mut f = File::create(&tmp).map_err(|e| e.to_string())?;
    f.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
    f.sync_all().map_err(|e| e.to_string())?;
  }
  fs::rename(tmp, p).map_err(|e| e.to_string())
}

#[command]
#[allow(deprecated)]
async fn open_file<R: Runtime>(app: AppHandle<R>, _window: Window<R>, path: String) -> Result<(), String> {
  let p = PathBuf::from(&path);
  if !p.exists() {
    return Err(format!("File not found: {}", path));
  }

  let shell = app.shell();
  shell.open(path, None).map_err(|e| e.to_string())
}

#[command]
fn log_error(msg: String) -> Result<(), String> {
  let p = persistence_dir().join("logs/error.log");
  if let Some(parent) = p.parent() {
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
  }
  let mut f = fs::OpenOptions::new()
    .create(true)
    .append(true)
    .open(&p)
    .map_err(|e| e.to_string())?;
  writeln!(f, "{}", msg).map_err(|e| e.to_string())
}

#[command]
fn log_debug(msg: String) -> Result<(), String> {
  if !cfg!(debug_assertions) {
    return Ok(());
  }
  let p = persistence_dir().join("logs/debug.log");
  if let Some(parent) = p.parent() {
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
  }
  let mut f = fs::OpenOptions::new()
    .create(true)
    .append(true)
    .open(&p)
    .map_err(|e| e.to_string())?;
  writeln!(f, "{}", msg).map_err(|e| e.to_string())
}

#[command]
fn get_schedule() -> Result<String, String> {
  // placeholder until scheduler implemented in Rust
  Ok("[]".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .invoke_handler(tauri::generate_handler![read_file, write_file, log_error, log_debug, get_schedule, open_file])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
