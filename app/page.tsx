"use client";
import { useChat } from "ai/react";
import { MessageComponent } from "./components/message";
import { PlayIcon } from "lucide-react";
import { extractCodeFromText } from "./lib/code";
import { runCode } from "./actions/sandbox";

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, setMessages } =
    useChat({
      // Fake tool call
      onFinish: async (message) => {
        const code = extractCodeFromText(message.content);
        if (!code) return;
        const { text, results, logs, error } = await runCode(code);

        // add tool call result to the last message
        message.toolInvocations = [
          {
            state: "result",
            toolCallId: message.id,
            toolName: "runCode",
            args: code,
            result: { text, results, logs, error },
          },
        ];

        setMessages((prev) => {
          // replace last message with the new message
          return [...prev.slice(0, -1), message];
        });
      },
    });

  return (
    <div className="flex flex-col min-h-screen max-h-screen">
      <div className="flex-1 overflow-y-auto">
        {messages.map((m) => (
          <MessageComponent key={m.id} message={m} />
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex mb-4 border border-1 border-orange-500 rounded-md w-full max-w-2xl mx-auto"
      >
        <input
          autoFocus
          required
          className="w-full p-2 outline-none rounded-md"
          value={input}
          placeholder="Enter your prompt..."
          onChange={handleInputChange}
        />
        <button type="submit" className="p-2 bg-orange-500 text-white">
          <PlayIcon />
        </button>
      </form>
    </div>
  );
}
