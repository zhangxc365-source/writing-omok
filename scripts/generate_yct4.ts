
import { WordEntry } from '../src/data/yct_data';

// Helper to calculate stroke count (simplified estimate or dummy for script, I will use real ones in final)
const STROKES: {[key: string]: number} = {
    '手': 4, '机': 6, '电': 5, '脑': 10, '游': 12, '戏': 6, '虽': 9, '然': 12, '但': 7, '是': 9, '便': 9, '宜': 8,
    '已': 3, '经': 8, '特': 10, '别': 7, '打': 5, '算': 14, '离': 10, '远': 7, '近': 7, '听': 7, '说': 9,
    '报': 7, '纸': 7, '介': 4, '绍': 8, '旅': 10, '游': 12, '比': 4, '较': 10, '方': 4, '便': 9, '公': 4, '共': 6, '汽': 7, '车': 4,
    '洗': 9, '澡': 16, '开': 4, '始': 8, '照': 13, '顾': 10, '正': 5, '在': 6, '一': 1, '边': 5,
    '礼': 5, '物': 8, '帮': 9, '助': 7, '懂': 15, '难': 10, '小': 3, '心': 4,
    '事': 8, '情': 11, '着': 11, '急': 9, '应': 7, '该': 8, '害': 10, '怕': 8, '敢': 11,
    '环': 8, '境': 14, '除': 9, '了': 2, '还': 7, '以': 4, '前': 9, '后': 6, '来': 7,
    '干': 3, '净': 8, '发': 5, '现': 8, '生': 5, '活': 9, '健': 10, '康': 11, '舒': 12, '服': 8,
    '如': 6, '果': 8, '那': 6, '么': 3, '决': 6, '定': 8, '注': 8, '意': 13, '极': 7,
    '接': 11, '坏': 7, '拿': 10, '换': 10, '骑': 11, '必': 5, '须': 9,
    '声': 7, '音': 9, '奇': 8, '怪': 8, '相': 9, '信': 9, '简': 13, '单': 9, '刚': 6, '才': 3
};

const PINYIN: {[key: string]: string} = {
    '手': 'shǒu', '机': 'jī', '电': 'diàn', '脑': 'nǎo', '游': 'yóu', '戏': 'xì', '虽': 'suī', '然': 'rán', '但': 'dàn', '是': 'shì', '便': 'pián', '宜': 'yi',
    '已': 'yǐ', '经': 'jīng', '特': 'tè', '别': 'bié', '打': 'dǎ', '算': 'suàn', '离': 'lí', '远': 'yuǎn', '近': 'jìn', '听': 'tīng', '说': 'shuō',
    '报': 'bào', '纸': 'zhǐ', '介': 'jiè', '绍': 'shào', '旅': 'lǚ', '游': 'yóu', '比': 'bǐ', '较': 'jiào', '方': 'fāng', '便': 'biàn', '公': 'gōng', '共': 'gòng', '汽': 'qì', '车': 'chē',
    '洗': 'xǐ', '澡': 'zǎo', '开': 'kāi', '始': 'shǐ', '照': 'zhào', '顾': 'gù', '正': 'zhèng', '在': 'zài', '一': 'yī', '边': 'biān',
    '礼': 'lǐ', '物': 'wù', '帮': 'bāng', '助': 'zhù', '懂': 'dǒng', '难': 'nán', '小': 'xiǎo', '心': 'xīn',
    '事': 'shì', '情': 'qíng', '着': 'zháo', '急': 'jí', '应': 'yīng', '该': 'gāi', '害': 'hài', '怕': 'pà', '敢': 'gǎn',
    '环': 'huán', '境': 'jìng', '除': 'chú', '了': 'le', '还': 'hái', '以': 'yǐ', '前': 'qián', '后': 'hòu', '来': 'lái',
    '干': 'gàn', '净': 'jìng', '发': 'fā', '现': 'xiàn', '生': 'shēng', '活': 'huó', '健': 'jiàn', '康': 'kāng', '舒': 'shū', '服': 'fu',
    '如': 'rú', '果': 'guǒ', '那': 'nà', '么': 'me', '决': 'jué', '定': 'dìng', '注': 'zhù', '意': 'yì', '极': 'jí',
    '接': 'jiē', '坏': 'huài', '拿': 'ná', '换': 'huàn', '骑': 'qí', '必': 'bì', '须': 'xū',
    '声': 'shēng', '音': 'yīn', '奇': 'qí', '怪': 'guài', '相': 'xiāng', '信': 'xìn', '简': 'jiǎn', '单': 'dān', '刚': 'gāng', '才': 'cái'
};

const WORDS: {lesson: number, word: string, wordPinyin: string, translation: string}[] = [
    { lesson: 1, word: '手机', wordPinyin: 'shǒu jī', translation: 'mobile phone' },
    { lesson: 1, word: '电脑', wordPinyin: 'diàn nǎo', translation: 'computer' },
    { lesson: 1, word: '电脑游戏', wordPinyin: 'diàn nǎo yóu xì', translation: 'computer game' },
    { lesson: 1, word: '虽然', wordPinyin: 'suī rán', translation: 'although' },
    { lesson: 1, word: '但是', wordPinyin: 'dàn shì', translation: 'but' },
    { lesson: 1, word: '便宜', wordPinyin: 'pián yi', translation: 'cheap' },
    
    { lesson: 2, word: '已经', wordPinyin: 'yǐ jīng', translation: 'already' },
    { lesson: 2, word: '特别', wordPinyin: 'tè bié', translation: 'especially' },
    { lesson: 2, word: '打算', wordPinyin: 'dǎ suàn', translation: 'plan' },
    { lesson: 2, word: '离', wordPinyin: 'lí', translation: 'away from' },
    { lesson: 2, word: '远', wordPinyin: 'yuǎn', translation: 'far' },
    { lesson: 2, word: '近', wordPinyin: 'jìn', translation: 'near' },
    { lesson: 2, word: '听说', wordPinyin: 'tīng shuō', translation: 'hear of' },

    { lesson: 3, word: '报纸', wordPinyin: 'bào zhǐ', translation: 'newspaper' },
    { lesson: 3, word: '介绍', wordPinyin: 'jiè shào', translation: 'introduce' },
    { lesson: 3, word: '旅游', wordPinyin: 'lǚ yóu', translation: 'travel' },
    { lesson: 3, word: '比较', wordPinyin: 'bǐ jiào', translation: 'relatively' },
    { lesson: 3, word: '方便', wordPinyin: 'fāng biàn', translation: 'convenient' },
    { lesson: 3, word: '公共汽车', wordPinyin: 'gōng gòng qì chē', translation: 'bus' },

    { lesson: 4, word: '洗澡', wordPinyin: 'xǐ zǎo', translation: 'take a bath' },
    { lesson: 4, word: '开始', wordPinyin: 'kāi shǐ', translation: 'start' },
    { lesson: 4, word: '照顾', wordPinyin: 'zhào gù', translation: 'take care of' },
    { lesson: 4, word: '正在', wordPinyin: 'zhèng zài', translation: 'in the process of' },
    { lesson: 4, word: '一边', wordPinyin: 'yì biān', translation: 'while' },

    { lesson: 5, word: '礼物', wordPinyin: 'lǐ wù', translation: 'gift' },
    { lesson: 5, word: '帮助', wordPinyin: 'bāng zhù', translation: 'help' },
    { lesson: 5, word: '懂', wordPinyin: 'dǒng', translation: 'understand' },
    { lesson: 5, word: '难', wordPinyin: 'nán', translation: 'difficult' },
    { lesson: 5, word: '小心', wordPinyin: 'xiǎo xīn', translation: 'careful' },

    { lesson: 6, word: '事情', wordPinyin: 'shì qing', translation: 'thing' },
    { lesson: 6, word: '着急', wordPinyin: 'zháo jí', translation: 'worried' },
    { lesson: 6, word: '应该', wordPinyin: 'yīng gāi', translation: 'should' },
    { lesson: 6, word: '害怕', wordPinyin: 'hài pà', translation: 'fear' },
    { lesson: 6, word: '敢', wordPinyin: 'gǎn', translation: 'dare' },

    { lesson: 7, word: '环境', wordPinyin: 'huán jìng', translation: 'environment' },
    { lesson: 7, word: '除了', wordPinyin: 'chú le', translation: 'except' },
    { lesson: 7, word: '还是', wordPinyin: 'hái shì', translation: 'or' },
    { lesson: 7, word: '以前', wordPinyin: 'yǐ qián', translation: 'before' },
    { lesson: 7, word: '后来', wordPinyin: 'hòu lái', translation: 'later' },

    { lesson: 8, word: '干净', wordPinyin: 'gān jìng', translation: 'clean' },
    { lesson: 8, word: '发现', wordPinyin: 'fā xiàn', translation: 'find' },
    { lesson: 8, word: '生活', wordPinyin: 'shēng huó', translation: 'life' },
    { lesson: 8, word: '健康', wordPinyin: 'jiàn kāng', translation: 'health' },
    { lesson: 8, word: '舒服', wordPinyin: 'shū fu', translation: 'comfortable' },

    { lesson: 9, word: '如果', wordPinyin: 'rú guǒ', translation: 'if' },
    { lesson: 9, word: '那么', wordPinyin: 'nà me', translation: 'then' },
    { lesson: 9, word: '决定', wordPinyin: 'jué dìng', translation: 'decide' },
    { lesson: 9, word: '注意', wordPinyin: 'zhù yì', translation: 'notice' },
    { lesson: 9, word: '极了', wordPinyin: 'jí le', translation: 'extremely' },

    { lesson: 10, word: '接', wordPinyin: 'jiē', translation: 'pick up' },
    { lesson: 10, word: '坏', wordPinyin: 'huài', translation: 'bad' },
    { lesson: 10, word: '拿', wordPinyin: 'ná', translation: 'take' },
    { lesson: 10, word: '换', wordPinyin: 'huàn', translation: 'change' },
    { lesson: 10, word: '骑', wordPinyin: 'qí', translation: 'ride' },
    { lesson: 10, word: '必须', wordPinyin: 'bì xū', translation: 'must' },

    { lesson: 11, word: '声音', wordPinyin: 'shēng yīn', translation: 'sound' },
    { lesson: 11, word: '奇怪', wordPinyin: 'qí guài', translation: 'strange' },
    { lesson: 11, word: '相信', wordPinyin: 'xiāng xìn', translation: 'believe' },
    { lesson: 11, word: '简单', wordPinyin: 'jiǎn dān', translation: 'simple' },
    { lesson: 11, word: '刚才', wordPinyin: 'gāng cái', translation: 'just now' },
];

function generate() {
    const entries: string[] = [];
    WORDS.forEach(w => {
        const chars = w.word.split('');
        chars.forEach(c => {
            if (STROKES[c]) {
                entries.push(`  { level: 'yct4', lesson: 'Lesson${w.lesson}', char: '${c}', pinyin: '${PINYIN[c]}', strokeCount: ${STROKES[c]}, word: '${w.word}', wordPinyin: '${w.wordPinyin}', translation: '${w.translation}' }`);
            }
        });
    });
    console.log(entries.join(',\n') + ',');
}

generate();
