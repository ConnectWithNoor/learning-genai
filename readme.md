# Building Generative AI project With NodeJs, OpenAI, Langchain, Vector DBs, HuggingFace and TS

**To run Typescript with Nodejs. You have to install following packages**

```
1. npm i -D typescript ts-node @types/node
2. npx tsc --init
3. configure your rootDir and outDir in tsconfig.

// create a start command in package.json
4. "start": "node -r ts-node/register --env-file=.env src/index.ts"
```

### 1 openai-basic

- Directory contains the basic and fundamental concepts of Open AI and Generative AI as well as basic chat application powered by Open AI, where the GPT model is sales and marketing expert and can help you with your queries. The Directory has a `readme.md` file that contains all the important concepts. Also, the code snippets can also be found isnide the directory.

### 2 openai-functions

- Directory contains the explanation of openai function calling capabilities as well the working example of it inside the src directory. The model is given a system prompt to enhance it's knowledge by function calling whenever user asks for time and date.

- Things covered:
  - function calling thoery and coding.
  - sending arguments to the functions. providing system prompt to proceed with accurate arguments.
  - working with multiple/parallel functions callings

### 3 train-reservation-project

- A practical implementation of whatever learnt in above 2 directories. system prompted a model that can check for the available trains between 2 locations as well as make reservation for the passanger.
- Example user prompts:
  ```
     I want to check trains between x and y destination.
     Do we have train between Karachi and Multan?
     and what about karachi to multan to lahore and then back to karachi?
     I want to make the reserveation
     Get me the train that goes from lahore to karachi and make the reservation for passanger Noor Muhammad with CNIC 123132.
  ```
