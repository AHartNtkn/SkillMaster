import json
import os
import sys
from pathlib import Path


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)


def write_text(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)


def main(kg_path, course_dir):
    with open(kg_path, 'r', encoding='utf-8') as f:
        kg = json.load(f)

    catalog = kg.get('catalog', {})
    topics = kg.get('topics', [])
    skills = kg.get('skills', [])

    course_path = Path(course_dir)
    (course_path / 'skills').mkdir(parents=True, exist_ok=True)
    (course_path / 'topics').mkdir(parents=True, exist_ok=True)
    (course_path / 'as_md').mkdir(parents=True, exist_ok=True)
    (course_path / 'as_questions').mkdir(parents=True, exist_ok=True)

    # catalog
    if catalog:
        write_json(course_path / 'catalog.json', {
            'format': catalog.get('format', 'Catalog-v1'),
            'course_id': catalog.get('course_id'),
            'title': catalog.get('title')
        })

    # topics
    for t in topics:
        data = {
            'id': t['id'],
            'name': t['name'],
            'ass': t['skills']
        }
        write_json(course_path / 'topics' / f"{t['id']}.json", data)

    # skills
    for s in skills:
        prereqs = []
        for p in s.get('prerequisites', []):
            prereqs.append({'id': p['skill_id'], 'weight': p.get('weight', 1.0)})
        data = {
            'id': s['id'],
            'title': s['title'],
            'desc': s['desc'],
            'prereqs': prereqs,
            'xp': 1
        }
        write_json(course_path / 'skills' / f"{s['id']}.json", data)

        # markdown explanation using description
        md = f"# {s['title']}\n\n{s['desc']}\n"
        write_text(course_path / 'as_md' / f"{s['id']}.md", md)

        # dummy question file
        yaml_content = (
            "format: ASQ-v1\n"
            f"id: {s['id']}\n"
            "pool:\n"
            "  - id: q1\n"
            f"    stem: Example question for {s['id']}\n"
            "    choices: ['A', 'B', 'C', 'D']\n"
            "    correct: 0\n"
            "    solution: Placeholder solution\n"
        )
        write_text(course_path / 'as_questions' / f"{s['id']}.yaml", yaml_content)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('Usage: generate_course_from_kg.py <kg_json> <course_dir>')
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
