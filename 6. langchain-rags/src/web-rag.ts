//  RAG Application using Web parsing using Cheerio

import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

const question = "What lights the universe standard candles?";

const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-3.5-turbo",
  temperature: 0.8,
});

// initialize the cheerio loader
const loader = new CheerioWebBaseLoader(
  "https://news.ycombinator.com/item?id=34817881"
);

const main = async () => {
  // check cheerio doc to learn more about how cheerio works.
  //   ALTERNATIVELY: we can use puppeteer, playwright to get the data from the web
  const docs = await loader.load();

  //   creating chunks of the text grabbed from the web
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 350, // 350 characters per chunk
    chunkOverlap: 25, // new chunk starts from 25 characters before the end of the previous chunk
    // separators: [".", "!", "?", "\n", "\r\n"] // OR use separators to split the text by chunks
  });

  const splittedDoc = await splitter.splitDocuments(docs);

  const embeddings = new OpenAIEmbeddings(); // create OpenAI embeddings
  const vectorStore = new MemoryVectorStore(embeddings); // create memory vector store

  //   add documents to the vector store
  //   we have to convert our string into documents
  await vectorStore.addDocuments(splittedDoc);
  //   create a data retriever from the vector store
  const retriever = vectorStore.asRetriever({
    k: 5,
  });

  //   get the result from the retriever
  const result = await retriever.invoke(question);
  const outputResults = result.map((res) => res.pageContent);

  // build template for chat
  const template = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Answer to users question based on the following context: {context}.",
    ],
    ["user", "{query}"],
  ]);

  const chain = template.pipe(model);

  const response = await chain.invoke({
    query: question,
    context: outputResults,
  });

  console.log(response.content);
};

main();
