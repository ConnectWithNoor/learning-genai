import { OpenAI } from "openai";
import { encoding_for_model } from "tiktoken";
import dotenv from "dotenv";

dotenv.config();

// initialize OpenAI
const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_TOKENS = 200; // max token limit for the context to sent to the model.
const FUNCTION_NAMES = {
  // custom function names
  GET_CURRENT_DATE_AND_TIME: "getCurrentDateAndTime",
} as const;
const encoder = encoding_for_model("gpt-3.5-turbo"); // to get the token length of the context

// context is to give GPT some history/context about the conversation, we will be pushing the conversation to this array
const context: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
  {
    role: "system",
    content: "Act like Donald Trump",
  },
];

// a function to get the current date and time
const getCurrentDateAndTime = () => {
  return new Date().toLocaleString();
};

async function createChat() {
  const updatedContext = alterMessageContext(); // getting the altered context

  const response = await ai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: updatedContext,
    // confuguring the function calling to be used by the model
    tools: [
      {
        type: "function",
        function: {
          name: FUNCTION_NAMES.GET_CURRENT_DATE_AND_TIME, // name of the custom function
          description: "Get the current date and time of any location", // description is important, as it allows the model to understand the function and help it make decision to when to call a function
        },
      },
    ],
    tool_choice: "auto", // this is to allow the model to decide which tool to use, in this case it will decide when to call the function
  });

  context.push(response.choices[0].message); // pushing the response to the context array

  // checking if the model has called the function
  if (response.choices[0].finish_reason === "tool_calls") {
    // checking if our custom date and time function is called by the model
    if (
      response.choices[0].message.tool_calls![0].function.name ===
      FUNCTION_NAMES.GET_CURRENT_DATE_AND_TIME
    ) {
      const functionResponse = getCurrentDateAndTime(); // calling the function
      // pushing the function response to the context with the role tool
      context.push({
        role: "tool",
        content: functionResponse,
        tool_call_id: response.choices[0].message.tool_calls![0].id,
      });

      createChat(); // calling the createChat function again with all the latest context including the function response
    }
  }
  if (response.choices[0].message.content) {
    console.log(`${response.choices[0].message.content}`);
  }
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
      if (context[i].role === "user") {
        // remove only the user message from the context
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
