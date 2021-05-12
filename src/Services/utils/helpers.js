export const parseChapterNumber = (chapterName) => {
    chapterName = chapterName.toLowerCase();
    chapterName = chapterName.replace(/volume (\d+)/, "");

    const basic = chapterName.match(/ch (\d+)/);
    const occurrence = chapterName.match(/\d+/);

    if (basic) {
        return basic[0];
    } else if (occurrence) {
        return occurrence[0];
    } else {
        return 0;
    }
};