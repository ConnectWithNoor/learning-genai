// learn more about chromadb in 5. vector db directory

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Chroma } from "@langchain/community/vectorstores/chroma";

const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0.8,
});

const question = "How was this PDF created?";

const main = async () => {
  // Create a web loader
  const loader = new PDFLoader("path-to-pdf", {
    splitPages: false, // split the pdf into pages or not
  });
  const docs = await loader.load();
  const splitter = new RecursiveCharacterTextSplitter({
    separators: [`. \n`], // split the text to chunks by new line
  });
  const splittedDocs = await splitter.splitDocuments(docs);

  // Create an embeddings instance
  const embeddings = new OpenAIEmbeddings();

  // Create a vector store (in chroma for this example)
  const vectorStore = await Chroma.fromDocuments(splittedDocs, embeddings, {
    collectionName: "temp-collection",
    url: process.env.CHROMA_DB_URL,
  });

  // Add documents to the vector store
  await vectorStore.addDocuments(splittedDocs);

  // Retrieve the top 3 most similar documents
  const retriever = vectorStore.asRetriever({
    k: 3,
  });

  const result = await retriever.invoke(question);
  const resultDocuments = result.map((doc) => doc.pageContent);

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
    context: resultDocuments,
  });
  console.log(response.content);
};

main();
