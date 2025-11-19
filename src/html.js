import showdown from 'showdown';

const keyValueStoreId = process.env.ACTOR_DEFAULT_KEY_VALUE_STORE_ID;
const keyValueStoreUrl = `https://api.apify.com/v2/key-value-stores/${keyValueStoreId}/records`;

const converter = new showdown.Converter();

function convertToHtml(markdown) {
    return converter.makeHtml(markdown);
};

export function prepareHtml(seriesTitle, chapter, illustrationFilename) {
    return `
        <html>
            <head><title>${seriesTitle} - ${chapter.chapterName}</title></head>
            <body>
                <h1>${chapter.chapterName}</h1>
                <blockquote>
                    ${convertToHtml(chapter.introduction)}

                    <p>${chapter.attribution}</p>
                </blockquote>
                <hr>
                ${convertToHtml(chapter.body)}
                <br />
                <img src="${keyValueStoreUrl}/${illustrationFilename}" alt="chapter illustration" />

                <p></p>
                <p>Authors note:</p>
                ${convertToHtml(chapter.note)}
            </body>
        </html>
    `;
}