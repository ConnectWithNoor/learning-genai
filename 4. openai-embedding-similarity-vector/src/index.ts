import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

// initialize OpenAI
const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateEmbeddings = async (text: string | string[]) => {
  const response = await ai.embeddings.create({
    input: text,
    model: "text-embedding-3-small",
  });

  console.log(response.data);

  return response;
};

generateEmbeddings(["Hello World", "Goodbye World"]);
