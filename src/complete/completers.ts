import { Completer } from "./complete";
import { OpenAIComplete } from "./completers/openai/openai";
import { ChatGPTComplete } from "./completers/chatgpt/chatgpt";

export const available: Completer[] = [
    new ChatGPTComplete(),
    new OpenAIComplete(),
];
