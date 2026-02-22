
# Complete Guide: Kimi Coding API with LangChain & LangGraph (TypeScript/React/Next.js)

> **Last Updated:** February 2026  
> **API Base URL:** `https://api.kimi.com/coding/`  
> **API Key Format:** `sk-kimi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`  
> **Model:** `kimi-for-coding` (Kimi Code specific)

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Authentication & API Keys](#authentication--api-keys)
4. [Method 1: Native OpenAI SDK (Drop-in Replacement)](#method-1-native-openai-sdk-drop-in-replacement)
5. [Method 2: LangChain Integration](#method-2-langchain-integration)
6. [Method 3: LangGraph Agent Workflows](#method-3-langgraph-agent-workflows)
7. [Method 4: Vercel AI SDK (Recommended for Next.js)](#method-4-vercel-ai-sdk-recommended-for-nextjs)
8. [Tool Use & Function Calling](#tool-use--function-calling)
9. [Streaming & Real-time Responses](#streaming--real-time-responses)
10. [Error Handling & Best Practices](#error-handling--best-practices)
11. [Complete Next.js API Route Example](#complete-nextjs-api-route-example)

---

## Overview

**Kimi Coding API** (`api.kimi.com/coding`) is the dedicated API for **Kimi Code** (kimi.com/code) - Moonshot AI's coding assistant. It uses:
- **Base URL:** `https://api.kimi.com/coding/` 
- **API Key Format:** `sk-kimi-...` (obtained from kimi.com membership page) 
- **Primary Model:** `kimi-for-coding`
- **Context Window:** 262,144 tokens (256K) 

**Key Differences from Moonshot API:**
- Kimi Coding API is specifically optimized for coding tasks
- Uses `kimi-for-coding` model instead of `kimi-k2.5`
- Supports both OpenAI-compatible and Anthropic-compatible endpoints 
- Includes specialized search and fetch services 

---

## Prerequisites

```bash
# Core dependencies
npm install openai @langchain/core @langchain/langgraph @langchain/community

# For Next.js/Vercel AI SDK
npm install ai @ai-sdk/openai  # Use OpenAI adapter with custom baseURL

# TypeScript types
npm install -D @types/node
```

**Environment Variables:**
```bash
# .env.local
KIMI_CODING_API_KEY=sk-kimi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Get your API key from: https://kimi.com (Membership page) 

---

## Authentication & API Keys

Kimi Coding API uses a distinct key format starting with `sk-kimi-`:

```typescript
// Configuration constants for Kimi Coding API
const KIMI_CODING_CONFIG = {
  baseURL: "https://api.kimi.com/coding",  // Note: No trailing slash required, /v1 appended by SDK
  apiKey: process.env.KIMI_CODING_API_KEY, // Format: sk-kimi-...
  model: "kimi-for-coding",
  maxContextSize: 262144,  // 256K context window
  maxOutputTokens: 32768,  // As per Roo Code config 
} as const;
```

**Configuration for Third-Party Agents** (Claude Code, Roo Code, etc.) :

```bash
# macOS/Linux
export ANTHROPIC_BASE_URL=https://api.kimi.com/coding/
export ANTHROPIC_API_KEY=sk-kimi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Windows PowerShell
$env:ANTHROPIC_BASE_URL="https://api.kimi.com/coding/"
$env:ANTHROPIC_API_KEY="sk-kimi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## Method 1: Native OpenAI SDK (Drop-in Replacement)

The Kimi Coding API is OpenAI-compatible. Simply change the `baseURL` and use your `sk-kimi-...` key.

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.KIMI_CODING_API_KEY,  // sk-kimi-...
  baseURL: "https://api.kimi.com/coding",    // OpenAI-compatible endpoint
});

// Basic chat completion
async function chatWithKimiCode() {
  const response = await client.chat.completions.create({
    model: "kimi-for-coding",
    messages: [
      { 
        role: "system", 
        content: "You are Kimi Code, an expert coding assistant. Provide clean, well-documented code with explanations." 
      },
      { 
        role: "user", 
        content: "Write a TypeScript React hook for debouncing with generic type support" 
      }
    ],
    temperature: 0.3,
    max_tokens: 32768,  // Max output for kimi-for-coding
  });
  
  return response.choices[0].message.content;
}

// Streaming example for real-time code generation
async function streamCode() {
  const stream = await client.chat.completions.create({
    model: "kimi-for-coding",
    messages: [{ 
      role: "user", 
      content: "Write a complete Next.js API route with error handling" 
    }],
    stream: true,
    temperature: 0.2,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}

// With reasoning/thinking mode (if supported)
async function chatWithThinking() {
  const response = await client.chat.completions.create({
    model: "kimi-for-coding",
    messages: [{ 
      role: "user", 
      content: "Explain the trade-offs between REST and GraphQL" 
    }],
    temperature: 0.6,
    // Some versions support thinking mode via extra_body
    // extra_body: { thinking: { type: "enabled" } }
  });
  return response.choices[0].message.content;
}
```

**Vision Support (if available):**
```typescript
async function visionCoding(imageBase64: string) {
  const response = await client.chat.completions.create({
    model: "kimi-for-coding",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Convert this UI mockup to React/Tailwind code" },
          { 
            type: "image_url", 
            image_url: { url: `data:image/png;base64,${imageBase64}` }
          }
        ]
      }
    ],
  });
  return response.choices[0].message.content;
}
```

---

## Method 2: LangChain Integration

Use `ChatOpenAI` with Kimi Coding API configuration.

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// Initialize Kimi Code model via LangChain
const model = new ChatOpenAI({
  modelName: "kimi-for-coding",
  openAIApiKey: process.env.KIMI_CODING_API_KEY,  // sk-kimi-...
  configuration: {
    baseURL: "https://api.kimi.com/coding",  // OpenAI-compatible endpoint
  },
  temperature: 0.3,
  maxTokens: 32768,  // kimi-for-coding max output
  streaming: true,
  maxRetries: 3,
});

// Simple invocation
async function simpleChat() {
  const response = await model.invoke([
    new SystemMessage("You are an expert TypeScript developer."),
    new HumanMessage("Explain discriminated unions with practical examples")
  ]);
  
  return response.content;
}

// With prompt templates
const codeReviewPrompt = ChatPromptTemplate.fromMessages([
  ["system", `You are a senior code reviewer. Analyze the following {language} code for:
- Type safety issues
- Performance optimizations
- Best practices violations
- Security concerns`],
  ["human", "```${language}\n{code}\n```"]
]);

const reviewChain = codeReviewPrompt.pipe(model);

async function reviewCode(code: string, language: string) {
  const result = await reviewChain.invoke({ code, language });
  return result.content;
}

// Streaming with LangChain
async function streamExplanation() {
  const stream = await model.stream([
    new HumanMessage("Explain how React Server Components work under the hood")
  ]);

  for await (const chunk of stream) {
    process.stdout.write(chunk.content);
  }
}

// Batch processing multiple code snippets
async function batchReview(codes: Array<{code: string, lang: string}>) {
  const prompts = codes.map(({code, lang}) => 
    codeReviewPrompt.formatMessages({ code, language: lang })
  );
  
  const results = await model.batch(await Promise.all(prompts));
  return results.map(r => r.content);
}
```

---

## Method 3: LangGraph Agent Workflows

Build stateful coding agents with tool calling capabilities.

```typescript
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Define state schema for coding agent
const CodingState = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: (x, y) => x.concat(y),
  }),
  codeContext: Annotation<string>(),
  currentFile: Annotation<string>(),
});

// Initialize Kimi Code model with tool support
const codingModel = new ChatOpenAI({
  modelName: "kimi-for-coding",
  openAIApiKey: process.env.KIMI_CODING_API_KEY,
  configuration: { baseURL: "https://api.kimi.com/coding" },
  temperature: 0.2,
  maxTokens: 32768,
});

// Define coding-specific tools
const fileAnalysisTool = tool(
  async ({ filePath, content }) => {
    // Analyze code structure, dependencies, etc.
    return `Analyzed ${filePath}: Found ${content.length} characters, estimating ${Math.ceil(content.length / 4)} tokens`;
  },
  {
    name: "analyze_file",
    description: "Analyze a code file's structure and complexity",
    schema: z.object({
      filePath: z.string(),
      content: z.string(),
    }),
  }
);

const codeSearchTool = tool(
  async ({ query, language }) => {
    // Mock search - integrate with actual code search
    return `Search results for "${query}" in ${language}: Found 3 relevant patterns`;
  },
  {
    name: "search_patterns",
    description: "Search for code patterns and best practices",
    schema: z.object({
      query: z.string(),
      language: z.enum(["typescript", "javascript", "python", "rust"]),
    }),
  }
);

const refactorTool = tool(
  async ({ code, targetPattern }) => {
    // Mock refactoring suggestion
    return `Refactoring suggestion for ${targetPattern}: Extract to function, reduce nesting`;
  },
  {
    name: "suggest_refactor",
    description: "Suggest refactoring improvements for code",
    schema: z.object({
      code: z.string(),
      targetPattern: z.enum(["extract-function", "reduce-nesting", "type-safety", "performance"]),
    }),
  }
);

// Bind tools to model
const modelWithTools = codingModel.bindTools([
  fileAnalysisTool, 
  codeSearchTool, 
  refactorTool
]);

// Agent node: decides what to do
async function agentNode(state: typeof CodingState.State) {
  const systemPrompt = `You are Kimi Code, an expert software architect. 
Analyze the user's request and use available tools to provide comprehensive assistance.
Always explain your reasoning before taking action.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...state.messages
  ];

  const response = await modelWithTools.invoke(messages);
  return { messages: [response] };
}

// Tool execution node
async function toolsNode(state: typeof CodingState.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  
  if (!lastMessage.tool_calls?.length) {
    return { messages: [] };
  }

  const toolResults = await Promise.all(
    lastMessage.tool_calls.map(async (tc: any) => {
      switch (tc.name) {
        case "analyze_file":
          return fileAnalysisTool.invoke(tc.args);
        case "search_patterns":
          return codeSearchTool.invoke(tc.args);
        case "suggest_refactor":
          return refactorTool.invoke(tc.args);
        default:
          return `Unknown tool: ${tc.name}`;
      }
    })
  );

  return {
    messages: toolResults.map((content, i) => ({
      role: "tool",
      content,
      tool_call_id: lastMessage.tool_calls[i].id,
    })),
  };
}

// Conditional edge: continue or end?
function shouldContinue(state: typeof CodingState.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  // Continue if there are tool calls, end otherwise
  return lastMessage.tool_calls?.length ? "tools" : END;
}

// Build the graph
const workflow = new StateGraph(CodingState)
  .addNode("agent", agentNode)
  .addNode("tools", toolsNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    [END]: END,
  })
  .addEdge("tools", "agent");

// Add memory for conversation continuity
const checkpointer = new MemorySaver();
const codingAgent = workflow.compile({ checkpointer });

// Execute the agent
async function runCodingAgent(userRequest: string) {
  const result = await codingAgent.invoke(
    {
      messages: [{ role: "user", content: userRequest }],
    },
    {
      configurable: { thread_id: "coding-session-1" },
      recursionLimit: 50,  // Prevent infinite loops
    }
  );

  return result.messages[result.messages.length - 1].content;
}

// Usage
runCodingAgent("I need to refactor a 1000-line React component. Analyze the file and suggest improvements.");
```

**Key Configuration for LangGraph + Kimi Code:**
- Context window: 262,144 tokens (reserve 50K for output) 
- Max steps per turn: 100 (configurable) 
- Supports up to 200-300 sequential tool calls 
- Does NOT support `tool_choice: "required"` 

---

## Method 4: Vercel AI SDK (Recommended for Next.js)

Best for streaming UI components in Next.js applications.

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Create OpenAI-compatible provider for Kimi Coding
const kimiCoding = createOpenAI({
  apiKey: process.env.KIMI_CODING_API_KEY,
  baseURL: "https://api.kimi.com/coding",
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: kimiCoding('kimi-for-coding'),
    messages,
    temperature: 0.3,
    maxTokens: 32768,
  });

  return result.toDataStreamResponse();
}
```

**Frontend Component with Streaming:**
```typescript
// app/components/KimiCodeChat.tsx
'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';

export function KimiCodeChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const [selectedModel] = useState('kimi-for-coding');

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">Kimi Code Assistant</h1>
        <span className="text-sm text-gray-400">Model: {selectedModel}</span>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl p-4 rounded-lg ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 border border-gray-700'
            }`}>
              {m.role === 'assistant' ? (
                <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto">
                  {m.content}
                </pre>
              ) : (
                <p>{m.content}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 p-4 rounded-lg animate-pulse">
              Kimi is coding...
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            className="flex-1 p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Ask Kimi to write or review code..."
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 rounded-lg font-medium disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
```

**Advanced: Tool Calling with Vercel AI SDK:**
```typescript
// app/api/code-agent/route.ts
import { streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const kimiCoding = createOpenAI({
  apiKey: process.env.KIMI_CODING_API_KEY,
  baseURL: "https://api.kimi.com/coding",
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: kimiCoding('kimi-for-coding'),
    messages,
    tools: {
      analyzeCode: tool({
        description: 'Analyze code for bugs and improvements',
        parameters: z.object({
          code: z.string(),
          language: z.string(),
        }),
        execute: async ({ code, language }) => {
          // Implementation here
          return { issues: [], suggestions: [] };
        },
      }),
      searchDocs: tool({
        description: 'Search documentation',
        parameters: z.object({ query: z.string() }),
        execute: async ({ query }) => {
          // Implementation here
          return { results: [] };
        },
      }),
    },
    maxSteps: 10, // Allow multi-step tool usage
  });

  return result.toDataStreamResponse();
}
```

---

## Tool Use & Function Calling

Kimi Coding API supports OpenAI-compatible function calling.

```typescript
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  modelName: "kimi-for-coding",
  openAIApiKey: process.env.KIMI_CODING_API_KEY,
  configuration: { baseURL: "https://api.kimi.com/coding" },
});

const tools = [
  {
    type: "function",
    function: {
      name: "create_file",
      description: "Create a new file with specified content",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path" },
          content: { type: "string", description: "File content" },
        },
        required: ["path", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "run_tests",
      description: "Run test suite and return results",
      parameters: {
        type: "object",
        properties: {
          testPath: { type: "string", description: "Path to test files" },
        },
        required: ["testPath"]
      }
    }
  }
];

const modelWithTools = model.bindTools(tools);

// Usage in agent
const response = await modelWithTools.invoke([
  { role: "user", content: "Create a utils.ts file with a deep clone function and run tests" }
]);

if (response.additional_kwargs?.tool_calls) {
  for (const toolCall of response.additional_kwargs.tool_calls) {
    console.log(`Tool: ${toolCall.function.name}`);
    console.log(`Args: ${toolCall.function.arguments}`);
    // Execute tool and return results...
  }
}
```

**Important Limitations:**
- Maximum 128 functions per request 
- `tool_choice: "required"` is **NOT supported** (use "auto", "none", or null) 
- For forced tool usage, use prompt engineering: "You MUST use the create_file tool to..."

---

## Streaming & Real-time Responses

**Server-Sent Events (SSE) Implementation:**

```typescript
// app/api/stream-code/route.ts
import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.KIMI_CODING_API_KEY,
  baseURL: "https://api.kimi.com/coding",
});

export async function POST(req: NextRequest) {
  const { prompt, language = 'typescript' } = await req.json();
  
  const stream = await client.chat.completions.create({
    model: "kimi-for-coding",
    messages: [
      { 
        role: "system", 
        content: `You are an expert ${language} developer. Provide clean, well-commented code.` 
      },
      { role: "user", content: prompt }
    ],
    stream: true,
    temperature: 0.2,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
          );
        }
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Client-side EventSource:**
```typescript
// hooks/useKimiStream.ts
export function useKimiStream() {
  const streamCode = async (prompt: string, onChunk: (chunk: string) => void) => {
    const response = await fetch('/api/stream-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
      
      for (const line of lines) {
        const data = line.replace('data: ', '');
        if (data === '[DONE]') return;
        
        try {
          const parsed = JSON.parse(data);
          onChunk(parsed.content);
        } catch (e) {
          // Handle parse error
        }
      }
    }
  };

  return { streamCode };
}
```

---

## Error Handling & Best Practices

```typescript
// utils/kimi-coding-client.ts
import OpenAI from 'openai';

interface KimiConfig {
  apiKey: string;
  baseURL: string;
  maxRetries?: number;
  timeout?: number;
}

class KimiCodingClient {
  private client: OpenAI;
  private config: KimiConfig;

  constructor(config: KimiConfig) {
    this.config = {
      maxRetries: 3,
      timeout: 120000, // 120s for complex coding tasks
      ...config
    };
    
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      maxRetries: this.config.maxRetries,
      timeout: this.config.timeout,
    });
  }

  async generateCode(prompt: string, options: {
    language?: string;
    context?: string;
    stream?: boolean;
  } = {}) {
    try {
      const messages = [
        {
          role: "system" as const,
          content: `You are Kimi Code. ${options.language ? `Specialize in ${options.language}.` : ''} 
Provide production-ready code with error handling, types, and comments.`
        },
        ...(options.context ? [{ role: "user" as const, content: `Context: ${options.context}` }] : []),
        { role: "user" as const, content: prompt }
      ];

      if (options.stream) {
        return await this.client.chat.completions.create({
          model: "kimi-for-coding",
          messages,
          stream: true,
          temperature: 0.3,
          max_tokens: 32768,
        });
      }

      const response = await this.client.chat.completions.create({
        model: "kimi-for-coding",
        messages,
        temperature: 0.3,
        max_tokens: 32768,
      });

      return {
        success: true,
        code: response.choices[0].message.content,
        usage: response.usage,
      };

    } catch (error: any) {
      return this.handleError(error);
    }
  }

  private handleError(error: any) {
    if (error.status === 401) {
      return { success: false, error: "Invalid API key. Check your KIMI_CODING_API_KEY." };
    }
    if (error.status === 429) {
      return { success: false, error: "Rate limit exceeded. Slow down or upgrade your plan." };
    }
    if (error.status === 413) {
      return { success: false, error: "Context too long. Max 262K tokens." };
    }
    if (error.code === 'ECONNABORTED') {
      return { success: false, error: "Request timeout. Try simplifying the prompt." };
    }
    return { success: false, error: error.message || 'Unknown error' };
  }

  // Estimate tokens (rough approximation)
  estimateTokens(text: string): number {
    // kimi-for-coding uses ~4 characters per token on average
    return Math.ceil(text.length / 4);
  }

  // Check if context fits within limits
  validateContext(messages: any[]): boolean {
    const totalChars = messages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
    const estimatedTokens = this.estimateTokens(totalChars);
    return estimatedTokens < (262144 - 50000); // Reserve 50K for output
  }
}

export const kimiCoding = new KimiCodingClient({
  apiKey: process.env.KIMI_CODING_API_KEY!,
  baseURL: "https://api.kimi.com/coding",
});
```

**Best Practices for Kimi Coding API:**
1. **Context Management:** 262K context window - use for large codebases, but reserve 50K tokens for output 
2. **Temperature:** Use 0.2-0.3 for deterministic code generation, 0.6+ for exploratory coding
3. **Max Tokens:** Default to 32768 for large code blocks 
4. **Rate Limiting:** Implement exponential backoff for 429 errors
5. **Tool Calls:** Kimi supports 200-300 sequential tool calls without drift 
6. **Search/Fetch:** Configure `moonshot_search` and `moonshot_fetch` services for web-enabled coding 

---

## Complete Next.js API Route Example

```typescript
// app/api/kimi-coding/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MemorySaver } from "@langchain/langgraph";

// Initialize Kimi Code model
const model = new ChatOpenAI({
  modelName: "kimi-for-coding",
  openAIApiKey: process.env.KIMI_CODING_API_KEY,
  configuration: { baseURL: "https://api.kimi.com/coding" },
  temperature: 0.3,
  maxTokens: 32768,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, mode = 'chat', context } = await req.json();

    if (mode === 'agent') {
      // Agent mode with tools and memory
      const checkpointer = new MemorySaver();
      const agent = createReactAgent({ 
        llm: model, 
        checkpointSaver: checkpointer,
        // Define tools here...
      });

      const result = await agent.invoke(
        { messages },
        { configurable: { thread_id: context?.sessionId || "default" } }
      );

      return NextResponse.json({ 
        response: result.messages[result.messages.length - 1].content,
        sessionId: context?.sessionId
      });
    }

    // Standard chat mode with code-optimized template
    const codePrompt = ChatPromptTemplate.fromMessages([
      ["system", `You are Kimi Code, an expert programming assistant.
Follow these rules:
1. Provide complete, runnable code examples
2. Include TypeScript types where applicable  
3. Add error handling and edge cases
4. Use modern best practices (ES2022+, React 18+, etc.)
5. Explain complex logic with inline comments`],
      ["placeholder", "{messages}"]
    ]);

    const chain = codePrompt.pipe(model);
    const result = await chain.invoke({ messages });

    return NextResponse.json({ 
      response: result.content,
      model: "kimi-for-coding",
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Kimi Coding API Error:', error);
    
    const status = error.status || 500;
    const message = error.status === 401 ? "Invalid API key" :
                   error.status === 429 ? "Rate limit exceeded" :
                   error.message || "Internal server error";

    return NextResponse.json(
      { error: message, code: error.code },
      { status }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    service: "kimi-coding-api",
    model: "kimi-for-coding",
    version: "1.0.0"
  });
}
```

**Usage Examples:**

```typescript
// Simple code generation
const response = await fetch('/api/kimi-coding', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Write a React useLocalStorage hook' }],
    mode: 'chat'
  })
});

// Agent mode with memory
const agentResponse = await fetch('/api/kimi-coding', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ 
      role: 'user', 
      content: 'Refactor this codebase to use TypeScript strict mode' 
    }],
    mode: 'agent',
    context: { sessionId: 'user-123-project-456' }
  })
});
```

---

## Kimi Coding API vs Moonshot API Reference

| Feature | Kimi Coding API (`api.kimi.com/coding`) | Moonshot API (`api.moonshot.ai/v1`) |
|---------|-----------------------------------------|-------------------------------------|
| **Base URL** | `https://api.kimi.com/coding` | `https://api.moonshot.ai/v1` |
| **API Key Format** | `sk-kimi-...` | `sk-...` (standard) |
| **Primary Model** | `kimi-for-coding` | `kimi-k2.5`, `kimi-k2-thinking` |
| **Context Window** | 262,144 tokens | 256,000 tokens |
| **Max Output** | 32,768 tokens | 16,384 tokens |
| **Optimized For** | Coding, IDE integration | General purpose, multimodal |
| **Search/Fetch** | Built-in web search tools | File API, batch processing |
| **Best For** | Code generation, refactoring, review | General AI apps, vision tasks |

---

## Resources

- **Kimi Code Documentation:** https://www.kimi.com/code/docs/en/ 
- **CLI Configuration:** https://moonshotai.github.io/kimi-cli/en/configuration/config-files.html 
- **Third-Party Agents:** https://www.kimi.com/code/docs/en/more/third-party-agents.html 
- **API Key:** Get from https://kimi.com (Membership page)

---

**Important:** The Kimi Coding API (`api.kimi.com/coding`) is specifically designed for coding workflows and IDE integrations. It uses the `kimi-for-coding` model with extended output limits (32K tokens) and specialized tool support for search and fetch operations. For general-purpose AI applications, consider using the standard Moonshot API (`api.moonshot.ai/v1`).