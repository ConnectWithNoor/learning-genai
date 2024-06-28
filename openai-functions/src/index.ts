import { OpenAI } from "openai";
import { encoding_for_model } from "tiktoken";
import dotenv from "dotenv";

dotenv.config();

// initialize OpenAI
const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_TOKENS = 500; // max token limit for the context to sent to the model.
const encoder = encoding_for_model("gpt-3.5-turbo"); // to get the token length of the context

// context is to give GPT some history/context about the conversation, we will be pushing the conversation to this array
const context: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
  {
    role: "system",
    content:
      "You are an expert in the field of sales and marketing. You have to greet the user and tell them about yourself. Maintain the character throughout the conversation.",
  },
];

async function createChat() {
  const updatedContext = alterMessageContext(); // getting the altered context

  const response = await ai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: updatedContext,
  });

  context.push(response.choices[0].message); // pushing the response to the context array

  console.log(`${response.choices[0].message.content}`);
}

function countContextTokenLength() {
  let tokenLength = 0;
  context.forEach((message) => {
    tokenLength += encoder.encode(`${message.content}`).length;
  });

  return tokenLength;
}

// this is to eliminate the message context that is greater than the MAX TOKENS specified, so that out it doesn't go outside the model token limit.
function alterMessageContext() {
  let tokenLength = countContextTokenLength(); // countring the token length of the context

  while (tokenLength > MAX_TOKENS) {
    // keep looping until the token length goes less than the MAX_TOKENS
    for (let i = 0; i < context.length; i++) {
      if (context[i].role !== "system") {
        //ignoring the system prompot
        context.splice(i, 1); // removing the first message from the context
        tokenLength = countContextTokenLength();
        break;
      }
    }
  }

  return context;
}

// listen for user input from the terminal using the readable stream
process.stdin.addListener("data", async (input) => {
  const userInput = input.toString().trim();

  if (userInput === "/exit") {
    console.log("Exiting the chat. Goodbye!");
    process.exit();
  }

  context.push({
    role: "user",
    content: userInput,
  });

  createChat();
});
