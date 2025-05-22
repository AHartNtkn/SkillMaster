import migrate1 from './migrate_Prefs-v0_Prefs-v1'
import migrate2 from './migrate_Prefs-v1_Prefs-v2'
export default function migrate(data: any) {
  return migrate2(migrate1(data))
}
