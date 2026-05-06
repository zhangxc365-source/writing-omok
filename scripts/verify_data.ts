
import { YCT_DATA } from '../src/data/yct_data';

function checkConsistency() {
  const issues: string[] = [];
  
  // Group by level and lesson
  const groups: { [key: string]: { [key: string]: Set<string> } } = {};
  
  YCT_DATA.forEach(entry => {
    if (!groups[entry.level]) groups[entry.level] = {};
    if (!groups[entry.level][entry.lesson]) groups[entry.level][entry.lesson] = new Set();
    groups[entry.level][entry.lesson].add(entry.char);
  });
  
  YCT_DATA.forEach((entry, idx) => {
    // Basic fields check
    if (!entry.char || !entry.pinyin || !entry.word || !entry.wordPinyin || !entry.translation) {
      issues.push(`Line ${idx + 14}: Missing basic fields`);
    }
    
    // Check if the character is actually in the word
    if (!entry.word.includes(entry.char)) {
      issues.push(`${entry.level} ${entry.lesson}: Incorrect char "${entry.char}" for word "${entry.word}".`);
    }

    // Check if all characters in 'word' are present in the same lesson
    const wordChars = entry.word.replace(/[.,!?。，！？\s]/g, '').split('');
    const presentChars = groups[entry.level][entry.lesson];
    
    wordChars.forEach(c => {
      if (!presentChars.has(c)) {
        // Some characters might be already known from earlier levels, but user says "lesson characters are incomplete"
        // Usually, for a lesson to be complete, all components of a NEW word should be there if they are being taught.
        // But some common characters like '人' or '子' might be omitted if already known.
        // However, if the user complains, they likely want them there.
        issues.push(`${entry.level} ${entry.lesson}: Word "${entry.word}" contains char "${c}" which is missing as an entry.`);
      }
    });
  });
  
  // Unique issues
  const uniqueIssues = Array.from(new Set(issues));
  console.log(JSON.stringify(uniqueIssues, null, 2));
}

checkConsistency();
