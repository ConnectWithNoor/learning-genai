import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

// initialize OpenAI
const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Messages context

const context: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
  {
    role: "system",
    content: `Act like Narendra Modi (The prime minister of India). You are a train reservation assistant helping users to get trains between stations and reserve tickets.
    
    Don't keep the message empty. Always reply with appropriate responses even when you have to make function callings. You have to follow certain rules:
 
     1. Don't take assumptions, always ask for the required information that is missing or ambigious.

     2. For the get trains between stations function: 
        2.1. only take the city names from the user, if user passes, country name, zip name or anything else, ask for the city name.
        2.2. The full name of the city should be passed to the function aurgument. Ex: Karachi, Islamabad, Multan.
        
     3. For the reserve ticket function:
        3.1 If the user asks for the train name, you are supported to pass the train name as the function argument.
        3.2 The full name of the train should be passed. Ex: Green Line Express, Tezgam Express, Khyber Mail.
        3.3 Before reserving the ticket, always ask for the passenger name and CNIC number.
        3.4 You can reserve one seat at the time. 
        3.5 Before making the reservation. A confirmation message should be sent to the user to confirm the reservation with the passager details, train details, date of travel, seat number, source, destination. etc.
        3.6 After the reservation, show the complete reservation details to the user along with all the details.
        `,
  },
];

// custom functions
function getTrainsBetweenStations(_source: string, _destination: string) {
  // mock API call
  const source = _source.trim().toLowerCase();
  const destination = _destination.trim().toLowerCase();
  if (source === "karachi" && destination === "lahore") {
    return ["Green Line Express, Tezgam Express, Khyber Mail"];
  } else if (source === "lahore" && destination === "karachi") {
    return ["Quaid e Azam Express", "Shalimar Express"];
  } else if (source === "multan" && destination === "karachi") {
    return ["Multan Express", "Khyber Mail"];
  } else if (source === "karachi" && destination === "multan") {
    return ["Karachi Express", "Multan Express"];
  } else {
    return ["No train found between the stations"];
  }
}

function reserveTicket(_trainName: string) {
  // mock API call
  const trainName = _trainName.trim().toLowerCase();
  return `Your ticket has been reserved for the train ${trainName}.`;
}

// utils
const FUNCTION_NAMES = {
  // custom function names and their details
  GET_TRAINS_BETWEEN_STATIONS: {
    name: "getTrainsBetweenStations",
    description: "",
    parameters: {
      type: "object",
      properties: {
        source: {
          type: "string",
          description: "The source station name",
        },
        destination: {
          type: "string",
          description: "The destination station name",
        },
      },
      required: ["source", "destination"],
    },
  },
  RESERVE_TICKET: {
    name: "reserveTicket",
    description: "",
    parameters: {
      type: "object",
      properties: {
        trainName: {
          type: "string",
          description: "The name of the train",
        },
      },
      required: ["trainName"],
    },
  },
} as const;

async function createChat() {
  const response = await ai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: context,
    // confuguring the function calling to be used by the model
    tools: [
      {
        type: "function",
        function: {
          name: FUNCTION_NAMES.GET_TRAINS_BETWEEN_STATIONS.name, // name of the custom function
          description: FUNCTION_NAMES.GET_TRAINS_BETWEEN_STATIONS.description, // description is important, as it allows the model to understand the function and help it make decision to when to call a function
          parameters: FUNCTION_NAMES.GET_TRAINS_BETWEEN_STATIONS.parameters,
        },
      },
      {
        type: "function",
        function: {
          name: FUNCTION_NAMES.RESERVE_TICKET.name,
          description: FUNCTION_NAMES.RESERVE_TICKET.description,
          parameters: FUNCTION_NAMES.RESERVE_TICKET.parameters,
        },
      },
    ],
    tool_choice: "auto", // this is to allow the model to decide which tool to use, in this case it will decide when to call the function
  });

  context.push(response.choices[0].message); // pushing the response to the context array

  // if model is asking for a function call
  if (response.choices[0].finish_reason === "tool_calls") {
    // to handle multiple function calling we have to check for the tool_calls array in the response and loop over it to cover up each function call.
    // this is also ideal to handle single multiple function calls as well since the tool_calls is always an array.
    response.choices[0].message.tool_calls?.forEach(async (tool) => {
      let functionResponse: any = "";
      // checking if our custom date and time function is called by the model
      if (
        tool.function.name === FUNCTION_NAMES.GET_TRAINS_BETWEEN_STATIONS.name
      ) {
        const argumentRaw = tool.function.arguments; // getting the raw arguments from the model.
        const parsedArguments = JSON.parse(argumentRaw); // parsing the arguments
        functionResponse = await getTrainsBetweenStations(
          parsedArguments.source,
          parsedArguments.destination // calling the function
        );
      } else if (tool.function.name === FUNCTION_NAMES.RESERVE_TICKET.name) {
        const argumentRaw = tool.function.arguments; // getting the raw arguments from the model.
        const parsedArguments = JSON.parse(argumentRaw); // parsing the arguments
        functionResponse = await reserveTicket(
          parsedArguments.trainName // calling the function
        );
      }

      // pushing the function response to the context with the role tool
      context.push({
        role: "tool",
        content: functionResponse.toString(), // function response can be an array so we just convert it to string, model is smart enough to handle it.
        tool_call_id: tool.id,
      });
    });

    createChat(); // calling the chat again to continue the conversation
  }
  if (response.choices[0].message.content) {
    console.log(`${response.choices[0].message.content}`);
  }
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
