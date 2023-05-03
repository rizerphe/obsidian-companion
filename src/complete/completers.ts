import { Completer } from "./complete";
import { OpenAIComplete } from "./completers/openai/openai";
import { ChatGPTComplete } from "./completers/chatgpt/chatgpt";
import { JurassicJ2Complete } from "./completers/ai21/ai21";

export const available: Completer[] = [
	new ChatGPTComplete(),
	new OpenAIComplete(),
	new JurassicJ2Complete(),
];
