"use client";

import { RepoBanner } from "@/components/repo-banner";
import { useChat } from "ai/react";
import { MessageComponent } from "@/components/message";
import { FileText, PlayIcon, PlusIcon, X } from "lucide-react";
import { extractCodeFromText } from "@/lib/code";
import Logo from "@/components/logo";
import { useEffect, useState, useRef } from "react";
import modelsList from "@/lib/models.json";
import { LLMModelConfig } from "@/lib/model";
import { LLMPicker } from "@/components/llm-picker";
import { LLMSettings } from "@/components/llm-settings";
import { useLocalStorage } from "usehooks-ts";
import { toUploadableFile } from "@/lib/utils";
import { createClient } from '@supabase/supabase-js'
import { Avatar } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Image from 'next/image';

// Add interface for Player type
interface Player {
  full_name: string;
  gsis_id: string;
  headshot_url: string;
}

interface PlayerData extends Player {
  season: number;
}

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const exampleMessages = [
    "Show me a chart of the Patrick Mahomes's passing yards in 2024",
    "Show me a plot of Jayden Daniel's Rushing EPA per game in 2024",
    "What was CeeDee Lamb's average depth of target in 2024?",
  ];

  const [isLoading, setIsLoading] = useState(false);
  const [languageModel, setLanguageModel] = useLocalStorage<LLMModelConfig>(
    "languageModel",
    {
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    }
  );

  const currentModel = modelsList.models.find(
    (model) => model.id === languageModel.model
  );

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  function handleLanguageModelChange(e: LLMModelConfig) {
    setLanguageModel({ ...languageModel, ...e });
  }

  const {
    messages,
    input,
    handleInputChange: handleChatInputChange,
    handleSubmit,
    setMessages,
    setInput,
  } = useChat({
    // Fake tool call
    onFinish: async (message) => {
      const code = extractCodeFromText(message.content);
      if (code) {
        const res = await fetch("/api/sandbox", {
          method: "POST",
          body: JSON.stringify({
            code,
            files: await Promise.all(files.map((f) => toUploadableFile(f))),
          }),
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

        console.log("Result:", result);
        setFiles([]);
        setMessages((prev) => {
          // replace last message with the new message
          return [...prev.slice(0, -1), message];
        });
      }

      setIsLoading(false);
    },
  });

  useEffect(() => {
    const messagesElement = document.getElementById("messages");
    if (messagesElement) {
      messagesElement.scrollTop = messagesElement.scrollHeight;
    }
  }, [messages]);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
  }

  function handleFileRemove(file: File) {
    setFiles((prev) => prev.filter((f) => f !== file));
  }

  async function customSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentModel) throw Error("No model is selected.");
    setIsLoading(true);
    handleSubmit(e, {
      data: {
        files: await Promise.all(
          files.map((f) => toUploadableFile(f, { cutOff: 5 }))
        ),
        model: currentModel,
        config: languageModel,
      },
    });
  }

  const handlePlayerSearch = async (query: string) => {
    const { data, error } = await supabase
      .rpc('search_players', { 
        search_term: query
      });

    if (data) {
      // Filter to keep only the latest season for each player
      const uniquePlayers = data
        .reduce((acc: Map<string, PlayerData>, current: PlayerData) => {
          const existingPlayer = acc.get(current.gsis_id);
          if (!existingPlayer || existingPlayer.season < current.season) {
            acc.set(current.gsis_id, current);
          }
          return acc;
        }, new Map())
        .values();

      // Convert to array, take first 5
      setSearchResults(Array.from<PlayerData>(uniquePlayers)
        .slice(0, 5)
        .map(({ full_name, gsis_id, headshot_url }) => ({
          full_name,
          gsis_id,
          headshot_url
        })));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart || 0;
    setCursorPosition(position);

    const lastAtSymbol = value.lastIndexOf('@', position);
    if (lastAtSymbol !== -1) {
      const searchQuery = value.slice(lastAtSymbol + 1, position);
      if (searchQuery.length >= 1) {
        setShowPlayerSearch(true);
        handlePlayerSearch(searchQuery);
      } else {
        setShowPlayerSearch(false);
      }
    } else {
      setShowPlayerSearch(false);
    }

    handleChatInputChange(e);
  };

  // Add this function to handle the text highlighting
  const getHighlightedText = () => {
    if (!input) return null;
    
    const lastAtSymbol = input.lastIndexOf('@', cursorPosition);
    if (lastAtSymbol === -1) return input;

    const beforeAt = input.slice(0, lastAtSymbol);
    const atSymbol = input.slice(lastAtSymbol, lastAtSymbol + 1);
    const highlightedPart = input.slice(lastAtSymbol + 1, cursorPosition);
    const afterCursor = input.slice(cursorPosition);

    return (
      <>
        {beforeAt}
        {atSymbol}
        <span className="bg-blue-200">{highlightedPart}</span>
        {afterCursor}
      </>
    );
  };

  const handlePlayerSelect = (player: Player) => {
    const beforeAt = input.slice(0, input.lastIndexOf('@', cursorPosition));
    const afterCursor = input.slice(cursorPosition);
    const newValue = `${beforeAt}[${player.full_name}](${player.gsis_id})${afterCursor}`;
    setInput(newValue);
    setShowPlayerSearch(false);
  };

  // Add this function to calculate popover position
  const getPopoverPosition = () => {
    if (!inputRef.current) return { top: 0, left: 0 };
    const rect = inputRef.current.getBoundingClientRect();
    return {
      top: rect.top - 8, // Add some spacing
      left: rect.left
    };
  };

  return (
    <div className="flex flex-col min-h-screen max-h-screen">
      <nav className="flex gap-0.5 justify-between items-center px-4 py-3 top-0 fixed left-0 right-0 bg-white/80 backdrop-blur-sm shadow-sm z-10">
        <div className="flex items-center gap-2 w-full max-w-2xl mx-auto">
          <Logo className="w-6 h-6" />
          <h1 className="text-md font-medium">
            Analyst by{" "}
            <a
              href="https://fantasyplaybook.ai"
              target="_blank"
              className="underline decoration-[rgba(229,123,0,.3)] decoration-2 text-[#ff8800]"
            >
              FantasyPlaybook
            </a>
          </h1>
          {/* <RepoBanner /> */}
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto pt-14" id="messages">
        {messages.map((m) => (
          <MessageComponent key={m.id} message={m} />
        ))}
      </div>

      <div className="mb-4 mx-4">
        <div className="mx-auto w-full max-w-2xl flex flex-col gap-2">
          <div className="flex gap-2 overflow-x-auto">
            {messages.length === 0 && files.length === 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1 pr-4 [mask-image:linear-gradient(to_right,transparent,black_0%,black_95%,transparent)]">
                {exampleMessages.map((msg) => (
                  <button
                    key={msg}
                    className="flex items-center gap-2 p-1.5 border rounded-lg text-gray-800"
                    onClick={() => setInput(msg)}
                  >
                    <span className="text-sm truncate">{msg}</span>
                  </button>
                ))}
              </div>
            )}
            {files.map((file) => (
              <div
                key={file.name}
                className="flex items-center gap-2 p-1.5 border rounded-lg bg-slate-100 text-gray-800"
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => handleFileRemove(file)}
                  className="cursor-pointer"
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-between items-end">
            <div className="flex gap-2">
              <LLMPicker
                models={modelsList.models}
                languageModel={languageModel}
                onLanguageModelChange={handleLanguageModelChange}
              />
              <LLMSettings
                apiKeyConfigurable={!process.env.NEXT_PUBLIC_NO_API_KEY_INPUT}
                baseURLConfigurable={!process.env.NEXT_PUBLIC_NO_BASE_URL_INPUT}
                languageModel={languageModel}
                onLanguageModelChange={handleLanguageModelChange}
              />
            </div>
            {isLoading && (
              <span className="text-xs text-gray-700">Loading…</span>
            )}
          </div>
          <form
            onSubmit={customSubmit}
            className="flex border p-2 border-1.5 border-border rounded-xl overflow-hidden shadow-sm relative gap-2"
          >
            <input
              type="file"
              id="multimodal"
              name="multimodal"
              accept=".txt,.csv,.json,.md,.py"
              multiple={true}
              className="hidden"
              onChange={handleFileInput}
            />
            <button
              type="button"
              className="border p-1.5 rounded-lg hover:bg-slate-200 text-slate-800 flex-shrink-0"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("multimodal")?.click();
              }}
            >
              <PlusIcon className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <div className="relative w-full">
                <input
                  ref={inputRef}
                  autoFocus
                  required
                  className="w-full px-2 outline-none absolute inset-0 bg-transparent"
                  value={input}
                  placeholder="Enter your prompt..."
                  onChange={handleInputChange}
                />
                <div className="w-full px-2 pointer-events-none">
                  {getHighlightedText() || <span className="text-gray-400">Enter your prompt...</span>}
                </div>
              </div>
              {showPlayerSearch && (
                <div 
                  className="fixed w-80 z-[100]" 
                  style={{
                    top: `${getPopoverPosition().top}px`,
                    left: `${getPopoverPosition().left}px`,
                    transform: 'translateY(-100%)'
                  }}
                >
                  <div className="overflow-hidden rounded-md border bg-white text-popover-foreground shadow-md">
                    {searchResults.map((player) => (
                      <button
                        key={player.gsis_id}
                        className="flex items-center gap-2 w-full p-2 hover:bg-accent cursor-pointer"
                        onClick={() => handlePlayerSelect(player)}
                        type="button"
                      >
                        <Avatar className="w-10 h-10 overflow-hidden">
                          <div className="relative w-full h-full">
                            <Image 
                              src={player.headshot_url || '/default-avatar.png'}
                              alt={player.full_name}
                              fill
                              className="object-cover object-[50%_35%]" // Center the face in the avatar
                              unoptimized
                            />
                          </div>
                        </Avatar>
                        <span>{player.full_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              type="submit"
              className="bg-orange-500 text-white p-1.5 rounded-lg hover:bg-orange-500/80 flex-shrink-0"
            >
              <PlayIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
