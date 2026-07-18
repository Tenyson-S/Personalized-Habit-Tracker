import os
import re

CACHE_MAP = {
    'me': 'profile',
    'settings': 'settings',
    'interests': 'interests',
    'habits': 'habits',
    'dailies': 'dailies',
    'tasks': 'tasks',
    'today': 'today',
    'village': 'village',
    'journey': 'journey',
    'analytics-overview': 'analytics',
    'analytics-rhythm': 'analytics',
    'analytics-tasks': 'analytics',
    'analytics-records': 'analytics',
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # If file uses useQuery but doesn't import CACHE_POLICIES
    if 'useQuery(' in content and 'CACHE_POLICIES' not in content:
        # Calculate relative path to cachePolicy.ts
        # For simplicity we'll just inject it after the last import
        depth = len(filepath.split('mobile\\src\\')[1].split('\\')) - 1
        rel_path = '../' * depth + 'offline/cache/cachePolicy'
        import_stmt = f"import {{ CACHE_POLICIES }} from '{rel_path}';\n"
        
        last_import = content.rfind('import ')
        if last_import != -1:
            end_of_import = content.find('\n', last_import) + 1
            content = content[:end_of_import] + import_stmt + content[end_of_import:]
        else:
            content = import_stmt + content

    changed = False
    
    # We will regex replace useQuery({ queryKey: ['key', ...], ... })
    # with useQuery({ queryKey: ['key', ...], ...CACHE_POLICIES.category, ... })
    
    def repl(m):
        nonlocal changed
        full_match = m.group(0)
        key_str = m.group(1)
        
        # Find which policy matches
        policy = None
        for k, v in CACHE_MAP.items():
            if k in key_str:
                policy = v
                break
        
        if policy and f"...CACHE_POLICIES.{policy}" not in full_match:
            changed = True
            # insert policy after queryKey
            # wait, it's safer to just inject it at the end of the object
            # find the closing brace before the closing parenthesis
            idx = full_match.rfind('}')
            return full_match[:idx] + f", ...CACHE_POLICIES.{policy} " + full_match[idx:]
            
        return full_match

    # This regex is a bit naive but should work for single-line useQuery definitions
    new_content = re.sub(r'useQuery\(\{\s*queryKey:\s*\[([^\]]+)\].*?\}\)', repl, content, flags=re.DOTALL)
    
    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(r'z:\Habit Tracker\Phase 3\Personalized Habit Tracker\mobile\src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))
