import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
export default async function handler (req, res) {
  try {
    if (req.body.artists) {
      console.log(`These are my favourite artists: ${req.body.artists.join(', ')}. I want you to tell me another 5 unique artists that i would like.`)
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant designed to output JSON called suggestions.",
          },
          { role: "user", content: `These are my favourite artists: ${req.body.artists.join(', ')}. Using my favourite artists, I want you to tell me another 5 artists that i would like to hear. Also provide a link to each artist spotify account` },
        ],
        model: "gpt-3.5-turbo-1106",
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0].message.content)
  
      res.status(200).json(result);
    } else {
      res.status(400).json({ text: "No prompt provided." });
    }
  } catch (error) {
    res.status(500).json(error)
  }
};