import { OpenAIApi, Configuration } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler (req, res) {
  try {
    if (req.body.prompt !== undefined) {
      const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: req.body.prompt,
      });
  
      res.status(200).json(completion.data);
    } else {
      res.status(400).json({ text: "No prompt provided." });
    }
  } catch (error) {
    res.status(500).json(error)
  }
};