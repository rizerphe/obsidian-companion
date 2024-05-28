import { requestUrl } from "obsidian";
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
import Mustache from "mustache";
import Groq from "groq-sdk";
import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

export default class GroqModel implements Model {
	id: string;
	name: string;
	description: string;
	rate_limit_notice: Notice | null = null;
	rate_limit_notice_timeout: number | null = null;
	Settings = ModelSettingsUI;
	groq: Groq;

	provider_settings: ProviderSettings;

	cancel_generations: (() => void)[];

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
		this.cancel_generations = [];

		this.groq = new Groq({
			apiKey: this.provider_settings.api_key,
			dangerouslyAllowBrowser: true,
		});
	}

	async prepare(
		prompt: Prompt,
		settings: ModelSettings
	): Promise<{
		prefix: string;
		suffix: string;
		last_line: string;
		context: string;
	}> {
		const cropped = {
			prefix: prompt.prefix.slice(-(settings.prompt_length || 6000)),
			suffix: prompt.suffix.slice(0, settings.prompt_length || 6000),
		};
		const last_line = cropped.prefix
			.split("\n")
			.filter((x) => x.length > 0)
			.pop();
		return {
			...cropped,
			last_line: last_line || "",
			context: cropped.prefix
				.split("\n")
				.filter((x) => x !== last_line)
				.join("\n"),
		};
	}

	formulate_system_message(
		settings: ModelSettings
	): ChatCompletionMessageParam[] {
		return settings.system_prompt.length
			? [
					{
						role: "system",
						content: settings.system_prompt,
					},
			  ]
			: [];
	}

	formulate_messages(
		prompt: {
			prefix: string;
			suffix: string;
			last_line: string;
			context: string;
		},
		settings: ModelSettings
	): ChatCompletionMessageParam[] {
		return this.formulate_system_message(settings).concat([
			{
				role: "user",
				content: Mustache.render(settings.user_prompt, {
					...prompt,
					...(settings as any),
				}),
			},
		]);
	}

	async complete(prompt: Prompt, settings: string): Promise<string> {
		const model_settings = parse_model_settings(settings);

		const chatCompletion = await this.groq.chat.completions.create({
			messages: this.formulate_messages(
				await this.prepare(prompt, model_settings),
				model_settings
			),
			model: this.id,
			temperature: model_settings.temperature,
			max_tokens: model_settings.max_tokens,
		});

		return this.interpret(
			prompt,
			chatCompletion.choices[0]?.message?.content || ""
		);
	}

	async *iterate(prompt: Prompt, settings: string): AsyncGenerator<string> {
		const model_settings = parse_model_settings(settings);

		const prompt_data = await this.prepare(
			prompt,
			parse_model_settings(settings)
		);
		const chatCompletion = await this.groq.chat.completions.create({
			messages: this.formulate_messages(prompt_data, model_settings),
			model: this.id,
			temperature: model_settings.temperature,
			max_tokens: model_settings.max_tokens,
			stream: true,
		});

		// This is the anti-pregeneration text yoinked from the Ollama completer;
		// it's not necessary for larger models tbh, but hey it's nice.
		// TODO: integrate into everything on the next rewrite
		let initialized = false;
		let generated = "";
		let started = false;
		for await (const chunk of chatCompletion) {
			let token = chunk.choices[0].delta.content || "";
			generated += token;

			if (prompt_data.last_line.includes(generated)) {
				continue;
			}

			if (!started) {
				for (let i = generated.length - 1; i >= 0; i--) {
					if (prompt_data.last_line.endsWith(generated.slice(0, i))) {
						token = generated.slice(i);
						started = true;
						break;
					}
				}
			}

			if (!token) {
				continue;
			}

			if (!initialized) {
				yield this.interpret(prompt, token);
				initialized = true;
			} else {
				yield token;
			}
		}
	}

	interpret(prompt: Prompt, completion: string) {
		const response_punctuation = " \n.,?!:;";
		const prompt_punctuation = " \n";

		if (
			prompt.prefix.length !== 0 &&
			!prompt_punctuation.includes(
				prompt.prefix[prompt.prefix.length - 1]
			) &&
			!response_punctuation.includes(completion[0])
		) {
			completion = " " + completion;
		}

		return completion;
	}
}

export class GroqComplete implements Completer {
	id: string = "groq";
	name: string = "Groq";
	description: string = "Groq API, for ultra-fast generation";

	async get_models(settings: string) {
		const provider_settings = parse_provider_settings(settings);
		const groq = new Groq({
			apiKey: provider_settings.api_key,
			dangerouslyAllowBrowser: true,
		});
		const models = await groq.models.list();

		return models.data.map((model: any) => {
			return new GroqModel(
				settings,
				model.id,
				`${model.owned_by} ${model.id}`,
				`${model.owned_by} ${model.id}`
			);
		});
	}

	Settings = ProviderSettingsUI;
}
