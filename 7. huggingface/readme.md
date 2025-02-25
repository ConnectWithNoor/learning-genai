# Huggingface

### In this Repo:

- We will get the open source models from the huggingface library
  - embedding (featureExtraction)
  - translation
  - translation with parameters
  - textToSpeech
  - question Answering
  - Text to image generation
- and use them for our projects using:
  - Huggingface APIs
  - By downloading models locally (APIs can be slow, to best way is to self hosted server)

#### 1.1 What is Huggingface?

- Huggingface is an opensource platform that provides a large Transformer library of pre-trained models for LLMs, Computer Vision, Audio models, Image models and more.

- The models are open source so they don't belong to any company (OpenAI, Google). Hence, a better choice where privacy and taking control in your hand is a priority.

- Hugging face also provides a platform to train your own models using datasets and share them with the community.

- It also has spaces where apps made by the community can be shared.

- Last but not the least, it also provides a platform to deploy your models.

#### 1.2 HuggingFace JS Library

- https://huggingface.co/docs/huggingface.js/en/index
- https://huggingface.co/docs/huggingface.js/en/index#huggingfaceinference-examples

#### 1.3 How to run Huggingface models using APIs?

- checkout the index.ts file inside the src directory. The code is itself explanatory.

- Use have to add following code in your files:

  ```
      // add in package.json
      "type": "commonjs", // or just remove this

    // replace in package.json
      "start": "node -r ts-node/register --env-file=.env src/transformer.ts"

    // add in tsconfig.json
      "module": "commonjs",
  ```

#### 1.4 How to run Huggingface models locally?

- https://huggingface.co/docs/transformers.js/index

- Checkout the transformer.ts file inside the src directory. The code is itself explanatory.

- Note, not all models supports downloading to local. models compatible with ONNX can be locally run. Check the documentation of each model for more info.

- @xenova/transformers libraty is required. check above doc for more info
- the @xenova/transformers packages needs the following modification in the following files:

  ```
    // add in package.json
      "type": "module",

    // replace in package.json
      "start": "node --loader ts-node/esm --env-file=.env src/transformer.ts"

    // add in tsconfig.json
      "module": "NodeNext",

  ```

### Imporatnt resources:

- https://www.datacamp.com/tutorial/what-is-hugging-face
- https://huggingface.co/models?sort=trending
- https://huggingface.co/datasets
