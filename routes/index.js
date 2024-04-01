// REQUIRE dotenv
require("dotenv").config();
var express = require("express");
var router = express.Router();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const create_story_instructions = `Help the user, who has  a kindergarten reading level, make a story.  Your responses should be brief, friendly, and conversational.

**Step 1: **
Prompt the user to  choose what the story will be about:

Ask the user what the theme of the story is. Explain a theme is in a relatable way. Give succinct everyday examples, ie. friendship: a someone does  [specific, generous action] for a friend. Make sure to mention a couple other "themes" as examples, then ask an openended question

**Step 2: **
Prompt the user to choose who the story will be about:

Encourage the user to imagine a character, explain "character", and describe them in any way they want. They could talk about their appearance, their interests, their abilities.Give no more than a couple examples. Remind them that the character can be anyone! End with an open-ended question.

**Step 3: **
Prompt the user to choose where the story will happen:

Encourage the user to to imagine a "setting", explain setting, and encourage them to pick anywhere they like. Give no more than a couple examples. Prompt them to think about what this place is about, and finish with an open ended question.

**Step 4: **
If the user has identified the theme, character, and setting, then it's time to recap.
Given the user's inputs on the theme, character, and setting of their story, provide a structured summary in JSON format. Before the JSON response, you must explicitly say: "These are all great choices! Let's summarize your story." You will make sure each part of the summary is concise, using no more than 15 words.  But each part of the summary should be as informative as possible within that constraint.
Follow the example below:
"These are all great choices! Let's summarize your story.
\`\`\`json
{
  "theme": "Finding the courage to grow up.",
  "character": "Belle, a curious girl who loves to explore.",
  "setting": "A mystical forest full of hidden secrets."
}
\`\`\`"`;

const tell_story_instructions = `Write a decodable story for a child with a kindergarten reading level. A decodable story is made to be especially easy for beginning readers to read aloud. The story should use appropriate word choices for a kindergarten reading level. The story should have a clear setup and climax. The story should be based on the theme, character, and setting which are sent to you. The story should be less than 150 words. Main parts of the story should be separated by newlines. The story should very engaging for a young reader. The story should also have a key point where the character must take action to act out the theme.`;
function format_message(role, content) {
  return {
    role: role,
    content: content,
  };
}

async function get_response(messages) {
  const completion = await openai.chat.completions.create({
    messages: messages,
    model: "gpt-4-1106-preview",
  });
  return completion.choices[0].message.content;
}

// POST /api/create-story-chat
router.post("/create-story-chat", async function (req, res, next) {
  try {
    const { messages } = req.body;
    const instructions_message = format_message(
      "system",
      create_story_instructions
    );
    messages.unshift(instructions_message);
    for (const message of messages) {
      if (!message.role || !message.content) {
        throw new Error("All messages must have a role and content");
      } else if (
        message.role !== "user" &&
        message.role !== "system" &&
        message.role !== "assistant"
      ) {
        throw new Error(
          "Message role must be 'user', 'system', or 'assistant'"
        );
      }
    }

    const response = await get_response(messages);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/tell-story ,this will receive a prompt, format it into a message, create messages with the instructions and prompt, and send it to the OpenAI API to get a response.
router.post("/tell-story", async function (req, res, next) {
  try {
    const { prompt } = req.body;
    // log the prompt
    console.log("prompt", prompt);
    const messages = [
      format_message("system", tell_story_instructions),
      format_message("user", prompt),
    ];
    const response = await get_response(messages);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

module.exports = router;
