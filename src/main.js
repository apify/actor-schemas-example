import { Actor, log } from 'apify';
import express from 'express';

import { createChat } from './ai.js';
import { writeNewChapter, writeChapter, updateChapter, writtenChapters } from './chapter.js';
import { containerUrl } from './consts.js';
import { getStatus, chapterHtml } from './live_view.js';
import { updateStatus, status } from './status.js';

await Actor.init();

const { seriesTitle, seriesGenre, seriesDescription, mainCharacterDescription, additionalCharacters, chapters, interactiveMode } = await Actor.getInput();

const series = {
    seriesTitle,
    seriesGenre,
    seriesDescription,
    mainCharacterDescription,
    additionalCharacters,
};

await createChat({
    seriesTitle,
    seriesGenre,
    seriesDescription,
    mainCharacterDescription,
    additionalCharacters
});

for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i]
    await writeChapter(series, chapter);
}

if (interactiveMode) {
    const app = express();
    app.use(express.json());

    app.get('/', async (req, res) => {
        const html = await getStatus({ seriesTitle });
        res.send(html);
    });

    app.get('/status', async (req, res) => {
        let chaptersHtml = Object.keys(writtenChapters).sort((a,b) => b > a).map((key) => chapterHtml(writtenChapters[key])).join('\n');
        res.send({
            statusMessage: status.message,
            chapters: chaptersHtml,
        });
    });

    app.post('/', async (req, res) => {
        const chapterData = {
            minLengthWords: req.body.minLengthWords,
            maxLengthWords: req.body.maxLengthWords,
        };
        log.info('Received next chapter data', chapterData);
        const data = await writeNewChapter(series, chapterData);
        res.send(data);
    });

    app.post('/chapter/:chapterNumber', async (req, res) => {
        const chapterData = {
            number: parseInt(req.params.chapterNumber, 10),
            ...req.body,
        };
        log.info('Received new chapter data', chapterData);
        const data = await writeChapter(series, chapterData);
        res.send(data);
    });

    app.put('/chapter/:chapterNumber', async (req, res) => {
        const chapterData = {
            number: parseInt(req.params.chapterNumber, 10),
            updateRequest: req.body.message,
        };
        const data = await updateChapter(series, chapterData);
        res.send(data);
    });

    app.get('/exit', async (req, res) => {
        log.info('Received exit command, stopping interactive mode');
        res.send({ status: 'ok', message: 'Exiting...' });
        await updateStatus({ seriesTitle: series.seriesTitle, writtenChapters, statusMessage: `Finished`, isFinished: true });
        void Actor.exit();
    })

    const port = process.env.ACTOR_WEB_SERVER_PORT;
    app.listen(port, async () => {
        log.info('Interactive mode API started', { url: containerUrl });
        await updateStatus({ seriesTitle: series.seriesTitle, writtenChapters, statusMessage: `Interactive mode started`, isFinished: false });
    });
}

if (!interactiveMode) {
    await updateStatus({ seriesTitle: series.seriesTitle, writtenChapters, statusMessage: `Finished`, isFinished: true });
    await Actor.exit();
}