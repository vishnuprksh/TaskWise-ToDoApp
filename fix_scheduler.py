import sys

with open('lib/screens/scheduler_screen.dart', 'r') as f:
    content = f.read()

# Fix the type error
new_content = content.replace('projectColor: project?.color ?? Colors.blue,', 'projectColor: project?.colorValue ?? Colors.blue,')

with open('lib/screens/scheduler_screen.dart', 'w') as f:
    f.write(new_content)
