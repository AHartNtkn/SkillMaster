export default function migrate(data: any) {
  return {
    format: 'Prefs-v1',
    xp_since_mixed_quiz: data.xp_since_mixed_quiz ?? 0,
    last_as: data.last_as ?? null,
    ui_theme: data.ui_theme ?? 'default'
  }
}
