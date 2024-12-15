import { NextApiRequest, NextApiResponse } from "next";

const NODE_URL = process.env.NODE_URL;

interface ChatRequest {
  prompt: string;
  message: string;
  conversationHistory: Array<{
    text: string;
    sender: "user" | "partner";
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log the request method and URL
  console.log("API Request:", req.method, req.url);

  if (req.method !== "POST") {
    console.log("Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Log the request body
    console.log("Request body:", req.body);

    const { prompt, message, conversationHistory } = req.body as ChatRequest;

    // Log the extracted data
    console.log("Extracted data:", {
      prompt,
      message,
      conversationHistoryLength: conversationHistory.length,
    });

    const systemPrompt = `${prompt}
    Important rules:
    1. Always stay in character
    2. Keep responses natural and conversational
    3. Don't mention that you're an AI
    4. Keep responses relatively brief (1-3 sentences)
    5. Don't use emojis or excessive punctuation
    6. Never break character or acknowledge this is a game`;

    const userPrompt = `Previous conversation: ${conversationHistory
      .map((msg) => `${msg.sender}: ${msg.text}`)
      .join("\n")}
      
    User's message: ${message}
      
    Respond naturally in character, keeping the response brief and conversational.`;

    // Log the prompts
    console.log("System Prompt:", systemPrompt);
    console.log("User Prompt:", userPrompt);

    // Log API call details
    console.log("Making API call to:", NODE_URL);
    console.log("API request body:", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const response = await fetch(`${NODE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    // Log the initial response
    console.log("API Response Status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("API Error Response:", error);
      throw new Error(error.message || "Failed to fetch from API");
    }

    const data = await response.json();
    console.log("API Response Data:", data);

    const aiResponse = data.choices[0].message.content.trim();
    console.log("Final AI Response:", aiResponse);

    return res.status(200).json({ response: aiResponse });
  } catch (error) {
    console.error("Detailed Error:", {
      error,
      stack: error instanceof Error ? error.stack : "No stack trace",
      NODE_URL: NODE_URL || "Not set",
    });

    return res.status(500).json({
      error: "Failed to generate response",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}
