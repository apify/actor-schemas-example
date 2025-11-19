import { Actor, log } from 'apify';

import { createChat, writeChapterWithAI, createIllustrationForChapter } from './ai.js';
import { keyValueStoreUrl } from './consts.js';
import { prepareHtml } from './html.js';

await Actor.init();

const { seriesTitle, seriesGenre, seriesDescription, mainCharacterDescription, additionalCharacters, chapters } = await Actor.getInput();

await createChat({
    seriesTitle,
    seriesGenre,
    seriesDescription,
    mainCharacterDescription,
    additionalCharacters
});

async function writeChapter(chapter, retry = false) {
    try {
        const chapterFileName = `chapter-${chapter.number.toString().padStart(2, "0")}`;
        
        log.info('Generating chapter', { number: chapter.number });

        let chapterText = await writeChapterWithAI(chapter, retry);
        await Actor.setValue(`${chapterFileName}.txt`, chapterText, { contentType: 'text/plain' });

        const jsonFileName = `${chapterFileName}.json`;
        const chapterData = JSON.parse(chapterText);
        await Actor.setValue(jsonFileName, chapterData);

        log.info('Generated chapter', { name: chapterData.chapterName, url: `${keyValueStoreUrl}/${jsonFileName}` });

        log.info('Generating illustration');
        const imageBuffers = await createIllustrationForChapter({
            seriesTitle,
            seriesGenre,
            seriesDescription,
            mainCharacterDescription,
            additionalCharacters,
            chapterSummary: chapterData.summary,
            chapterIllustrationDescription: chapterData.illustration
        });

        const illustrationFileName = `${chapterFileName}.png`;
        const buffer = imageBuffers[0];
        await Actor.setValue(illustrationFileName, buffer, { contentType: 'image/png' });

        log.info(`Generated illustration`, { url: `${keyValueStoreUrl}/${illustrationFileName}` });

        log.info('Generating html');
        const htmlFileName = `${chapterFileName}.html`;
        const fullChapterHtml = prepareHtml(seriesTitle, chapterData, `${keyValueStoreUrl}/${illustrationFileName}`);
        await Actor.setValue(htmlFileName, fullChapterHtml, { contentType: 'text/html' });
        log.info('Generated html', { url: `${keyValueStoreUrl}/${htmlFileName}`});

        await Actor.pushData({
            chapterNumber: chapter.number,
            ...chapterData,
            htmlUrl: `${keyValueStoreUrl}/${htmlFileName}`,
            illustrationUrl: `${keyValueStoreUrl}/${illustrationFileName}`,
        });
    } catch (error) {
        log.exception(error, 'Failed to properly generate chapter', { willRetry: !!retry });
        // The AI can create random stuf, let's try again if we failed to parse/store the chapter data
        if (!retry) return writeChapter(chapter, true);
        else throw error;
    }
}

for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i]
    await writeChapter(chapter);
}

await Actor.exit();