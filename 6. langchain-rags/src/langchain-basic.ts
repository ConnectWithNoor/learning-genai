import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate, ChatPromptTemplate } from "@langchain/core/prompts";
import {
  StringOutputParser,
  CommaSeparatedListOutputParser,
  StructuredOutputParser,
} from "@langchain/core/output_parsers";

const openAiModel = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-3.5-turbo",
  temperature: 0.5,
  maxTokens: 900,
});

const langchainOpenAIIntegration = async () => {
  // https://js.langchain.com/v0.2/docs/integrations/chat/openai

  // invoke can take single input

  //   const response = await openAiModel.invoke(
  //     "Hi. Give is the summary of Kal ho na ho?"
  //   );

  // batch can take multiple inputs

  //   const response = await openAiModel.batch([
  //     "Hi. Give is the summary of Kal ho na ho?",
  //     "What is the summary of the movie kabhi Khushi Kabhi ghum?",
  //   ]);

  // stream (real time) output
  const response = await openAiModel.stream(
    "Hi. Give is the summary of Kal ho na ho?"
  );

  for await (const res of response) {
    console.log(res.content);
  }
};

const langchainChatPromptTemplate = async () => {
  // https://js.langchain.com/v0.2/docs/concepts/#prompt-templates

  // template can be created for single prompt
  // const prompt = PromptTemplate.fromTemplate(
  //   `Hi. Give is the summary of {movie}?`
  // );

  // const completePrompt = await prompt.format({ movie: "Kal ho na ho" });

  // template can be created for multiple messages
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are an expert in bollywood movies assistant."],
    ["user", "What is the summary of the movie {movie}?"],
  ]);

  //   const completePrompt = await prompt.format({ movie: "Kal ho na ho" });

  return prompt;
};

const connectModelWithPrompt = async () => {
  const prompt = await langchainChatPromptTemplate();

  const chain = prompt.pipe(openAiModel); // https://js.langchain.com/v0.2/docs/how_to/sequence/

  const response = await chain.invoke({
    movie: "Kal ho na ho",
  });

  console.log(response.content);
};

// to improve the readability of the output from langchain
const outputParsers = async () => {
  // https://js.langchain.com/v0.2/docs/concepts/#output-parsers
  const prompt = await langchainChatPromptTemplate();

  //   const parser = new StringOutputParser(); // by using String Parser, the response is string.
  //   const parser = new CommaSeparatedListOutputParser(); // by using CommaSeparatedListOutputParser, the response is array of strings.

  //   const response = await chain.invoke({
  //     movie: `Kal ho na ho. `,
  //   });

  const parser = StructuredOutputParser.fromNamesAndDescriptions({
    name: "The name of the characters",
    genre: "The genre of the movie",
    year: "The year of release of the movie",
  }); // by using StructuredOutputParser, the response is object.

  const chain = prompt.pipe(openAiModel).pipe(parser);

  const response = await chain.invoke({
    movie: `Kal ho na ho. ${parser.getFormatInstructions()}`,
  });

  console.log(response);
};

outputParsers();
