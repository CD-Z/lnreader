import {
  Plugin,
  NovelItem,
  SourceNovel,
  ChapterItem,
  NovelStatus,
} from '../types';
import { dbManager } from '@database/db';
import { novelSchema } from '@database/schema';
import { and, eq } from 'drizzle-orm';
import { Storage } from '@plugins/helpers/storage';

const generateChapterContent = (chapterNumber: number): string => {
  const patterns = [
    `<p>Chapter ${chapterNumber}</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p><p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p><p>Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?</p><p>Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?</p><p>At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus.</p>`,
    `<p>Chapter ${chapterNumber}</p><p>On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue; and equal blame belongs to those who fail in their duty through weakness of will, which is the same as saying through shrinking from toil and pain.</p><p>These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammeled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted.</p><p>The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains. But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness.</p><p>No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but occasionally circumstances occur in which toil and pain can procure him some great pleasure.</p><p>To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?</p>`,
    `<p>Chapter ${chapterNumber}</p><p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p><p>Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.</p><p>Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur? Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus.</p><p>Omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>`,
    `<p>Chapter ${chapterNumber}</p><p>At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.</p><p>Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.</p><p>Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p><p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.</p><p>Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?</p>`,
    `<p>Chapter ${chapterNumber}</p><p>In a free hour, when our power of choice is untrammeled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted.</p><p>The wise man therefore always holds in these matters to this principle of selection: he rejects pleasures to secure other greater pleasures, or else he endures pains to avoid worse pains. But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness.</p><p>Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it?</p><p>But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure? On the other hand, we denounce with righteous indignation and dislike men who are so beguiled and demoralized by the charms of pleasure of the moment, so blinded by desire, that they cannot foresee the pain and trouble that are bound to ensue.</p><p>These cases are perfectly simple and easy to distinguish. In a free hour, when our power of choice is untrammeled and when nothing prevents our being able to do what we like best, every pleasure is to be welcomed and every pain avoided. But in certain circumstances and owing to the claims of duty or the obligations of business it will frequently occur that pleasures have to be repudiated and annoyances accepted.</p>`,
  ];

  return patterns[chapterNumber % 5];
};

const mockNovels: NovelItem[] = [
  {
    id: undefined,
    name: 'The Great Adventure',
    path: 'the-great-adventure',
    cover: 'https://picsum.photos/seed/novel1/300/450',
  },
  {
    id: undefined,
    name: 'Mystery of the Old Manor',
    path: 'mystery-of-the-old-manor',
    cover: 'https://picsum.photos/seed/novel2/300/450',
  },
  {
    id: undefined,
    name: "Dragon's Quest",
    path: 'dragons-quest',
    cover: 'https://picsum.photos/seed/novel3/300/450',
  },
  {
    id: undefined,
    name: 'Love in the City',
    path: 'love-in-the-city',
    cover: 'https://picsum.photos/seed/novel4/300/450',
  },
  {
    id: undefined,
    name: "The Warrior's Path",
    path: 'the-warriors-path',
    cover: 'https://picsum.photos/seed/novel5/300/450',
  },
  {
    id: undefined,
    name: 'Science Fiction Tales',
    path: 'science-fiction-tales',
    cover: 'https://picsum.photos/seed/novel6/300/450',
  },
  {
    id: undefined,
    name: 'Fantasy World',
    path: 'fantasy-world',
    cover: 'https://picsum.photos/seed/novel7/300/450',
  },
  {
    id: undefined,
    name: 'The Lost Kingdom',
    path: 'the-lost-kingdom',
    cover: 'https://picsum.photos/seed/novel8/300/450',
  },
  {
    id: undefined,
    name: 'Modern Life',
    path: 'modern-life',
    cover: 'https://picsum.photos/seed/novel9/300/450',
  },
  {
    id: undefined,
    name: 'Historical Drama',
    path: 'historical-drama',
    cover: 'https://picsum.photos/seed/novel10/300/450',
  },
];

const getNovelByPath = (
  path: string,
):
  | {
      name: string;
      author: string;
      summary: string;
      status: NovelStatus;
      cover: string;
    }
  | undefined => {
  const novels: Record<
    string,
    {
      name: string;
      author: string;
      summary: string;
      status: NovelStatus;
      cover: string;
    }
  > = {
    'the-great-adventure': {
      name: 'The Great Adventure',
      author: 'Dev Author',
      summary:
        'An epic tale of adventure across mysterious lands. Join our hero as they traverse mountains, forests, and deserts in search of the legendary treasure. Along the way, they will face dangerous enemies, make unlikely friends, and discover secrets that will change the world.',
      status: NovelStatus.Ongoing,
      cover: 'https://picsum.photos/seed/novel1/300/450',
    },
    'mystery-of-the-old-manor': {
      name: 'Mystery of the Old Manor',
      author: 'Dev Author',
      summary:
        'A gripping mystery set in an old Victorian manor. When the wealthy owner dies under suspicious circumstances, it falls to the young detective to unravel the truth behind the locked rooms and family secrets.',
      status: NovelStatus.Completed,
      cover: 'https://picsum.photos/seed/novel2/300/450',
    },
    'dragons-quest': {
      name: "Dragon's Quest",
      author: 'Dev Author',
      summary:
        'A young dragon rider must bond with her dragon and save the kingdom from an ancient evil. Follow her journey as she trains, fights, and grows stronger alongside her scaled companion.',
      status: NovelStatus.Ongoing,
      cover: 'https://picsum.photos/seed/novel3/300/450',
    },
    'love-in-the-city': {
      name: 'Love in the City',
      author: 'Dev Author',
      summary:
        "Modern romance in a bustling city. Three friends navigate love, career, and friendship in this heartwarming tale of finding one's place in the world.",
      status: NovelStatus.OnHiatus,
      cover: 'https://picsum.photos/seed/novel4/300/450',
    },
    'the-warriors-path': {
      name: "The Warrior's Path",
      author: 'Dev Author',
      summary:
        'A martial arts epic following a young disciple as he trains under legendary masters and competes in tournaments across ancient China. Strength, honor, and perseverance define his journey.',
      status: NovelStatus.Completed,
      cover: 'https://picsum.photos/seed/novel5/300/450',
    },
    'science-fiction-tales': {
      name: 'Science Fiction Tales',
      author: 'Dev Author',
      summary:
        'A collection of interconnected stories set in a future where humanity has colonized the stars. Explore alien worlds, advanced technology, and the human condition in this visionary work.',
      status: NovelStatus.Ongoing,
      cover: 'https://picsum.photos/seed/novel6/300/450',
    },
    'fantasy-world': {
      name: 'Fantasy World',
      author: 'Dev Author',
      summary:
        'Magic, wizards, and epic battles await in this high fantasy adventure. When dark forces threaten the realm, a group of unlikely heroes must band together to save everything they love.',
      status: NovelStatus.Ongoing,
      cover: 'https://picsum.photos/seed/novel7/300/450',
    },
    'the-lost-kingdom': {
      name: 'The Lost Kingdom',
      author: 'Dev Author',
      summary:
        'Centuries ago, a mighty kingdom vanished without a trace. Now, an explorer has discovered its ruins. What secrets await in the lost kingdom?',
      status: NovelStatus.PublishingFinished,
      cover: 'https://picsum.photos/seed/novel8/300/450',
    },
    'modern-life': {
      name: 'Modern Life',
      author: 'Dev Author',
      summary:
        'A slice-of-life comedy following the daily adventures of office workers in a tech startup. Hilarity ensues as they deal with bosses, deadlines, and each other.',
      status: NovelStatus.Ongoing,
      cover: 'https://picsum.photos/seed/novel9/300/450',
    },
    'historical-drama': {
      name: 'Historical Drama',
      author: 'Dev Author',
      summary:
        'Set in ancient times, this drama follows the political intrigue and personal struggles of nobles in a powerful dynasty. Betrayal, loyalty, and ambition clash in this epic tale.',
      status: NovelStatus.Completed,
      cover: 'https://picsum.photos/seed/novel10/300/450',
    },
  };
  return novels[path];
};

const generateChapters = (
  novelPath: string,
  chapterCount: number,
): ChapterItem[] => {
  const chapters: ChapterItem[] = [];
  for (let i = 1; i <= chapterCount; i++) {
    chapters.push({
      name: `Chapter ${i}`,
      path: `${novelPath}/chapter-${i}`,
      chapterNumber: i,
    });
  }
  return chapters;
};

const devNovelPlugin: Plugin = {
  id: 'dev-novel',
  name: 'Dev Novel',
  site: 'Dev',
  lang: 'English',
  version: '1.0.0',
  url: '',
  iconUrl: 'https://picsum.photos/seed/devnovel/300/450',
  imageRequestInit: {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  },
  pluginSettings: {
    provideNewContent: {
      label: 'Provide new chapters on update',
      value: true,
      type: 'Switch',
    },
  },
  popularNovels: async (_page: number): Promise<NovelItem[]> => {
    return mockNovels;
  },
  parseNovel: async (novelPath: string): Promise<SourceNovel> => {
    const novel = getNovelByPath(novelPath);
    if (!novel) {
      throw new Error(`Dev Novel: Novel not found: ${novelPath}`);
    }
    const s = new Storage('dev-novel');
    const newChapters = s.get('provideNewContent');

    const res = await dbManager
      .select({
        count: novelSchema.totalChapters,
      })
      .from(novelSchema)
      .where(
        and(
          eq(novelSchema.pluginId, 'dev-novel'),
          eq(novelSchema.path, novelPath),
        ),
      )
      .get();
    const chapterCount = !res?.count || res.count < 20 ? 20 : res?.count;
    const nextChapterCount = newChapters ? chapterCount + 5 : chapterCount;

    const chapters = generateChapters(novelPath, nextChapterCount);

    return {
      id: undefined,
      name: novel.name,
      path: novelPath,
      cover: novel.cover,
      author: novel.author,
      summary: novel.summary,
      status: novel.status,
      genres: 'Fiction',
      chapters: chapters,
      totalPages: 0,
    };
  },

  parseChapter: async (chapterPath: string): Promise<string> => {
    const match = chapterPath.match(/chapter-(\d+)$/);
    const chapterNumber = match ? parseInt(match[1], 10) : 1;
    return generateChapterContent(chapterNumber);
  },
  searchNovels: async (searchTerm: string): Promise<NovelItem[]> => {
    const term = searchTerm.toLowerCase();
    return mockNovels.filter(novel => novel.name.toLowerCase().includes(term));
  },
  resolveUrl: (path: string): string => {
    return path;
  },
  webStorageUtilized: false,
};

export default devNovelPlugin;
export { devNovelPlugin };
