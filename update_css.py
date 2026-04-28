import re

with open('src/styles.css', 'r') as f:
    css = f.read()

# 1. Update font-family
css = re.sub(r'font-family:[\s\S]*?;', 'font-family: "Outfit", "Space Grotesk", system-ui, sans-serif;', css, count=1)

# 2. Update Light Mode Variables
light_vars = """
  color-scheme: light;
  --bg: #f0f4f8;
  --surface: rgba(255, 255, 255, 0.7);
  --surface-2: rgba(255, 255, 255, 0.9);
  --text: #0f172a;
  --muted: #64748b;
  --line: rgba(148, 163, 184, 0.2);
  --brand: #3b82f6;
  --brand-2: #8b5cf6;
  --accent: #f59e0b;
  --danger: #ef4444;
  --ok: #10b981;
  --shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
  --glass-border: 1px solid rgba(255, 255, 255, 0.18);
"""
css = re.sub(r':root\s*{[^}]+}', f':root {{{light_vars}}}', css, count=1)

# 3. Update Dark Mode Variables
dark_vars = """
  color-scheme: dark;
  --bg: #0b0f19;
  --surface: rgba(15, 23, 42, 0.65);
  --surface-2: rgba(30, 41, 59, 0.75);
  --text: #f8fafc;
  --muted: #94a3b8;
  --line: rgba(255, 255, 255, 0.08);
  --brand: #0ea5e9;
  --brand-2: #6366f1;
  --accent: #fcd34d;
  --danger: #f87171;
  --ok: #34d399;
  --shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  --glass-border: 1px solid rgba(255, 255, 255, 0.05);
"""
css = re.sub(r':root\[data-theme="dark"\]\s*{[^}]+}', f':root[data-theme="dark"] {{{dark_vars}}}', css, count=1)

# 4. Inject Backdrop Filter to panels
def add_glass(match):
    block = match.group(0)
    if 'backdrop-filter' not in block:
        block = block.replace('}', '  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);\n  border: var(--glass-border);\n}')
    return block

css = re.sub(r'\.panel\s*{[^}]+}', add_glass, css)
css = re.sub(r'\.map-panel\s*{[^}]+}', add_glass, css)
css = re.sub(r'\.topbar\s*{[^}]+}', add_glass, css)
css = re.sub(r'\.workflow-card\s*{[^}]+}', add_glass, css)

# 5. Buttons and inputs aesthetics
def enhance_button(match):
    block = match.group(0)
    if 'transition' not in block:
         block = block.replace('}', '  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n}')
    return block

css = re.sub(r'\.primary-action\s*{[^}]+}', enhance_button, css)
css = re.sub(r'\.secondary-action\s*{[^}]+}', enhance_button, css)
css = re.sub(r'\.danger-action\s*{[^}]+}', enhance_button, css)
css = re.sub(r'\.site-nav__button\s*{[^}]+}', enhance_button, css)

# Make buttons slightly rounded and give hover effect
css += """
.primary-action:hover, .site-nav__button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -10px var(--brand);
  filter: brightness(1.1);
}
.secondary-action:hover {
  transform: translateY(-2px);
  background: var(--surface);
  box-shadow: var(--shadow);
}
.danger-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -10px var(--danger);
  filter: brightness(1.1);
}
.panel, .map-panel, .topbar {
  border-radius: 16px;
}
input, select {
  transition: border-color 0.3s, box-shadow 0.3s;
  border-radius: 12px;
}
input:focus, select:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}
.dashboard-page .shell {
  max-width: 1800px;
}
"""

with open('src/styles.css', 'w') as f:
    f.write(css)

print("CSS updated successfully")
