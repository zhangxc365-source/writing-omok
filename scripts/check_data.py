import re
from collections import Counter

content = open('src/data/yct_data.ts').read()
matches = re.findall(r"level:\s*'([^']*)'.*?lesson:\s*'([^']*)'", content, re.DOTALL)

counts = Counter(matches)
for (level, lesson), count in sorted(counts.items()):
    print(f"{level} {lesson}: {count}")
