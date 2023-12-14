import React from "react";
import { Notice } from "obsidian";
import { Completer, Model, Prompt } from "../../complete";
import available_models from "./models.json";
import {
	SettingsUI as ProviderSettingsUI,
	Settings,
	parse_settings,
} from "./provider_settings";
import OpenAI from "openai";
import {
  SettingsUI as ModelSettingsUI,
  parse_settings as parse_model_settings,
  Settings as settings,
} from "./model_settings";
import { z } from "zod";

export const model_settings_schema = z.object({
	context_length: z.number().int().positive(),
});
export type ModelSettings = z.infer<typeof model_settings_schema>;

export default class OpenAIModel implements Model {
	id: string;
	name: string;
	description: string;
	rate_limit_notice: Notice | null = null;
	rate_limit_notice_timeout: number | null = null;

	provider_settings: Settings;
	Settings = ModelSettingsUI;

	constructor(
		id: string,
		name: string,
		description: string,
		provider_settings: string
	) {
		this.id = id;
		this.name = name;
		this.description = description;
		this.provider_settings = parse_settings(provider_settings);
	}

	async complete(prompt: Prompt, settings: string): Promise<string> {
		const parsed_settings = parse_model_settings(settings);
		const api = new OpenAI({
			apiKey: this.provider_settings.api_key,
			dangerouslyAllowBrowser: true,
		});

		try {
			const response = await api.completions.create({
				model: this.id,
				prompt: prompt.prefix.slice(-(parsed_settings.context_length || 6000)),
				max_tokens: 64,
			});

			return response.choices[0].text || "";
		} catch (e) {
			this.parse_api_error(e);
			throw e;
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
				'Rate limit exceeded. Check the "Rate limits" section in the plugin settings for more information.',
				250000
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
			text: "OpenAI API key is invalid. Please double-check your ",
		});
		notice_element.createEl("a", {
			text: "API key",
			href: "https://platform.openai.com/account/api-keys",
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
}

export class OpenAIComplete implements Completer {
	id: string = "openai";
	name: string = "OpenAI GPT3";
	description: string = "OpenAI's GPT3 API";

	async get_models(settings: string) {
		return available_models.map(
			(model) =>
				new OpenAIModel(
					model.id,
					model.name,
					model.description,
					settings
				)
		);
	}

	Settings = ProviderSettingsUI;
}
