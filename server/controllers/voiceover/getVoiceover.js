const translate = require('google-translate-api');
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');

async function generateVoiceover(text, targetLanguage) {
  try {
    // Translate the text
    const translationResult = await translate(text, { to: targetLanguage });
    const translatedText = translationResult.text;

    // Generate voiceover audio
    const client = new textToSpeech.TextToSpeechClient();
    const request = {
      input: { text: translatedText },
      voice: { languageCode: targetLanguage, ssmlGender: 'MALE' },
      audioConfig: { audioEncoding: 'MP3' },
    };
    const [response] = await client.synthesizeSpeech(request);

    // Save the audio to a file
    const outputFile = `path/to/output/file_${Date.now()}.mp3`;
    fs.writeFileSync(outputFile, response.audioContent, 'binary');

    // Return the file URL or send the file directly
    return outputFile;
  } catch (error) {
    console.error('Error:', error);
    throw new Error('An error occurred during voiceover generation');
  }
}

module.exports = generateVoiceover;
