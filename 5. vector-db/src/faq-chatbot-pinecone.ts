import OpenAI from "openai";

import { Pinecone, RecordMetadataValue } from "@pinecone-database/pinecone";

// CUSTOM INFORMATION

// Generate a faq info about a software company in 100 words. Name the company as Odox (wrote this and copilot generatoed the below para)
const faqOdex =
  "Odox is a software company that specializes in developing software solutions for businesses. With a team of experienced developers and designers, Odox offers a wide range of services, including web development, mobile app development, and custom software development. The company is known for its innovative approach to problem-solving and its commitment to delivering high-quality solutions that meet the unique needs of each client. Odox has a proven track record of success, with a portfolio of satisfied clients who have benefited from its services. Contact Odox today to learn more about how the company can help your business succeed. We have a team of 50 developers and 8 designers working on various projects. We have completed over 100 projects successfully. Our clients are in 17 countries including the US, UK, Canada, Australia, Germany, Estonia, Pakistan and India. and we have a 98% satisfaction rate. We have deliveried to various industries like healthcare, finance, e-commerce, and more";

//   Generate a faq info about a company name Kisup, the company works in the field of Digital marketing, include the number of employes along with their departments as well as the numbers of their success ratio, countries they offer services as well as other numercial significant information about the company (wrote this and copilot generatoed the below para)
const faqKisup = `Kisup is a digital marketing company that specializes in helping businesses grow their online presence. With a team of 100 employees, Kisup offers a wide range of services, including search engine optimization, social media marketing, and pay-per-click advertising. The company has a success rate of 95% and has helped clients in over 50 countries achieve their marketing goals. Kisup has offices in the London, NewYork, Gaaza, Paris, and Baku, and is known for its innovative approach to digital marketing. Our clients are in 12 countries including the Ethopia, Kenya, Nigeria, South Africa, Ghana, and more. Contact Kisup today to learn more about how the company can help your business succeed.`;

//   Generate a faq info about a company name Fabrock, the company works in the field of Textile industry, include the number of employes along with their departments as well as the numbers of their success ratio, countries they offer services as well as other numercial significant information about the company (wrote this and copilot generatoed the below para)
const faqFabrock = `Fabrock is a textile company that specializes in producing high-quality fabrics for the fashion industry. With a team of 200 employees, Fabrock offers a wide range of services, including fabric design, production, and distribution. The company has a success rate of 90% and has clients in over 30 countries. Fabrock has offices in the US, UK, France, Italy, and China, and is known for its innovative approach to textile production. Our clients are in 5 countries including the Russia, Uzbikistan, Jamaica, New Zeland and Iran. Contact Fabrock today to learn more about how the company can help your business succeed.`;

const messagesContext: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
  [];

// initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// initialize Pinecone client
const pc = new Pinecone({ apiKey: `${process.env.PINECONE_API_KEY}` });

const dataToEmbed = [
  {
    info: faqOdex,
    company: "Odox", // these 2 extra properties are to show that we can add extra data to the embeddings
    contactNo: 123123,
  },
  {
    info: faqKisup,
    company: "Kisup", // these 2 extra properties are to show that we can add extra data to the embeddings
    contactNo: 123123,
  },
  {
    info: faqFabrock,
    company: "Fabrock", // these 2 extra properties are to show that we can add extra data to the embeddings
    contactNo: 123123,
  },
];

const storeEmbeddings = async () => {
  await Promise.all(
    dataToEmbed.map(async (data) => {
      const embeddResult = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: [data.info],
      });

      const embedding = embeddResult.data[0].embedding; // get the embedding from the response of openAI

      // upsert the embedding along with metadata to pinecone
      await pc
        .index("learning-pinecone")
        .namespace("faq-namespace")
        .upsert([
          {
            id: data.company,
            values: embedding,
            metadata: {
              info: data.info,
              company: data.company,
              contactNo: data.contactNo,
            },
          },
        ]);
    })
  );
};

const queryEmbeddings = async (question: string) => {
  // convert query into embedding using openai
  const queryEmbedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: [question],
  });

  const embedding = queryEmbedding.data[0].embedding; // get the embedding from the response of openAI

  //   search/query the embedding on pinecone db

  const queryResult = await pc
    .index("learning-pinecone")
    .namespace("faq-namespace")
    .query({
      vector: embedding,
      topK: 1,
      includeMetadata: true,
      includeValues: true, //include the vector values
    });

  console.log("queryResult", queryResult);

  return queryResult;
};

const responseUserWithOpenAI = async (relaventInfo: RecordMetadataValue) => {
  const openAiResponse = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0.2, // we want the response to be more relevant to our data provided
    messages: [
      {
        role: "system",
        content: `Answer the next questions using the information provided to you: ${relaventInfo}`,
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
};

// storeEmbeddings();

// queryEmbeddings(
//   "What is the difference between the success rate of Fabrock and Kisup?"
// );

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

  const queryResult = await queryEmbeddings(question);
  const relaventInfo = queryResult.matches[0].metadata;

  if (relaventInfo) {
    await responseUserWithOpenAI(relaventInfo.info);
  } else {
    console.log("No relavent document found in the vector db");
  }
});

console.log(
  "Chatbot started. You can start questioning the chatbot. Enter /exit to end the chat."
);
