import { GoogleGenAI } from "@google/genai";
import { Actor } from 'apify';

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

let chat;
let messageCount = 0;

export async function createChat({ seriesTitle, seriesGenre, seriesDescription, mainCharacterDescription, additionalCharacters }) {
  const systemInstruction = `
    You are an acomplished shadow writer and your role is to provide support to flash out ideas for new chapters in a web series called ${seriesTitle}.
    The series in ${seriesGenre} genre and is about:
    ${seriesDescription}

    The main character of the book can be described like this:
    ${mainCharacterDescription}

    In addition to main character, the series has following other important existing characters:
    ${additionalCharacters}

    The book is written in a specific format and it's your role to write the content of the book while keeping the format consistent.

    Each chapter of the book should always have:
    
    * Short introduction text - This text is not about the chapter itself, but is a quote from a person somehow related to the main character, from the future but not otherwise part of the story.
    * Attribution - Name of the person who is the introduction text attributed to.
    * Text of the chapter
    * Illustration description - Description of an image which should be used as illustration for the chapter at it's end. The description should be detailed so that image generation can use it to create consistent image even without context of the rest of the series. The image should not include the chapter or series title and it should relate to event in th chapter.
    * Author's note - Small tidbit of information provided by the author about the chapter (something like "Wow, what an amazing fight scene!")
    * Summary - Short summary of the chapter highlighting important events and characters which can be later used as context for future chapters.

    You will receive instructions for each chapter written in 3 possible formats:

    1. New chapter with full description
    **Chapter number:** <number of the chapter>
    **Chapter description:** <chapter description on a single line>
    **Chapter length:** <range of how long the chapter should be>

    2. New chapter without description
    **Chapter number:** <number of the chapter>
    **Chapter description:** <empty>
    **Chapter length:** <range of how long the chapter should be>

    3. Update to previously created chapter
    **Chapter number:** <number of the chapter>
    **Update request:** <description how the chapter should be changed>

    In case of option 2 (new chapter without description) create a new chapter with a story following the previous chapter. In case it's a first chapter, be creative.

    And your role is to write the chapters based on the provided instructions.

    Each chapter must always output as a JSON in following format:
    {
      chapterName: { type: "string" }, 
      introduction: { type: "string" },
      attribution: { type: "string" },
      body: { type: "string" },
      illustration: { type: "string" },
      note: { type: "string" },
      summary: { type: "string" }
    }
    
    All the texts except for the illustration description and summary should be in a Markdown format. Do not use "\`\`\`" anywhere in the texts since it will break the JSON formatting.
  `;

  chat = await ai.chats.create(
    {
      model: "gemini-2.5-flash",
      history: [],
      config: {
        systemInstruction,
      },
    }
  );
}

export async function writeChapterWithAI(chapter, retry) {
  messageCount++;
  const message = `${retry ? 'I could not parse your answer. Send the chapter again, but make sure to create just one chapter and output it in correct format.' : ''}
**Chapter number:** ${chapter.number}
**Chapter description:** ${chapter.description ?? ''}
**Chapter length:** ${chapter.minLengthWords} - ${chapter.maxLengthWords}`;
  const response = await chat.sendMessage({ message });

  const requestWithResponse = `Message:
${message}

Response:
${response.text}`;

  await Actor.setValue(`communication-${messageCount.toString().padStart(3, '0')}.txt`, requestWithResponse, { contentType: 'text/plain' });
  
  return response.text.replace(/```json/g, '').split('```')[0];
}

export async function updateChapterWithAI(chapter, retry) {
  messageCount++;
  const message =  `${retry ? 'I could not parse your answer. Send the chapter again, but make sure to create just one chapter and output it in correct format.' : ''}
**Chapter number:** ${chapter.number}
**Update request:** ${chapter.updateRequest}
`;
  const response = await chat.sendMessage({ message });

  const requestWithResponse = `Message:
${message}

Response:
${response.text}`;

  await Actor.setValue(`communication-${messageCount.toString().padStart(3, '0')}.txt`, requestWithResponse, { contentType: 'text/plain' });
  
  return response.text.replace(/```json/g, '').split('```')[0];
}

export async function createIllustrationForChapter({ seriesTitle, seriesGenre, seriesDescription, mainCharacterDescription, additionalCharacters, chapterSummary, chapterIllustrationDescription }) {
  const prompt = `
Create an illustration for the chapter in a series titled ${seriesTitle}.
The illustration should not contain any texts not related to purely the image, no chapter title, series title or anything like that.

The series is in ${seriesGenre} genre and is about:
${seriesDescription}

The main character of the book can be described like this:
${mainCharacterDescription}

In addition to main character, the series has following other important existing characters:
${additionalCharacters}

The chapter is about: 
${chapterSummary}

And the illustration should look like this:
${chapterIllustrationDescription}
`;

  const response = await ai.models.generateContent(
    {
      model: "gemini-2.5-flash-image",
      contents:prompt,
    }
  );
  const buffers = [];
  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      buffers.push(Buffer.from(imageData, "base64"));
    }
  }
  return buffers;
}