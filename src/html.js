import showdown from 'showdown';

const converter = new showdown.Converter();

export function convertToHtml(markdown) {
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
                <img src="${illustrationFilename}" alt="chapter illustration" />

                <p></p>
                <p>Authors note:</p>
                ${convertToHtml(chapter.note)}
            </body>
        </html>
    `;
}