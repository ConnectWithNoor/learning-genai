// This file contains the ways to run huggingface models locally in our system using the transformer

import { pipeline } from "@xenova/transformers";
import wavefile from "wavefile";

// generate embeddings for the given text using the transformer model
async function generateEmbeddings() {
  // https://huggingface.co/docs/transformers.js/api/pipelines#module_pipelines.FeatureExtractionPipeline
  const embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2" // when this is called for the first time, the model is automatically download inside the node_modules folder under onnx folder, and then it is used from there.
  );

  const result = await embedder("Hello World!", {
    pooling: "mean",
    normalize: true,
  });

  console.log(result);
}
// generate text to text generation for the given text using the transformer model (just like openai.chat.create)
const generateTextToText = async () => {
  const textToText = await pipeline(
    "text2text-generation",
    "Xenova/LaMini-Flan-T5-783M" // this model is 800mb in size, so it will take some time to download on the first run.
  );

  const result = await textToText("translate English to French: Hello World!", {
    temperature: 0.8,
    repetition_penalty: 1.5,
    max_new_tokens: 200,
  });

  console.log(result);
};

// generate a speech recognization for the given audio using the transformer mode

// https://huggingface.co/docs/transformers.js/en/guides/node-audio-processing
const generateSpeechRecognition = async () => {
  const transcriber = await pipeline(
    "automatic-speech-recognition",
    "Xenova/whisper-small.en" // this model is 250mb in size, so it will take some time to download on the first run.
  );

  //   found this audio from the huggingface datasets that we can use for testing
  // Docs: https://huggingface.co/datasets/Xenova/transformers.js-docs/blob/main/jfk.wav

  const speechUrl =
    "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav";

  // convert url to buffer
  const speechBuffer = Buffer.from(
    await fetch(speechUrl).then((item) => item.arrayBuffer())
  );

  //   processting the audio file to match our model requirements
  //   https://huggingface.co/docs/transformers.js/en/guides/node-audio-processing

  let wav = new wavefile.WaveFile(speechBuffer);
  wav.toBitDepth("32f"); // Pipeline expects input as a Float32Array
  wav.toSampleRate(16000); // Whisper expects audio with a sampling rate of 16000

  let audioData = wav.getSamples();

  if (Array.isArray(audioData)) {
    if (audioData.length > 1) {
      const SCALING_FACTOR = Math.sqrt(2);

      // Merge channels (into first channel to save memory)
      for (let i = 0; i < audioData[0].length; ++i) {
        audioData[0][i] =
          (SCALING_FACTOR * (audioData[0][i] + audioData[1][i])) / 2;
      }
    }

    // Select first channel
    audioData = audioData[0];
  }

  const result = await transcriber(audioData);

  console.log(result);
};

generateSpeechRecognition();
