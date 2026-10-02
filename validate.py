import re

with open('script.js', 'r', encoding='utf-8') as f:
    js_content = f.read()
with open('index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()
with open('style.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

id_matches = re.findall(r'getElementById\([\'"]([^\'"]+)[\'"]\)', js_content)
missing_ids = []
for dom_id in set(id_matches):
    if f'id="{dom_id}"' not in html_content:
        missing_ids.append(dom_id)

print(f"Total getElementById checked: {len(set(id_matches))}")
print(f"Missing IDs in HTML: {missing_ids}")
print(f"HTML lines: {len(html_content.splitlines())}")
print(f"JS lines: {len(js_content.splitlines())}")
print(f"CSS lines: {len(css_content.splitlines())}")
