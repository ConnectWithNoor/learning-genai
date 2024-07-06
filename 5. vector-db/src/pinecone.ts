import {
  Pinecone,
  PineconeRecord,
  RecordMetadata,
} from "@pinecone-database/pinecone";

// STEP 1: initialize Pinecone client
const pc = new Pinecone({ apiKey: `${process.env.PINECONE_API_KEY}` });

// ________ HELPER FUNCTIONS -----------

const listAllIndexes = async () => {
  const indexes = await pc.listIndexes();
  console.log("listAllIndexes", indexes);
  return indexes;
};

const listAnIndex = async (indexId: string) => {
  const index = await pc.index(indexId);
  console.log("listAnIndex", index);
  return index;
};

const generateRandomVectors = (length: number) => {
  return Array.from({ length }, () => Math.random());
};

const createIndex = async (name: string) => {
  // check readme to learn about the index
  const index = await pc.createIndex({
    name: name,
    dimension: 1536, // replce with model dimentions, openAI text-embedding-3-small uses 1536 dimensions
    metric: "cosine",
    spec: {
      serverless: {
        cloud: "aws",
        region: "us-east-1",
      },
    },
  });
  return index;
};

const createNameSpaceAndUpsert = async (
  indexName: string,
  namespaceName: string,
  data: PineconeRecord<RecordMetadata>[]
) => {
  const index = await listAnIndex(indexName);

  const namespace = index.namespace(namespaceName);

  await namespace.upsert(data);
};

const queryVectorById = async (
  indexName: string,
  namespaceName: string,
  id: string
) => {
  const index = await listAnIndex(indexName);
  const namespace = index.namespace(namespaceName);

  const record = await namespace.query({
    id: id,
    topK: 1, // how many similar query results to return
    includeMetadata: true,
  });

  console.log("queryVectorById", record);

  return record;
};

// createIndex("learning-pinecone")

// listAllIndexes()

// listAnIndex("learning-pinecone")

// createNameSpaceAndUpsert("learning-pinecone", "namespace-2", [
//   {
//     id: "id-2",
//     values: generateRandomVectors(1536),
//     metadata: {
//       name: "New New",
//       contact: "connectwithnoor1@gmail.com",
//     },
//   },
// ]);

queryVectorById("learning-pinecone", "namespace-2", "id-2");
