import os
import re

d = os.path.dirname(os.path.abspath(__file__))

for r, _, fs in os.walk(d):
    for f in fs:
        if f.endswith('.py'):
            p = os.path.join(r, f)
            with open(p, 'r', encoding='utf-8') as file:
                c = file.read()
            
            # Replace from package import module -> from package import module
            c = re.sub(r'from \.\.([a-zA-Z0-9_]+)', r'from \1', c)
            
            # For modules inside a package (like models, routers), replace from .module import -> from package.module import
            pkg = os.path.basename(r)
            if pkg in ['models', 'schemas', 'auth', 'ai', 'routers', 'services', 'seed']:
                c = re.sub(r'from \.([a-zA-Z0-9_]+)', rf'from {pkg}.\1', c)
                
            with open(p, 'w', encoding='utf-8') as file:
                file.write(c)
