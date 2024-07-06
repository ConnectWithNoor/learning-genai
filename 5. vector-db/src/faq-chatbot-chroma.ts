import { AddParams, ChromaClient, OpenAIEmbeddingFunction } from "chromadb";
import OpenAI from "openai";

// Generate a faq info about a software company in 100 words. Name the company as Odox (wrote this and copilot generatoed the below para)
const faqOdex =
  "Odox is a software company that specializes in developing software solutions for businesses. With a team of experienced developers and designers, Odox offers a wide range of services, including web development, mobile app development, and custom software development. The company is known for its innovative approach to problem-solving and its commitment to delivering high-quality solutions that meet the unique needs of each client. Odox has a proven track record of success, with a portfolio of satisfied clients who have benefited from its services. Contact Odox today to learn more about how the company can help your business succeed. We have a team of 50 developers and 8 designers working on various projects. We have completed over 100 projects successfully. Our clients are in 17 countries including the US, UK, Canada, Australia, Germany, Estonia, Pakistan and India. and we have a 98% satisfaction rate. We have deliveried to various industries like healthcare, finance, e-commerce, and more";

//   Generate a faq info about a company name Kisup, the company works in the field of Digital marketing, include the number of employes along with their departments as well as the numbers of their success ratio, countries they offer services as well as other numercial significant information about the company (wrote this and copilot generatoed the below para)
const faqKisup = `Kisup is a digital marketing company that specializes in helping businesses grow their online presence. With a team of 100 employees, Kisup offers a wide range of services, including search engine optimization, social media marketing, and pay-per-click advertising. The company has a success rate of 95% and has helped clients in over 50 countries achieve their marketing goals. Kisup has offices in the London, NewYork, Gaaza, Paris, and Baku, and is known for its innovative approach to digital marketing. Our clients are in 12 countries including the Ethopia, Kenya, Nigeria, South Africa, Ghana, and more. Contact Kisup today to learn more about how the company can help your business succeed.`;

//   Generate a faq info about a company name Fabrock, the company works in the field of Textile industry, include the number of employes along with their departments as well as the numbers of their success ratio, countries they offer services as well as other numercial significant information about the company (wrote this and copilot generatoed the below para)

const faqFabrock = `Fabrock is a textile company that specializes in producing high-quality fabrics for the fashion industry. With a team of 200 employees, Fabrock offers a wide range of services, including fabric design, production, and distribution. The company has a success rate of 90% and has clients in over 30 countries. Fabrock has offices in the US, UK, France, Italy, and China, and is known for its innovative approach to textile production. Our clients are in 5 countries including the Russia, Uzbikistan, Jamaica, New Zeland and Iran. Contact Fabrock today to learn more about how the company can help your business succeed.`;

// IMPORATNT: we have to use convert all the data to chunks before sending it for embeddings to openai. Check the YT video (48 mins)in the readme file for better understanding.

// initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// initialize OpenAI
const chromaClient = new ChromaClient({
  path: process.env.CHROMA_DB_URL,
});

// creating chromeDB e,bedding function that uses OpenAI model
const embeddingFunction = new OpenAIEmbeddingFunction({
  openai_api_key: `${process.env.OPENAI_API_KEY}`,
  openai_model: "text-embedding-3-small",
});

const COLLECTION_NAME = "faq-chatbot-chroma";

const messagesContext: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
  [];

// ____________________CREATING HELPER FUNCTION___________________________________

//  create a collection in chromadb
const createCollection = async () => {
  const chromaCollection = await chromaClient.createCollection({
    name: COLLECTION_NAME,
    embeddingFunction: embeddingFunction, // pass the embedding function
  });
  // after creating collection, you can go to the chromadb endpoint to view the collection
  // To view all collections -> http://localhost:8000/api/v1/collections
  // To view a specific collection -> http://localhost:8000/api/v1/collections/<collection_name>

  return chromaCollection;
};

// get collection from chromadb
const getCollection = async () => {
  const chromaCollection = await chromaClient.getCollection({
    name: COLLECTION_NAME,
    embeddingFunction: embeddingFunction, // pass the embedding function
  });

  return chromaCollection;
};

const addDataToCollection = async (data: AddParams) => {
  const collection = await getCollection();
  const result = await collection.add({
    ids: data.ids, // must be unique throughout the collection
    documents: data.documents,
    embeddings: data.embeddings, // this should be the embeddings generated from OpenAI model
    metadatas: data.metadatas,
  });

  return result;
};

const askQuestion = async (question: string) => {
  const collection = await getCollection();

  const result = await collection.query({
    queryTexts: [question],
    nResults: 1, // we only want 1 result back
  });

  const relavantDoc = result.documents[0][0]; //log it for better understanding

  //   if we have a relavent response from the vector db. constuct the user response using open ai
  if (relavantDoc) {
    const openAiResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.2, // we want the response to be more relevant to our data provided
      messages: [
        {
          role: "system",
          content: `Answer the next questions using the information provided to you: ${relavantDoc}`,
        },
        ...messagesContext,
      ],
    });

    const responseOpenAi = openAiResponse.choices[0].message.content;
    messagesContext.push({
      role: "assistant",
      content: responseOpenAi,
    });

    console.log(responseOpenAi);
  } else {
    console.log("No relavent document found in the vector db");
  }
};

// ____________________CREATING OPERATIVE FUNCTIONS___________________________________

// run this function once so that all the data is added to the collection
const initiazeData = async () => {
  await createCollection();
  await addDataToCollection({
    ids: ["odox", "kisup", "fabrock"],
    documents: [faqOdex, faqKisup, faqFabrock],
  });
};

// listen for user input from the terminal using the readable stream
process.stdin.addListener("data", async (input) => {
  const question = input.toString().trim();

  if (question === "/exit") {
    console.log("Exiting the chat. Goodbye!");
    process.exit();
  }

  messagesContext.push({
    role: "user",
    content: question,
  });

  askQuestion(question);
});

// initiazeData();

console.log(
  "Chatbot started. You can start questioning the chatbot. Enter /exit to end the chat."
);
