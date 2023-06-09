import { Notice } from "obsidian";
import { Completer, Model, Prompt } from "../../complete";
import {
	SettingsUI as ProviderSettingsUI,
	Settings as ProviderSettings,
	parse_settings as parse_provider_settings,
} from "./provider_settings";
import {
	SettingsUI as ModelSettingsUI,
	parse_settings as parse_model_settings,
	Settings as ModelSettings,
} from "./model_settings";
import { Configuration, OpenAIApi } from "openai";
import Mustache from "mustache";

export default class ChatGPT implements Model {
	id: string;
	name: string;
	description: string;
	rate_limit_notice: Notice | null = null;
	rate_limit_notice_timeout: number | null = null;
	Settings = ModelSettingsUI;

	provider_settings: ProviderSettings;

	constructor(provider_settings: string) {
		this.id = "gpt-3.5-turbo";
		this.name = "GPT 3.5 Turbo";
		this.description = "OpenAI's ChatGPT model";
		this.provider_settings = parse_provider_settings(provider_settings);
	}

	async prepare(prompt: Prompt, settings: ModelSettings): Promise<Prompt> {
		// I'm taking the easy way out here and just truncating the prompt
		// Do I really have a choice? I can't even count the tokens - the tokenizer
		// is not available for javascript, apart from through a weird wasm trick
		// TODO: make this work properly, with context from other notes

		return {
			prefix: prompt.prefix.slice(-(settings.prompt_length || 6000)),
			suffix: prompt.suffix.slice(0, settings.prompt_length || 6000),
		};
	}

	async complete(prompt: Prompt, settings: string): Promise<string> {
		const model_settings = parse_model_settings(settings);

		const config = new Configuration({
			apiKey: this.provider_settings.api_key,
		});
		const api = new OpenAIApi(config);

		try {
			const response = await api.createChatCompletion({
				messages: [
					{
						role: "system",
						content: model_settings.system_prompt,
					},
					{
						role: "user",
						content: Mustache.render(
							model_settings.user_prompt,
							await this.prepare(prompt, model_settings)
						),
					},
				],
				model: this.id,
				max_tokens: 64,
				presence_penalty: model_settings.presence_penalty,
				frequency_penalty: model_settings.frequency_penalty,
				top_p: model_settings.top_p,
				temperature: model_settings.temperature,
			});

			if (response.status !== 200) {
				throw new Error(
					`OpenAI API returned status ${response.status}`
				);
			}

			const completion = response.data.choices[0].message?.content || "";

			return this.interpret(prompt, completion);
		} catch (e) {
			if (e.response?.status === 429) {
				if (this.rate_limit_notice) {
					window.clearTimeout(this.rate_limit_notice_timeout!);
					this.rate_limit_notice_timeout = window.setTimeout(() => {
						this.rate_limit_notice?.hide();
						this.rate_limit_notice = null;
						this.rate_limit_notice_timeout = null;
					}, 5000);
				} else {
					this.rate_limit_notice = new Notice(
						'Rate limit exceeded. Check the "Rate limits" section in the plugin settings for more information.',
						250000
					);
					this.rate_limit_notice_timeout = window.setTimeout(() => {
						this.rate_limit_notice?.hide();
						this.rate_limit_notice = null;
						this.rate_limit_notice_timeout = null;
					}, 5000);
				}
				throw new Error();
			} else if (e.response?.status === 401) {
				const notice: any = new Notice("", 5000);
				const notice_element = notice.noticeEl as HTMLElement;
				notice_element.createEl("span", {
					text: "OpenAI API key is invalid. Please double-check your ",
				});
				notice_element.createEl("a", {
					text: "API key",
					href: "https://platform.openai.com/account/api-keys",
				});
				notice_element.createEl("span", {
					text: "in the plugin settings.",
				});
				throw new Error();
			} else {
				throw e;
			}
		}
	}

	interpret(prompt: Prompt, completion: string) {
		// Since this is ChatGPT, we can do a bit of interpretation to make the
		// completion fit better.

		if (
			!completion.startsWith(" ") &&
			!completion.startsWith("\n") &&
			!prompt.prefix.endsWith(" ") &&
			!prompt.prefix.endsWith("\n")
		) {
			completion = " " + completion;
		}

		return completion;
	}
}

export class ChatGPTComplete implements Completer {
	id: string = "openai-chatgpt";
	name: string = "OpenAI ChatGPT";
	description: string = "OpenAI's ChatGPT model";

	async get_models(settings: string) {
		return [new ChatGPT(settings)];
	}

	Settings = ProviderSettingsUI;
}
