import { OpenAI } from "openai";
import {
  AddParams,
  ChromaClient,
  Collection,
  OpenAIEmbeddingFunction,
  QueryParams,
} from "chromadb";
import dotenv from "dotenv";

dotenv.config();

// initialize OpenAI
const chromaClient = new ChromaClient({
  path: process.env.CHROMA_DB_URL,
});

// creating chromeDB e,bedding function that uses OpenAI model
const embeddingFunction = new OpenAIEmbeddingFunction({
  openai_api_key: `${process.env.OPENAI_API_KEY}`,
  openai_model: "text-embedding-3-small",
});

const createCollection = async (name: string) => {
  const chromaCollection = await chromaClient.createCollection({
    name: name,
    embeddingFunction: embeddingFunction, // pass the embedding function
  });
  // after creating collection, you can go to the chromadb endpoint to view the collection
  // To view all collections -> http://localhost:8000/api/v1/collections
  // To view a specific collection -> http://localhost:8000/api/v1/collections/<collection_name>

  return chromaCollection;
};

const getCollection = async (name: string) => {
  const chromaCollection = await chromaClient.getCollection({
    name: name,
    embeddingFunction: embeddingFunction, // pass the embedding function
  });

  return chromaCollection;
};

const addDataToCollection = async (data: AddParams, collection: Collection) => {
  const result = await collection.add({
    ids: data.ids, // must be unique throughout the collection
    documents: data.documents,
    embeddings: data.embeddings, // this should be the embeddings generated from OpenAI model
    metadatas: data.metadatas,
  });

  return result;
};

const queryCollection = async (collection: Collection, query: QueryParams) => {
  const result = await collection.query({
    queryEmbeddings: query.queryEmbeddings, // this should be the embeddings generated from OpenAI model
    // queryTexts: query.queryTexts
    queryTexts: query.queryTexts,
  });

  return result;
};

const main = async () => {
  // Step 1: Create a collection
  // const chromaCollection = await createCollection("data-test-2");

  // Step 2: Get a collection (if collection is already created)
  const chromaCollection = await getCollection("data-test-2");

  // Step 3: Add data to the collection

  // const data = await addDataToCollection(
  //   {
  //     ids: ["id_1", "id_2"],
  //     documents: ["Good morning", "Good night"],
  //     // embeddings: [] // no need to provide if you are using embedding function
  //   },
  //   chromaCollection
  // );

  // Step 4: Query the collection
  const query = await queryCollection(chromaCollection, {
    queryTexts: ["Hello World", "Night"],
  });
  console.log(query);
};

main();

// Check FAQ-Chatbot-ChromaDB for even better understandings.
