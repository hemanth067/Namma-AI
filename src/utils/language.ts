import { LanguageType, PromptStarter } from '../types';

export function detectLanguageClient(text: string): LanguageType {
  if (!text || !text.trim()) return 'english';

  const trimmed = text.trim();
  const tamilRegex = /[\u0B80-\u0BFF]/g;
  const tamilMatches = trimmed.match(tamilRegex);
  const tamilCount = tamilMatches ? tamilMatches.length : 0;
  const totalLetters = (trimmed.match(/[\p{L}]/gu) || []).length;

  if (totalLetters > 0 && tamilCount / totalLetters > 0.35) {
    if (tamilCount / totalLetters > 0.8) {
      return 'tamil';
    }
    return 'mixed';
  }

  // Tanglish word patterns in Latin alphabet
  const tanglishWords = [
    /\b(enna|enna-pa|epdi|eppadi|irukku|irukken|irukkinga|panra|panreenga|romba|nandri|vanakkam|inga|anga|enga|eppo|yaar|yaaru)\b/i,
    /\b(solla|sollu|solreenga|puriyala|puriyuthu|theriyum|theriyala|illa|illai|ama|aama|kooda|muttum|mattum|seri|podhum)\b/i,
    /\b(mudiyum|mudiyala|mudiyuma|vaanga|ponga|paaru|paarkalam|nalla|nallaa|super-ah|semma|kudunga|thanga|edunga)\b/i,
    /\b(chennai|tamilnadu|thambi|thalaiva|anna|akka|machan|nanba|nanbare|makkale|valga|vaazhga)\b/i,
    /\b(apdiya|ipdiya|adhula|idhula|epovum|ippo|appo|konjam|romba-ve)\b/i,
    /\b[a-z]+(-la|-ku|-oda|-um|-kitta|-a|-ah)\b/i
  ];

  let matches = 0;
  for (const regex of tanglishWords) {
    if (regex.test(trimmed)) {
      matches++;
    }
  }

  if (matches >= 1) {
    return 'tanglish';
  }

  if (tamilCount > 0) {
    return 'mixed';
  }

  return 'english';
}

export function getLanguageMeta(lang: LanguageType): { label: string; subLabel: string; color: string } {
  switch (lang) {
    case 'tamil':
      return {
        label: 'தமிழ்',
        subLabel: 'Pure Tamil',
        color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
      };
    case 'tanglish':
      return {
        label: 'Tanglish',
        subLabel: 'Tamil in Latin Script',
        color: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50'
      };
    case 'mixed':
      return {
        label: 'கலவை / Mixed',
        subLabel: 'Tamil + English',
        color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
      };
    case 'english':
    default:
      return {
        label: 'English',
        subLabel: 'English',
        color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/50'
      };
  }
}

export const SAMPLE_PROMPTS: PromptStarter[] = [
  {
    id: '1',
    category: 'tamil',
    categoryLabel: 'தமிழ் (Tamil)',
    title: 'திருக்குறள் விளக்கம்',
    prompt: 'திருக்குறளின் முதல் அதிகாரமான "கடவுள் வாழ்த்து" பற்றி எளிய தமிழில் விளக்குங்கள்.',
    description: 'Explain the first chapter of Thirukkural in simple Tamil'
  },
  {
    id: '2',
    category: 'tanglish',
    categoryLabel: 'Tanglish',
    title: 'Chennai Weekend Itinerary',
    prompt: 'Chennai-la 2 days spend panna best itinerary sollu nanba, food spots kooda mention pannu.',
    description: 'Ask for a 2-day Chennai food & travel plan in Tanglish'
  },
  {
    id: '3',
    category: 'english',
    categoryLabel: 'English',
    title: 'Explain Quantum Computing',
    prompt: 'Explain how quantum computing works using an everyday analogy suitable for a high school student.',
    description: 'Clear, engaging scientific explanation in English'
  },
  {
    id: '4',
    category: 'mixed',
    categoryLabel: 'Mixed / கலவை',
    title: 'Professional Email Draft',
    prompt: 'Manager ku casual leave request panna oru polite formal email draft panni thanga.',
    description: 'Generate a polite leave email draft from Tanglish prompt'
  },
  {
    id: '5',
    category: 'tamil',
    categoryLabel: 'தமிழ் (Tamil)',
    title: 'ஆரோக்கியமான உணவு முறை',
    prompt: 'பாரம்பரிய தமிழ்நாட்டு சிறுதானிய உணவுகள் மற்றும் அவற்றின் ஆரோக்கிய நன்மைகள் என்னென்ன?',
    description: 'Traditional Tamil millets and health benefits'
  },
  {
    id: '6',
    category: 'tanglish',
    categoryLabel: 'Tanglish',
    title: 'Code Bug Debugging Help',
    prompt: 'React-la useEffect infinite loop aaguthu, idha epdi fix panradhu nu simple steps-la sollu.',
    description: 'Get coding debugging steps explained in conversational Tanglish'
  }
];
