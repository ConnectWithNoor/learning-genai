import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();

const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const main = async () => {
  // define a prompt
  const prompt =
    "I need to start resistance training. Can you create a 7 day workout plan for me to ease into it. Limit it in 100 words or less";

  // calling the chat completion endpoint
  const completion = await ai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-3.5-turbo",
  });

  // print the response
  console.log(completion.choices[0].message.content);
};

main();
