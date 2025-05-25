import json
import os

DATA_FILE = os.path.join('course', 'EA', 'knowledge_graph_full.json')
SKILLS_DIR = os.path.join('course', 'EA', 'skills')
MD_DIR = os.path.join('course', 'EA', 'as_md')

def main():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    os.makedirs(SKILLS_DIR, exist_ok=True)
    os.makedirs(MD_DIR, exist_ok=True)
    for skill in data.get('skills', []):
        skill_id = skill['id']
        # write skill json
        skill_path = os.path.join(SKILLS_DIR, f"{skill_id}.json")
        with open(skill_path, 'w', encoding='utf-8') as sf:
            json.dump(skill, sf, indent=2)
        # write markdown explanation using description
        md_path = os.path.join(MD_DIR, f"{skill_id}.md")
        if not os.path.exists(md_path):
            with open(md_path, 'w', encoding='utf-8') as mf:
                mf.write(f"# {skill['title']}\n\n{skill['desc']}\n")

if __name__ == '__main__':
    main()
