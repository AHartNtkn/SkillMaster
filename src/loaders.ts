export async function loadMarkdown(path: string): Promise<string> {
  try {
    const res = await fetch(path)
    if (!res.ok) return 'Content unavailable'
    return await res.text()
  } catch {
    return 'Content unavailable'
  }
}

export async function loadYaml(path: string): Promise<string> {
  try {
    const res = await fetch(path)
    if (!res.ok) return 'Content unavailable'
    return await res.text()
  } catch {
    return 'Content unavailable'
  }
}
