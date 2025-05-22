use serde::{Serialize, Deserialize};
use serde_json;
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::Path;

#[tauri::command]
fn read_text(path: String) -> tauri::Result<String> {
    Ok(fs::read_to_string(path)?)
}

#[tauri::command]
fn write_text(path: String, content: String) -> tauri::Result<()> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(path, content)?;
    Ok(())
}

#[derive(Serialize)]
struct IndexData {
    dist: HashMap<String, HashMap<String, u32>>,
    as_count: HashMap<String, usize>,
}

fn floyd_warshall(nodes: &[String], edges: &[(String, String)]) -> HashMap<String, HashMap<String, u32>> {
    let n = nodes.len();
    let mut index = HashMap::new();
    for (i, n) in nodes.iter().enumerate() { index.insert(n.clone(), i); }
    const INF: u32 = u32::MAX / 2;
    let mut dist = vec![vec![INF; n]; n];
    for i in 0..n { dist[i][i] = 0; }
    for (a,b) in edges {
        if let (Some(&i), Some(&j)) = (index.get(a), index.get(b)) {
            dist[i][j] = 1;
            dist[j][i] = 1;
        }
    }
    for k in 0..n {
        for i in 0..n {
            for j in 0..n {
                let nd = dist[i][k].saturating_add(dist[k][j]);
                if nd < dist[i][j] { dist[i][j] = nd; }
            }
        }
    }
    let mut result = HashMap::new();
    for i in 0..n {
        let mut row = HashMap::new();
        for j in 0..n {
            if dist[i][j] < INF { row.insert(nodes[j].clone(), dist[i][j]); }
        }
        result.insert(nodes[i].clone(), row);
    }
    result
}

#[tauri::command]
fn build_index(course_dirs: Vec<String>) -> tauri::Result<IndexData> {
    let mut edges: Vec<(String,String)> = Vec::new();
    let mut as_count: HashMap<String, usize> = HashMap::new();
    let mut nodes: HashSet<String> = HashSet::new();

    for dir in course_dirs {
        let topics_dir = Path::new(&dir).join("topics");
        if topics_dir.exists() {
            for entry in fs::read_dir(&topics_dir)? {
                let path = entry?.path();
                let txt = fs::read_to_string(&path)?;
                let data: serde_json::Value = serde_json::from_str(&txt)?;
                if let (Some(id), Some(ass)) = (data.get("id"), data.get("ass")) {
                    if let (Some(id_s), Some(arr)) = (id.as_str(), ass.as_array()) {
                        as_count.insert(id_s.to_string(), arr.len());
                    }
                }
            }
        }

        let edges_file = Path::new(&dir).join("edges.csv");
        if edges_file.exists() {
            let text = fs::read_to_string(edges_file)?;
            for line in text.lines().skip(1) {
                let mut parts = line.split(',');
                if let (Some(src), Some(dst)) = (parts.next(), parts.next()) {
                    edges.push((src.to_string(), dst.to_string()));
                    nodes.insert(src.to_string());
                    nodes.insert(dst.to_string());
                }
            }
        }
    }

    let node_list: Vec<String> = nodes.into_iter().collect();
    let dist = floyd_warshall(&node_list, &edges);
    Ok(IndexData { dist, as_count })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![read_text, write_text, build_index])
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
