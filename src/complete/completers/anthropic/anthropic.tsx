import { Completer, Model, Prompt } from "../../complete";
import { Notice } from "obsidian";
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
import Anthropic from "@anthropic-ai/sdk";
import Mustache from "mustache";
import ContentBlockDeltaEvent = Anthropic.ContentBlockDeltaEvent;

class AnthropicAI implements Model {
	id: string;
	name: string;
	description: string;
	rate_limit_notice: Notice | null = null;
	rate_limit_notice_timeout: number | null = null;
	Settings  = ModelSettingsUI;

	provider_settings: ProviderSettings;

	constructor(
		provider_settings: string,
		id: string,
		name: string,
		description: string
	) {
		this.id = id;
		this.name = name;
		this.description = description;
		this.provider_settings = parse_provider_settings(provider_settings);
	}


	async prepare(prompt: Prompt, settings: ModelSettings): Promise<Prompt> {
		// See the ChatGPT version of this for details
		// TODO: make this work properly, with context from other notes

		return {
			prefix: prompt.prefix.slice(-(settings.prompt_length || 4096)),
			suffix: prompt.suffix.slice(0, settings.prompt_length || 4096),
		};
	}


	async generate_messages(
		prompt: Prompt,
		model_settings: {
			system_prompt: string;
			user_prompt: string;
		}
	): Promise<{ role: "assistant" | "user"; content: string }[]> {
		return [
			{
				role: "assistant",
				content: model_settings.system_prompt,
			},
			{
				role: "user",
				content: Mustache.render(model_settings.user_prompt, prompt),
			},
		];
	}

	model_parameters(model_settings: ModelSettings): {
		top_p: number | undefined;
		top_k: any;
		temperature: number | undefined
	} {
		return {
			temperature: model_settings.temperature,
			top_p: model_settings.top_p,
			top_k: model_settings.top_k,
		}
	}


	create_rate_limit_notice() {
		if (this.rate_limit_notice) {
			window.clearTimeout(this.rate_limit_notice_timeout!);
			this.rate_limit_notice_timeout = window.setTimeout(() => {
				this.rate_limit_notice?.hide();
				this.rate_limit_notice = null;
				this.rate_limit_notice_timeout = null;
			}, 5000);
		} else {
			this.rate_limit_notice = new Notice(
				"Rate limit exceeded. Please wait a few minutes and try again."
			);
			this.rate_limit_notice_timeout = window.setTimeout(() => {
				this.rate_limit_notice?.hide();
				this.rate_limit_notice = null;
				this.rate_limit_notice_timeout = null;
			}, 5000);
		}
	}

	create_api_key_notice() {
		const notice: any = new Notice("", 5000);
		 const notice_element = notice.noticeEl as HTMLElement;
		notice_element.createEl("span", {
			text: "Anthropic API key is invalid. Please double-check your ",
		});
		notice_element.createEl("a", {
			text: "API key",
			href: "https://console.anthropic.com/settings/keys",
		});
		notice_element.createEl("span", {
			text: " in the plugin settings.",
		});
	}

	parse_api_error(e: { status?: number }) {
		if (e.status === 429) {
			this.create_rate_limit_notice();
			throw new Error();
		} else if (e.status === 401) {
			this.create_api_key_notice();
			throw new Error();
		}
		throw e;
	}

	get_api() {
		return new Anthropic({
			apiKey: this.provider_settings.api_key,
		});
	}

	async complete(prompt: Prompt, settings: string): Promise<string> {
		const model_settings = parse_model_settings(settings);
		const api = this.get_api();

		try {
			const response = await api.messages.create({
				...this.model_parameters(model_settings),
				messages: await this.generate_messages(prompt, model_settings),
				model: this.id,
				max_tokens: 64,
			});

			return response.content[0].text;
		} catch (e) {
			this.parse_api_error(e);
			throw e;
		}
	}

	async *iterate(prompt: Prompt, settings: string): AsyncGenerator<string> {
		const model_settings = parse_model_settings(settings);
		const api = this.get_api();

		try {
			const stream = await api.messages.create({
				...this.model_parameters(model_settings),
				messages: await this.generate_messages(prompt, model_settings),
				model: this.id,
				max_tokens: 64,
				stream: true,
			});

			for await (const response of stream) {
				if (response.type === "content_block_delta") {
					yield response.delta.text;
				}
			}
		} catch (e) {
			this.parse_api_error(e);
			throw e;
		}
	}
}

export class AnthropicComplete implements Completer {
	id: string = "anthropic";
	name: string = "Anthropic AI";
	description: string = "Anthropic's AI language model";

	async get_models(settings: string) {
		return [
			new AnthropicAI(
				settings,
				"claude-3-haiku-20240307",
				"Claude 3 Haiku (recommended)",
				"Fastest and most cost-effective model for Claude 3"
			),
			new AnthropicAI(
				settings,
				"claude-3-sonnet-20240229",
				"Claude 3 Sonnet",
				"Balanced speed and intelligence model for Claude 3"
			),
			new AnthropicAI(
				settings,
				"claude-3-opus-20240229",
				"Claude 3 Opus",
				"Most intelligent model for Claude 3"
			)
		];
	}

	Settings = ProviderSettingsUI;
}
