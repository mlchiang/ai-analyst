"use client";
import { useChat } from "ai/react";
import { MessageComponent } from "./components/message";
import { PlayIcon } from "lucide-react";
import { extractCodeFromText } from "./lib/code";
import Logo from "./components/logo";

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, setMessages } =
    useChat({
      // Fake tool call
      onFinish: async (message) => {
        const code = extractCodeFromText(message.content);
        if (!code) return;

        const res = await fetch("/api/sandbox", {
          method: "POST",
          body: code,
        });

        const result = await res.json();

        // add tool call result to the last message
        message.toolInvocations = [
          {
            state: "result",
            toolCallId: message.id,
            toolName: "runCode",
            args: code,
            result,
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
      <nav className="flex gap-0.5 justify-between items-center p-4 top-0 fixed left-0 right-0 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-2">
          <Logo className="w-6 h-6" />
          <h1 className="text-md font-medium">
            Analyst by{" "}
            <a
              href="https://e2b.dev"
              target="_blank"
              className="underline decoration-[rgba(229,123,0,.3)] decoration-2 text-[#ff8800]"
            >
              E2B
            </a>
          </h1>
        </div>
        <div className="text-sm text-gray-500">
          Powered by Meta Llama 3.1 405B
        </div>
      </nav>
      <div className="flex-1 overflow-y-auto pt-14">
        {messages.map((m) => (
          <MessageComponent key={m.id} message={m} />
        ))}
      </div>

      <div className="mb-4 mx-4">
        <div className="mx-auto w-full max-w-2xl">
          <form
            onSubmit={handleSubmit}
            className="flex border p-1 border-1.5 border-orange-400 rounded-xl overflow-hidden shadow-md"
          >
            <input
              autoFocus
              required
              className="w-full px-2 outline-none"
              value={input}
              placeholder="Enter your prompt..."
              onChange={handleInputChange}
            />
            <button
              type="submit"
              className="bg-orange-500 text-white p-1.5 rounded-lg hover:bg-orange-500/80"
            >
              <PlayIcon />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
