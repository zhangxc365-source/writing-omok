
import { WordEntry } from '../src/data/yct_data';

const STROKES: {[key: string]: number} = {
    '另': 5, '外': 5, '刚': 6, '才': 3, '处': 5, '理': 11, '情': 11, '况': 7, '顺': 9, '利': 7, '愿': 14, '意': 13, '终': 8, '于': 3, '满': 13, '竟': 11, '然': 12, '以': 4, '为': 4, '其': 8, '实': 8, '结': 9, '果': 8, '往': 8, '照': 13, '顾': 10, '养': 9, '成': 6, '习': 3, '惯': 11, '也': 3, '许': 6, '并': 8, '反': 4, '正': 5, '消': 10, '息': 10, '居': 8, '恐': 10, '怕': 8, '词': 7, '典': 8, '专': 4, '门': 3, '至': 6, '少': 4, '总': 9, '是': 9, '究': 7, '难': 10, '道': 12, '向': 6, '对': 5, '哪': 9, '比': 4, '如': 6, '必': 5, '要': 9, '重': 9, '坚': 7, '持': 9, '保': 9, '证': 9, '提': 12, '醒': 16, '注': 8, '安': 6, '全': 6, '无': 4, '论': 6, '幸': 8, '亏': 3, '甚': 9, '至': 6, '显': 9, '尤': 4, '其': 8
};

const PINYIN: {[key: string]: string} = {
    '另': 'lìng', '外': 'wài', '刚': 'gāng', '才': 'cái', '处': 'chǔ', '理': 'lǐ', '情': 'qíng', '况': 'kuàng', '顺': 'shùn', '利': 'lì', '愿': 'yuàn', '意': 'yì', '终': 'zhōng', '于': 'yú', '满': 'mǎn', '竟': 'jìng', '然': 'rán', '以': 'yǐ', '为': 'wéi', '其': 'qí', '实': 'shí', '结': 'jié', '果': 'guǒ', '往': 'wǎng', '照': 'zhào', '顾': 'gù', '养': 'yǎng', '成': 'chéng', '习': 'xí', '惯': 'guàn', '也': 'yě', '许': 'xǔ', '并': 'bìng', '反': 'fǎn', '正': 'zhèng', '消': 'xiāo', '息': 'xi', '居': 'jū', '恐': 'kǒng', '怕': 'pà', '词': 'cí', '典': 'diǎn', '专': 'zhuān', '门': 'mén', '至': 'zhì', '少': 'shǎo', '总': 'zǒng', '是': 'shì', '究': 'jiū', '难': 'nán', '道': 'dào', '向': 'xiàng', '对': 'duì', '哪': 'nǎ', '比': 'bǐ', '如': 'rú', '必': 'bì', '要': 'yào', '重': 'zhòng', '坚': 'jiān', '持': 'chí', '保': 'bǎo', '证': 'zhèng', '提': 'tí', '醒': 'xǐng', '注': 'zhù', '安': 'ān', '全': 'quán', '无': 'wú', '论': 'lùn', '幸': 'xìng', '亏': 'kuī', '甚': 'shèn', '至': 'zhì', '显': 'xiǎn', '尤': 'yóu', '其': 'qí'
};

const WORDS_YCT6: {lesson: number, word: string, wordPinyin: string, translation: string}[] = [
    { lesson: 1, word: '另外', wordPinyin: 'lìng wài', translation: 'in addition' },
    { lesson: 1, word: '情况', wordPinyin: 'qíng kuàng', translation: 'situation' },
    { lesson: 1, word: '顺利', wordPinyin: 'shùn lì', translation: 'smoothly' },
    { lesson: 2, word: '愿意', wordPinyin: 'yuàn yì', translation: 'willing' },
    { lesson: 2, word: '终于', wordPinyin: 'zhōng yú', translation: 'finally' },
    { lesson: 2, word: '竟然', wordPinyin: 'jìng rán', translation: 'unexpectedly' },
    { lesson: 3, word: '以为', wordPinyin: 'yǐ wéi', translation: 'thought (mistakenly)' },
    { lesson: 3, word: '其实', wordPinyin: 'qí shí', translation: 'actually' },
    { lesson: 3, word: '结果', wordPinyin: 'jié guǒ', translation: 'result' },
    { lesson: 4, word: '照顾', wordPinyin: 'zhào gù', translation: 'take care of' },
    { lesson: 4, word: '习惯', wordPinyin: 'xí guàn', translation: 'habit' },
    { lesson: 5, word: '也许', wordPinyin: 'yě xǔ', translation: 'maybe' },
    { lesson: 5, word: '反正', wordPinyin: 'fǎn zhèng', translation: 'anyway' },
    { lesson: 6, word: '消息', wordPinyin: 'xiāo xi', translation: 'news' },
    { lesson: 6, word: '恐怕', wordPinyin: 'kǒng pà', translation: 'afraid that' },
    { lesson: 7, word: '词典', wordPinyin: 'cí diǎn', translation: 'dictionary' },
    { lesson: 7, word: '专门', wordPinyin: 'zhuān mén', translation: 'special' },
    { lesson: 7, word: '至少', wordPinyin: 'zhì shǎo', translation: 'at least' },
    { lesson: 8, word: '总是', wordPinyin: 'zǒng shì', translation: 'always' },
    { lesson: 8, word: '难道', wordPinyin: 'nán dão', translation: 'could it be that' },
    { lesson: 9, word: '对于', wordPinyin: 'duì yú', translation: 'regarding' },
    { lesson: 9, word: '哪怕', wordPinyin: 'nǎ pà', translation: 'even if' },
    { lesson: 10, word: '比如', wordPinyin: 'bǐ rú', translation: 'for example' },
    { lesson: 10, word: '重要', wordPinyin: 'zhòng yào', translation: 'important' },
    { lesson: 11, word: '坚持', wordPinyin: 'jiān chí', translation: 'persist' },
    { lesson: 11, word: '提醒', wordPinyin: 'tí xǐng', translation: 'remind' },
    { lesson: 12, word: '注意', wordPinyin: 'zhù yì', translation: 'pay attention' },
    { lesson: 12, word: '安全', wordPinyin: 'ān quán', translation: 'safety' },
    { lesson: 13, word: '无论', wordPinyin: 'wú lùn', translation: 'no matter' },
    { lesson: 13, word: '甚至', wordPinyin: 'shèn zhì', translation: 'even to the point of' },
    { lesson: 14, word: '显然', wordPinyin: 'xiǎn rán', translation: 'obviously' },
    { lesson: 14, word: '尤其', wordPinyin: 'yóu qí', translation: 'especially' },
];

function generate() {
    const entries: string[] = [];
    WORDS_YCT6.forEach(w => {
        const chars = w.word.split('');
        chars.forEach(c => {
            if (STROKES[c]) {
                entries.push(`  { level: 'yct6', lesson: 'Lesson${w.lesson}', char: '${c}', pinyin: '${PINYIN[c]}', strokeCount: ${STROKES[c]}, word: '${w.word}', wordPinyin: '${w.wordPinyin}', translation: '${w.translation}' }`);
            }
        });
    });
    console.log(entries.join(',\n') + ',');
}

generate();
