import { Actor, log } from 'apify';

import { writeChapterWithAI, updateChapterWithAI, createIllustrationForChapter } from './ai.js';
import { keyValueStoreUrl } from './consts.js';
import { prepareHtml } from './html.js';
import { updateStatus } from './status.js';

export const writtenChapters = {};
const draftCounts = {};

async function processChapterFromAI(chapterText, chapter, series) {
    await updateStatus({ seriesTitle: series.seriesTitle, writtenChapters, statusMessage: `Processing chapter ${chapter.number}`, isFinished: false });
    const draftNumber = (draftCounts[chapter.number] ?? 0) + 1;
    const draftChapterFileName = `draft-chapter-${chapter.number.toString().padStart(2, "0")}-${draftNumber.toString().padStart(2, "0")}`;
    const finalChapterFileName = `final-chapter-${chapter.number.toString().padStart(2, "0")}`;
    await Actor.setValue(`${draftChapterFileName}.txt`, chapterText, { contentType: 'text/plain' });
    await Actor.setValue(`${finalChapterFileName}.txt`, chapterText, { contentType: 'text/plain' });

    const draftJsonFileName = `${draftChapterFileName}.json`;
    const finalJsonFileName = `${finalChapterFileName}.json`;
    const chapterData = JSON.parse(chapterText);
    await Actor.setValue(draftJsonFileName, chapterData);
    await Actor.setValue(finalJsonFileName, chapterData);

    log.info('Generated chapter', { name: chapterData.chapterName, url: `${keyValueStoreUrl}/${draftJsonFileName}` });

    log.info('Generating illustration');
    const imageBuffers = await createIllustrationForChapter({
        ...series,
        chapterSummary: chapterData.summary,
        chapterIllustrationDescription: chapterData.illustration
    });

    const draftIllustrationFileName = `${draftChapterFileName}.png`;
    const finalIllustrationFileName = `${finalChapterFileName}.png`;
    const buffer = imageBuffers[0];
    await Actor.setValue(draftIllustrationFileName, buffer, { contentType: 'image/png' });
    await Actor.setValue(finalIllustrationFileName, buffer, { contentType: 'image/png' });

    log.info(`Generated illustration`, { url: `${keyValueStoreUrl}/${draftIllustrationFileName}` });

    log.info('Generating html');
    const draftHtmlFileName = `${draftChapterFileName}.html`;
    const finalHtmlFileName = `${finalChapterFileName}.html`;
    const draftFullChapterHtml = prepareHtml(series.seriesTitle, chapterData, `${keyValueStoreUrl}/${draftIllustrationFileName}`);
    const finalFullChapterHtml = prepareHtml(series.seriesTitle, chapterData, `${keyValueStoreUrl}/${finalIllustrationFileName}`);
    await Actor.setValue(draftHtmlFileName, draftFullChapterHtml, { contentType: 'text/html' });
    await Actor.setValue(finalHtmlFileName, finalFullChapterHtml, { contentType: 'text/html' });
    log.info('Generated html', { url: `${keyValueStoreUrl}/${draftHtmlFileName}`});

    const result = {
        chapterNumber: chapter.number,
        ...chapterData,
        htmlUrl: `${keyValueStoreUrl}/${draftHtmlFileName}`,
        illustrationUrl: `${keyValueStoreUrl}/${draftIllustrationFileName}`,
        draftNumber,
    }

    await Actor.pushData(result);

    writtenChapters[chapter.number] = result;
    draftCounts[chapter.number] = draftNumber;

    await updateStatus({ seriesTitle: series.seriesTitle, writtenChapters, statusMessage: `Finished generating chapter ${chapter.number}`, isFinished: false });

    return result;
}

export async function writeNewChapter(series, { minLengthWords, maxLengthWords }, retry = false) {
    try {        
        const latestChapterNumber = Math.max(0, ...Object.keys(writtenChapters));
        const chapter = {
            number: latestChapterNumber + 1,
            minLengthWords: minLengthWords ?? 100,
            maxLengthWords: maxLengthWords ?? 2000
        };
        log.info('Generating chapter', { number: chapter.number });

        await updateStatus({ seriesTitle: series.seriesTitle, writtenChapters, statusMessage: `Generating ${chapter.number}`, isFinished: false });
        let chapterText = await writeChapterWithAI(chapter, retry);
        return await processChapterFromAI(chapterText, chapter, series);
    } catch (error) {
        if (error.data?.invalidItems) {
            // Here we log separate exception for each item which failed validation, but you can handle it any way you want
            error.data.invalidItems.forEach((item) => {
                const { validationErrors } = item;
                log.exception(error, 'Failed to properly generate chapter due to validation error', { validationErrors });
            });
        } else {
            log.exception(error, 'Failed to properly generate chapter', { willRetry: !!retry });
        }
        // The AI can create random stuf, let's try again if we failed to parse/store the chapter data
        if (!retry) return writeNewChapter(series, { minLengthWords, maxLengthWords }, true);
        else throw error;
    }
}

export async function writeChapter(series, chapter, retry = false) {
    try {        
        log.info('Generating chapter', { number: chapter.number });
        await updateStatus({ seriesTitle: series.seriesTitle, writtenChapters, statusMessage: `Generating ${chapter.number}`, isFinished: false });

        let chapterText = await writeChapterWithAI(chapter, retry);
        return await processChapterFromAI(chapterText, chapter, series);
    } catch (error) {
        if (error.data?.invalidItems) {
            // Here we log separate exception for each item which failed validation, but you can handle it any way you want
            error.data.invalidItems.forEach((item) => {
                const { validationErrors } = item;
                log.exception(error, 'Failed to properly generate chapter due to validation error', { validationErrors });
            });
        } else {
            log.exception(error, 'Failed to properly generate chapter', { willRetry: !!retry });
        }
        // The AI can create random stuf, let's try again if we failed to parse/store the chapter data
        if (!retry) return writeChapter(series, chapter, true);
        else throw error;
    }
}

export async function updateChapter(series, chapter, retry = false) {
    try {        
        log.info('Updating chapter', { number: chapter.number });
        await updateStatus({ seriesTitle: series.seriesTitle, writtenChapters, statusMessage: `Generating ${chapter.number}`, isFinished: false });

        let chapterText = await updateChapterWithAI(chapter, retry);
        return await processChapterFromAI(chapterText, chapter, series);
    } catch (error) {
        if (error.data?.invalidItems) {
            // Here we log separate exception for each item which failed validation, but you can handle it any way you want
            error.data.invalidItems.forEach((item) => {
                const { validationErrors } = item;
                log.exception(error, 'Failed to properly generate chapter due to validation error', { validationErrors });
            });
        } else {
            log.exception(error, 'Failed to properly generate chapter', { willRetry: !!retry });
        }
        // The AI can create random stuf, let's try again if we failed to parse/store the chapter data
        if (!retry) return updateChapter(series, chapter, true);
        else throw error;
    }
}