// We will use hardcoded data with in memory database for now as the basic Rag application
// In memory database is used to save time, we have to use vector db.

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";

const chatOpenAI = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-3.5-turbo",
  temperature: 0.8,
});

// out hardcoded data
const hardcodeData = [
  "My full name is Noor Muhammad",
  "I am a software engineer",
  "I am 25 years old",
  "I am from Pakistan",
  "I have a degree in Computer Science",
  "I work in JavaScript and TypeScript languages",
  "I also work in Python language sometimes",
  "I have 3 years of experience in software development",
];

const question = "What is my favorite programming language?";

const main = async () => {
  const embeddings = new OpenAIEmbeddings(); // create OpenAI embeddings
  const vectorStore = new MemoryVectorStore(embeddings); // create memory vector store

  //   add documents to the vector store
  //   we have to convert our string into documents
  await vectorStore.addDocuments(
    hardcodeData.map((text) => new Document({ pageContent: text }))
  );

  //   create a data retriever from the vector store
  const retriever = vectorStore.asRetriever({
    k: 2,
  });

  //   get the result from the retriever
  const result = await retriever.invoke(question);
  const outputResults = result.map((res) => res.pageContent);

  //   add OPenAI here to get the answer in the structured way, currently skipping it as we are focusing on the basic rag
  // get help from langchain-basic file for the OpenAI implementation

  console.log(outputResults);
};

main();
