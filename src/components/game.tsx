import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Pause, Play } from "lucide-react";

const AGENTS = [
  {
    name: "Coffee Enthusiast",
    prompt:
      "You are a passionate coffee enthusiast who loves discussing different brewing methods, bean origins, and roasting techniques. You're always excited to share your knowledge and learn from others about coffee. Keep responses conversational and focused on coffee-related topics.",
  },
  {
    name: "Tea Connoisseur",
    prompt:
      "You are a tea connoisseur with deep knowledge of different tea varieties, brewing temperatures, and cultural tea traditions. You're passionate about discussing tea and sometimes playfully debate the merits of tea over coffee. Keep responses conversational and tea-focused.",
  },
] as const;

interface Message {
  text: string;
  sender: "agent1" | "agent2";
}

const AIConversation = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConversing, setIsConversing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generateResponse = async (
    prompt: string,
    message: string,
    previousMessages: Message[]
  ) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          message,
          conversationHistory: previousMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Error getting AI response:", error);
      return null;
    }
  };

  const continueConversation = async () => {
    if (isLoading) return;
    setIsLoading(true);

    const lastMessage = messages[messages.length - 1];
    const isAgent1Turn = lastMessage?.sender === "agent2" || !lastMessage;

    const currentAgent = isAgent1Turn ? AGENTS[0] : AGENTS[1];
    const lastMessageText =
      lastMessage?.text ||
      "Let's discuss beverages. What do you think about coffee versus tea?";

    const response = await generateResponse(
      currentAgent.prompt,
      lastMessageText,
      messages
    );

    if (response) {
      setMessages((prev) => [
        ...prev,
        {
          text: response,
          sender: isAgent1Turn ? "agent1" : "agent2",
        },
      ]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isConversing && !isLoading && messages.length < 10) {
      timeoutId = setTimeout(continueConversation, 2000);
    }

    return () => clearTimeout(timeoutId);
  }, [isConversing, messages, isLoading]);

  const toggleConversation = () => {
    setIsConversing((prev) => !prev);
  };

  const startNewConversation = () => {
    setMessages([]);
    setIsConversing(true);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          AI Conversation: Coffee vs Tea
        </CardTitle>
        <div className="flex justify-center gap-4">
          <div className="text-sm text-center">
            <Bot className="w-4 h-4 inline mr-1" />
            {AGENTS[0].name}
          </div>
          <div className="text-sm text-center">
            <Bot className="w-4 h-4 inline mr-1" />
            {AGENTS[1].name}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96 overflow-y-auto mb-4 p-4 border rounded-lg">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-2 ${
                msg.sender === "agent1" ? "text-right" : "text-left"
              }`}
            >
              <span
                className={`inline-block p-2 rounded-lg ${
                  msg.sender === "agent1"
                    ? "bg-blue-500 text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                {msg.text}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="text-center text-gray-500">Thinking...</div>
          )}
        </div>

        <div className="flex justify-center gap-4">
          <Button onClick={startNewConversation} disabled={isConversing}>
            New Conversation
          </Button>
          <Button
            onClick={toggleConversation}
            variant={isConversing ? "destructive" : "default"}
          >
            {isConversing ? (
              <>
                <Pause className="w-4 h-4 mr-2" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" /> Resume
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIConversation;
