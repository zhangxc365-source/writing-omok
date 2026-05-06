
import { WordEntry } from '../src/data/yct_data';

const STROKES: {[key: string]: number} = {
    '功': 5, '夫': 4, '非': 8, '常': 11, '感': 13, '兴': 6, '趣': 15, '挺': 9, '告': 7, '诉': 7, '将': 9, '来': 7, '兔': 8, '子': 3, '尾': 7, '巴': 4, '害': 10, '怕': 8,
    '空': 8, '调': 10, '窗': 12, '户': 4, '还': 7, '是': 9, '冰': 6, '箱': 15, '干': 3, '净': 8, '邻': 7, '居': 8, '习': 3, '惯': 11, '周': 8, '末': 5, '奇': 8, '怪': 8, '咖': 8, '啡': 8, '弹': 12, '钢': 9, '琴': 12,
    '阿': 7, '姨': 9, '年': 6, '轻': 9, '孙': 6, '子': 3, '变': 8, '化': 4, '公': 4, '园': 7, '散': 12, '步': 7, '爬': 8, '山': 3, '照': 13, '相': 9, '选': 9, '择': 11, '虽': 9, '然': 12, '但': 7, '经': 8, '常': 11, '号': 5, '码': 8, '联': 12, '系': 7, '情': 11, '况': 7,
    '认': 4, '真': 10, '复': 9, '相': 9, '信': 9, '努': 7, '力': 2, '成': 6, '功': 5, '锻': 17, '炼': 12, '已': 3, '越': 12, '方': 4, '便': 9, '刚': 6, '才': 3, '办': 4, '法': 8, '只': 3, '要': 9, '就': 12, '解': 13, '决': 6, '困': 7, '难': 10, '愉': 12, '快': 7, '记': 5, '得': 11, '暑': 12, '假': 11, '打': 5, '算': 14, '礼': 5, '物': 8,
    '关': 6, '于': 3, '了': 2, '解': 13, '认': 4, '为': 4, '同': 6, '意': 13, '讨': 5, '论': 6, '注': 8, '安': 6, '全': 6, '准': 10, '时': 7, '保': 9, '证': 9, '请': 10, '假': 11, '咳': 9, '嗽': 14, '发': 5, '烧': 10, '准': 10, '备': 8, '特': 10, '别': 7, '简': 13, '单': 9, '必': 5, '须': 9
};

const PINYIN: {[key: string]: string} = {
    '功': 'gōng', '夫': 'fu', '非': 'fēi', '常': 'cháng', '感': 'gǎn', '兴': 'xìng', '趣': 'qù', '挺': 'tǐng', '告': 'gào', '诉': 'sù', '将': 'jiāng', '来': 'lái', '兔': 'tù', '子': 'zi', '尾': 'wěi', '巴': 'ba', '害': 'hài', '怕': 'pà',
    '空': 'kōng', '调': 'tiáo', '窗': 'chuāng', '户': 'hù', '还': 'hái', '是': 'shì', '冰': 'bīng', '箱': 'xiāng', '干': 'gàn', '净': 'jìng', '邻': 'lín', '居': 'jū', '习': 'xí', '惯': 'guàn', '周': 'zhōu', '末': 'mò', '奇': 'qí', '怪': 'guài', '咖': 'kā', '啡': 'fēi', '弹': 'tán', '钢': 'gāng', '琴': 'qín',
    '阿': 'ā', '姨': 'yí', '年': 'nián', '轻': 'qīng', '孙': 'sūn', '子': 'zi', '变': 'biàn', '化': 'huà', '公': 'gōng', '园': 'yuán', '散': 'sàn', '步': 'bù', '爬': 'pá', '山': 'shān', '照': 'zhào', '相': 'xiàng', '选': 'xuǎn', '择': 'zé', '虽': 'suī', '然': 'rán', '但': 'dàn', '经': 'jīng', '常': 'cháng', '号': 'hào', '码': 'mǎ', '联': 'lián', '系': 'xì', '情': 'qíng', '况': 'kuàng',
    '认': 'rèn', '真': 'zhēn', '复': 'fù', '相': 'xiāng', '信': 'xìn', '努': 'nǔ', '力': 'lì', '成': 'chéng', '功': 'gōng', '锻': 'duàn', '炼': 'liàn', '已': 'yǐ', '越': 'yuè', '方': 'fāng', '便': 'biàn', '刚': 'gāng', '才': 'cái', '办': 'bàn', '法': 'fǎ', '只': 'zhǐ', '要': 'yào', '就': 'jiù', '解': 'jiě', '决': 'jué', '困': 'kùn', '难': 'nán', '愉': 'yú', '快': 'kuài', '记': 'jì', '得': 'de', '暑': 'shǔ', '假': 'jià', '打': 'dǎ', '算': 'suàn', '礼': 'lǐ', '物': 'wù',
    '关': 'guān', '于': 'yú', '了': 'le', '解': 'jiě', '认': 'rèn', '为': 'wéi', '同': 'tóng', '意': 'yì', '讨': 'tǎo', '论': 'lùn', '注': 'zhù', '安': 'ān', '全': 'quán', '准': 'zhǔn', '时': 'shí', '保': 'bǎo', '证': 'zhèng', '请': 'qǐng', '假': 'jià', '咳': 'ké', '嗽': 'sou', '发': 'fā', '烧': 'shāo', '准': 'zhǔn', '备': 'bèi', '特': 'tè', '别': 'bié', '简': 'jiǎn', '单': 'dān', '必': 'bì', '须': 'xū'
};

const WORDS_YCT5: {lesson: number, word: string, wordPinyin: string, translation: string}[] = [
    { lesson: 1, word: '功夫', wordPinyin: 'gōng fu', translation: 'kung fu' },
    { lesson: 1, word: '非常', wordPinyin: 'fēi cháng', translation: 'very' },
    { lesson: 1, word: '感兴趣', wordPinyin: 'gǎn xìng qù', translation: 'interested in' },
    { lesson: 2, word: '将来', wordPinyin: 'jiāng lái', translation: 'future' },
    { lesson: 2, word: '告诉', wordPinyin: 'gào su', translation: 'tell' },
    { lesson: 2, word: '尾巴', wordPinyin: 'wěi ba', translation: 'tail' },
    { lesson: 3, word: '空调', wordPinyin: 'kōng tiáo', translation: 'air conditioner' },
    { lesson: 3, word: '窗户', wordPinyin: 'chuāng hu', translation: 'window' },
    { lesson: 3, word: '沙发', wordPinyin: 'shā fā', translation: 'sofa' },
    { lesson: 4, word: '邻居', wordPinyin: 'lín jū', translation: 'neighbor' },
    { lesson: 4, word: '习惯', wordPinyin: 'xí guàn', translation: 'habit' },
    { lesson: 4, word: '奇怪', wordPinyin: 'qí guài', translation: 'strange' },
    { lesson: 5, word: '阿姨', wordPinyin: 'ā yí', translation: 'aunt' },
    { lesson: 5, word: '年轻', wordPinyin: 'nián qīng', translation: 'young' },
    { lesson: 5, word: '变化', wordPinyin: 'biàn huà', translation: 'change' },
    { lesson: 6, word: '照相', wordPinyin: 'zhào xiàng', translation: 'take photo' },
    { lesson: 6, word: '联系', wordPinyin: 'lián xì', translation: 'contact' },
    { lesson: 6, word: '情况', wordPinyin: 'qíng kuàng', translation: 'situation' },
    { lesson: 7, word: '复习', wordPinyin: 'fù xí', translation: 'review' },
    { lesson: 7, word: '锻炼', wordPinyin: 'duàn liàn', translation: 'exercise' },
    { lesson: 7, word: '努力', wordPinyin: 'nǔ lì', translation: 'hardworking' },
    { lesson: 8, word: '经常', wordPinyin: 'jīng cháng', translation: 'often' },
    { lesson: 8, word: '方便', wordPinyin: 'fāng biàn', translation: 'convenient' },
    { lesson: 9, word: '解决', wordPinyin: 'jiě jué', translation: 'solve' },
    { lesson: 9, word: '注意', wordPinyin: 'zhù yì', translation: 'pay attention' },
    { lesson: 10, word: '愉快', wordPinyin: 'yú kuài', translation: 'pleasant' },
    { lesson: 10, word: '记得', wordPinyin: 'jì de', translation: 'remember' },
    { lesson: 11, word: '同意', wordPinyin: 'tóng yì', translation: 'agree' },
    { lesson: 11, word: '讨论', wordPinyin: 'tǎo lùn', translation: 'discuss' },
    { lesson: 12, word: '安全', wordPinyin: 'ān quán', translation: 'safety' },
    { lesson: 12, word: '准时', wordPinyin: 'zhǔn shí', translation: 'punctual' },
    { lesson: 13, word: '咳嗽', wordPinyin: 'ké sou', translation: 'cough' },
    { lesson: 13, word: '发烧', wordPinyin: 'fā shāo', translation: 'fever' },
    { lesson: 14, word: '准备', wordPinyin: 'zhǔn bèi', translation: 'prepare' },
    { lesson: 14, word: '简单', wordPinyin: 'jiǎn dān', translation: 'simple' },
];

function generate() {
    const entries: string[] = [];
    WORDS_YCT5.forEach(w => {
        const chars = w.word.split('');
        chars.forEach(c => {
            if (STROKES[c]) {
                entries.push(`  { level: 'yct5', lesson: 'Lesson${w.lesson}', char: '${c}', pinyin: '${PINYIN[c]}', strokeCount: ${STROKES[c]}, word: '${w.word}', wordPinyin: '${w.wordPinyin}', translation: '${w.translation}' }`);
            }
        });
    });
    console.log(entries.join(',\n') + ',');
}

generate();
