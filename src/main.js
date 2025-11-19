import { Actor, log } from 'apify';

import { writeChapterWithAI, createIllustrationForChapter } from './ai.js';
import { keyValueStoreUrl } from './consts.js';
import { prepareHtml } from './html.js';

await Actor.init();

const { seriesTitle, seriesGenre, seriesDescription, mainCharacterDescription, additionalCharacters, chapter } = await Actor.getInput();

log.info('Generating chapter');

let chapterText = await writeChapterWithAI({
    seriesTitle,
    seriesGenre,
    seriesDescription,
    mainCharacterDescription,
    additionalCharacters,
    chapter
});

let newChapterText = '';
if (chapterText.startsWith('```json')) newChapterText = chapterText.slice(8, -4);

const chapterData = JSON.parse(newChapterText || chapterText);
await Actor.setValue('chapter.json', chapterData);
log.info('Generated chapter', { name: chapterData.chapterName });

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

const illustrationFileName = `illustration.png`;
const buffer = imageBuffers[0];
await Actor.setValue(illustrationFileName, buffer, { contentType: 'image/png' });

log.info(`Generated illustration`, { url: `${keyValueStoreUrl}/${illustrationFileName}` });

log.info('Generating html');
const chapterFileName = 'chapter.html';
const fullChapterHtml = prepareHtml(seriesTitle, chapterData, `${keyValueStoreUrl}/${illustrationFileName}`);
await Actor.setValue(chapterFileName, fullChapterHtml, { contentType: 'text/html' });
log.info('Generated html', { url: `${keyValueStoreUrl}/${chapterFileName}`});

await Actor.pushData({
    chapterNumber: chapter.number,
    ...chapterData,
    htmlUrl: `${keyValueStoreUrl}/${chapterFileName}`,
    illustrationUrl: `${keyValueStoreUrl}/${illustrationFileName}`,
});

await Actor.exit();