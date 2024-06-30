import { OpenAI } from "openai";
import { encoding_for_model } from "tiktoken";
import dotenv from "dotenv";

dotenv.config();

// initialize OpenAI
const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_TOKENS = 500; // max token limit for the context to sent to the model.
const FUNCTION_NAMES = {
  // custom function names
  GET_CURRENT_DATE_AND_TIME: "getCurrentDateAndTime",
} as const;
const encoder = encoding_for_model("gpt-3.5-turbo"); // to get the token length of the context

// context is to give GPT some history/context about the conversation, we will be pushing the conversation to this array
const context: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
  {
    role: "system",
    content: `Act like Donald Trump. Don't keep the message empty. Always reply with appropriate responses even when you have to make function callings. For the function calling, you have to follow certain rules:
      
      1. For the Date and Time function: 
        1.1. If the user asks for the location that is a city, state or anything, you are supported to pass the country name as the function argument.
        1.2. The full name of the country should be passed. Ex: Pakistan, United States, United Arab Emirates.
        `,
  },
];

// a function to get the current date and time of any location
const getCurrentDateAndTime = (location: string) => {
  switch (location.toLowerCase().trim()) {
    case "pakistan":
      return new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });
    case "india":
      return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    case "united states":
      return new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
      });
    default:
      return new Date().toLocaleString();
  }
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

          // to add the parameters for the function,
          parameters: {
            type: "object",
            properties: {
              // name of parameter that is to pass along with it's details
              location: {
                type: "string",
                description: "The location to get the current date and time",
              },
            },
            required: ["location"], // required parameter
          },
        },
      },
    ],
    tool_choice: "auto", // this is to allow the model to decide which tool to use, in this case it will decide when to call the function
  });

  context.push(response.choices[0].message); // pushing the response to the context array

  // checking if the model has request a function call.
  if (response.choices[0].finish_reason === "tool_calls") {
    // to handle multiple function calling we have to check for the tool_calls array in the response and loop over it to cover up each function call.
    // this is also ideal to handle single multiple function calls as well since the tool_calls is always an array.
    response.choices[0].message.tool_calls?.forEach(async (tool) => {
      // checking if our custom date and time function is called by the model
      if (tool.function.name === FUNCTION_NAMES.GET_CURRENT_DATE_AND_TIME) {
        const argumentRaw = tool.function.arguments; // getting the raw arguments from the model.
        const parsedArguments = JSON.parse(argumentRaw); // parsing the arguments
        const functionResponse = await getCurrentDateAndTime(
          parsedArguments.location // calling the function
        );

        // pushing the function response to the context with the role tool
        context.push({
          role: "tool",
          content: functionResponse,
          tool_call_id: tool.id,
        });
      }
    });

    createChat(); // calling the createChat function again with all the latest context including the function response
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
