import { HfInference } from "@huggingface/inference";
import fs from "fs";
import path from "path";

// Create a new instance of HfInference
const inference = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Generate the embeddings for the input text using a huggingface model
const generateEmbeddings = async () => {
  // https://huggingface.co/BAAI/bge-small-en-v1.5
  const embeddings = await inference.featureExtraction({
    inputs: "Hello World!",
    model: "BAAI/bge-small-en-v1.5",
  });
  console.log("🚀 ~ generateEmbeddings ~ embeddings:", embeddings);
};

// Translate a text from one language to another using a huggingface model
const translateText = async () => {
  // https://huggingface.co/Helsinki-NLP/opus-mt-en-ro
  const translation = await inference.translation({
    inputs: "Hello World!",
    model: "Helsinki-NLP/opus-mt-en-ro",
  });
  console.log("🚀 ~ translateText ~ translation:", translation);
};

// Translate a text from one language to another using a huggingface model with params
const translateTextWithParams = async () => {
  // https://huggingface.co/facebook/mbart-large-50-many-to-many-mmt
  const translation = await inference.translation({
    inputs: "Doors opening",
    model: "facebook/mbart-large-50-many-to-many-mmt",
    // @ts-ignore
    parameters: {
      src_lang: "en_XX",
      tgt_lang: "ar_AR",
    },
  });
  console.log("🚀 ~ translateTextWithParams ~ translation:", translation);
};

// Generate a speech from a text using a huggingface model
const generateSpeech = async () => {
  // https://huggingface.co/coqui/XTTS-v2
  const audio = await inference.textToSpeech({
    inputs:
      "Hi. My name is Noor Muhammad! I am testing out, some, text to speech models by hugging face. I hope you enjoy this!",
    model: "espnet/kan-bayashi_ljspeech_vits",
  });
  const buffer = Buffer.from(await audio.arrayBuffer());

  fs.writeFile(`${path.basename(__dirname)}/../assets/output.wav`, buffer, () =>
    console.log("audio saved!")
  );
};

// generate question answers from a text using a huggingface model
const generateQuestionAnswers = async () => {
  // https://huggingface.co/deepset/roberta-base-squad2
  const questionAnswers = await inference.questionAnswering({
    inputs: {
      question: "What is the name of friend?",
      context:
        "Hi. My name is Noor Muhammad. my friend name is Wahab bhai. He is a good person.",
    },
    model: "deepset/roberta-base-squad2",
  });
  console.log(
    "🚀 ~ generateQuestionAnswers ~ questionAnswers:",
    questionAnswers
  );
};

generateQuestionAnswers();
