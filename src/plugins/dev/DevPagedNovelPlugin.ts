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

const mockPagedNovels: NovelItem[] = [
  {
    id: undefined,
    name: 'The Epic Saga',
    path: 'the-epic-saga',
    cover: 'https://picsum.photos/seed/paged1/300/450',
  },
  {
    id: undefined,
    name: 'Tales of Tomorrow',
    path: 'tales-of-tomorrow',
    cover: 'https://picsum.photos/seed/paged2/300/450',
  },
  {
    id: undefined,
    name: 'The Infinite Story',
    path: 'the-infinite-story',
    cover: 'https://picsum.photos/seed/paged3/300/450',
  },
  {
    id: undefined,
    name: 'Chronicles of the Realm',
    path: 'chronicles-of-the-realm',
    cover: 'https://picsum.photos/seed/paged4/300/450',
  },
  {
    id: undefined,
    name: 'Beyond the Stars',
    path: 'beyond-the-stars',
    cover: 'https://picsum.photos/seed/paged5/300/450',
  },
  {
    id: undefined,
    name: 'The Forgotten Path',
    path: 'the-forgotten-path',
    cover: 'https://picsum.photos/seed/paged6/300/450',
  },
  {
    id: undefined,
    name: 'Legends Rise',
    path: 'legends-rise',
    cover: 'https://picsum.photos/seed/paged7/300/450',
  },
  {
    id: undefined,
    name: 'Shadows of Tomorrow',
    path: 'shadows-of-tomorrow',
    cover: 'https://picsum.photos/seed/paged8/300/450',
  },
  {
    id: undefined,
    name: 'The Endless Journey',
    path: 'the-endless-journey',
    cover: 'https://picsum.photos/seed/paged9/300/450',
  },
  {
    id: undefined,
    name: 'Realms of Magic',
    path: 'realms-of-magic',
    cover: 'https://picsum.photos/seed/paged10/300/450',
  },
];

const getPagedNovelByPath = (
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
    'the-epic-saga': {
      name: 'The Epic Saga',
      author: 'Dev Author',
      summary:
        'An epic multi-volume saga spanning generations. This paged novel demonstrates how chapters are organized across multiple pages. Each page contains several chapters, allowing for organized content delivery.',
      status: NovelStatus.Ongoing,
      cover: 'https://picsum.photos/seed/paged1/300/450',
    },
    'tales-of-tomorrow': {
      name: 'Tales of Tomorrow',
      author: 'Dev Author',
      summary:
        'A collection of futuristic stories. With three pages of content, this novel showcases the paged novel format, perfect for long-running series with many chapters.',
      status: NovelStatus.Completed,
      cover: 'https://picsum.photos/seed/paged2/300/450',
    },
    'the-infinite-story': {
      name: 'The Infinite Story',
      author: 'Dev Author',
      summary:
        'A never-ending tale that continues forever. This paged novel is perfect for testing chapter pagination and page-based loading functionality.',
      status: NovelStatus.Ongoing,
      cover: 'https://picsum.photos/seed/paged3/300/450',
    },
    'chronicles-of-the-realm': {
      name: 'Chronicles of the Realm',
      author: 'Dev Author',
      summary:
        'An epic fantasy saga with multiple volumes. Each page contains several chapters, demonstrating how large series can be organized efficiently.',
      status: NovelStatus.Ongoing,
      cover: 'https://picsum.photos/seed/paged4/300/450',
    },
    'beyond-the-stars': {
      name: 'Beyond the Stars',
      author: 'Dev Author',
      summary:
        'A science fiction epic exploring the cosmos. With new pages added on update, this novel demonstrates dynamic pagination for growing series.',
      status: NovelStatus.Ongoing,
      cover: 'https://picsum.photos/seed/paged5/300/450',
    },
    'the-forgotten-path': {
      name: 'The Forgotten Path',
      author: 'Dev Author',
      summary:
        'A mystery adventure through forgotten lands. This novel showcases the paged format with chapters organized across multiple pages.',
      status: NovelStatus.OnHiatus,
      cover: 'https://picsum.photos/seed/paged6/300/450',
    },
    'legends-rise': {
      name: 'Legends Rise',
      author: 'Dev Author',
      summary:
        'Heroes emerge from humble beginnings to change the world. A long-running series perfect for testing pagination and updates.',
      status: NovelStatus.Ongoing,
      cover: 'https://picsum.photos/seed/paged7/300/450',
    },
    'shadows-of-tomorrow': {
      name: 'Shadows of Tomorrow',
      author: 'Dev Author',
      summary:
        'A dystopian tale of a world on the brink. Multiple pages of content demonstrate how chapter pagination handles larger novels.',
      status: NovelStatus.Completed,
      cover: 'https://picsum.photos/seed/paged8/300/450',
    },
    'the-endless-journey': {
      name: 'The Endless Journey',
      author: 'Dev Author',
      summary:
        'A traveler explores countless worlds in an endless adventure. This paged novel is excellent for testing dynamic page generation.',
      status: NovelStatus.Ongoing,
      cover: 'https://picsum.photos/seed/paged9/300/450',
    },
    'realms-of-magic': {
      name: 'Realms of Magic',
      author: 'Dev Author',
      summary:
        'Magic users battle for control of magical realms. A long series with pages that grow on update to test pagination fully.',
      status: NovelStatus.Ongoing,
      cover: 'https://picsum.photos/seed/paged10/300/450',
    },
  };
  return novels[path];
};

const DEFAULT_PAGES = 3;
const CHAPTERS_PER_PAGE = 7;

const generateChaptersForPage = (
  novelPath: string,
  page: number,
): ChapterItem[] => {
  const chapters: ChapterItem[] = [];
  const startChapter = (page - 1) * CHAPTERS_PER_PAGE + 1;
  const endChapter = page * CHAPTERS_PER_PAGE;

  for (let i = startChapter; i <= endChapter; i++) {
    chapters.push({
      name: `Chapter ${i}`,
      path: `${novelPath}/chapter-${i}`,
      chapterNumber: i,
      page: String(page),
    });
  }
  return chapters;
};

const generateAllChapters = (
  novelPath: string,
  totalPages: number,
): ChapterItem[] => {
  const chapters: ChapterItem[] = [];
  for (let page = 1; page <= totalPages; page++) {
    chapters.push(...generateChaptersForPage(novelPath, page));
  }
  return chapters;
};

const devPagedNovelPlugin: Plugin = {
  id: 'dev-paged-novel',
  name: 'Dev Paged Novel',
  site: 'Dev',
  lang: 'English',
  version: '1.0.0',
  url: '',
  iconUrl: 'https://picsum.photos/seed/devpaged/300/450',
  imageRequestInit: {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  },
  pluginSettings: {
    provideNewContent: {
      label: 'Provide new chapters on update',
      value: true,
      type: 'Switch',
    },
    provideNewPages: {
      label: 'Provide new pages on update',
      value: false,
      type: 'Switch',
    },
  },
  popularNovels: async (_page: number): Promise<NovelItem[]> => {
    return mockPagedNovels;
  },
  parseNovel: async (novelPath: string): Promise<SourceNovel> => {
    const novel = getPagedNovelByPath(novelPath);
    if (!novel) {
      throw new Error('Novel not found');
    }

    const s = new Storage('dev-paged-novel');
    const newContent = s.get('provideNewContent');
    const newPages = s.get('provideNewPages');

    const res = await dbManager
      .select({
        count: novelSchema.totalChapters,
      })
      .from(novelSchema)
      .where(
        and(
          eq(novelSchema.pluginId, 'dev-paged-novel'),
          eq(novelSchema.path, novelPath),
        ),
      )
      .get();

    const currentChapters = res?.count || 0;
    let totalPages = Math.ceil(currentChapters / CHAPTERS_PER_PAGE);

    if (totalPages < DEFAULT_PAGES) {
      totalPages = DEFAULT_PAGES;
    }

    if (newPages) {
      totalPages += 2;
    } else if (newContent) {
      const extraChapters = Math.min(
        5,
        CHAPTERS_PER_PAGE - (totalPages * CHAPTERS_PER_PAGE - currentChapters),
      );
      if (extraChapters > 0) {
        totalPages = Math.ceil(
          (currentChapters + extraChapters) / CHAPTERS_PER_PAGE,
        );
      }
    }

    return {
      id: undefined,
      name: novel.name,
      path: novelPath,
      cover: novel.cover,
      author: novel.author,
      summary: novel.summary,
      status: novel.status,
      genres: 'Fiction',
      chapters: generateAllChapters(novelPath, totalPages),
      totalPages: totalPages,
    };
  },
  parsePage: async (
    novelPath: string,
    page: string,
  ): Promise<{ chapters: ChapterItem[] }> => {
    const novel = getPagedNovelByPath(novelPath);
    if (!novel) {
      return { chapters: [] };
    }

    const s = new Storage('dev-paged-novel');
    const newContent = s.get('provideNewContent');
    const newPages = s.get('provideNewPages');

    const res = await dbManager
      .select({
        count: novelSchema.totalChapters,
      })
      .from(novelSchema)
      .where(
        and(
          eq(novelSchema.pluginId, 'dev-paged-novel'),
          eq(novelSchema.path, novelPath),
        ),
      )
      .get();

    const currentChapters = res?.count || 0;
    let totalPages = Math.ceil(currentChapters / CHAPTERS_PER_PAGE);

    if (totalPages < DEFAULT_PAGES) {
      totalPages = DEFAULT_PAGES;
    }

    if (newPages) {
      totalPages += 2;
    } else if (newContent) {
      const extraChapters = Math.min(
        5,
        CHAPTERS_PER_PAGE - (totalPages * CHAPTERS_PER_PAGE - currentChapters),
      );
      if (extraChapters > 0) {
        totalPages = Math.ceil(
          (currentChapters + extraChapters) / CHAPTERS_PER_PAGE,
        );
      }
    }

    const pageNum = parseInt(page, 10);
    if (pageNum < 1 || pageNum > totalPages) {
      return { chapters: [] };
    }
    return {
      chapters: generateChaptersForPage(novelPath, pageNum),
    };
  },
  parseChapter: async (chapterPath: string): Promise<string> => {
    const match = chapterPath.match(/chapter-(\d+)$/);
    const chapterNumber = match ? parseInt(match[1], 10) : 1;
    return generateChapterContent(chapterNumber);
  },
  searchNovels: async (searchTerm: string): Promise<NovelItem[]> => {
    const term = searchTerm.toLowerCase();
    return mockPagedNovels.filter(novel =>
      novel.name.toLowerCase().includes(term),
    );
  },
  resolveUrl: (path: string): string => {
    return path;
  },
  webStorageUtilized: false,
};

export default devPagedNovelPlugin;
export { devPagedNovelPlugin };
