import React from "react";
import { Completer, Model, Prompt } from "../../complete";
import available_models from "./models.json";
import {
	SettingsUI as ProviderSettingsUI,
	Settings,
	parse_settings,
} from "./provider_settings";
import { Configuration, OpenAIApi } from "openai";
import SettingsItem from "../../../components/SettingsItem";
import { z } from "zod";

export const model_settings_schema = z.object({
	context_length: z.number().int().positive(),
});
export type ModelSettings = z.infer<typeof model_settings_schema>;
const parse_model_settings = (settings: string): ModelSettings => {
	try {
		return model_settings_schema.parse(JSON.parse(settings));
	} catch (e) {
		return {
			context_length: 4000,
		};
	}
};

export default class OpenAIModel implements Model {
	id: string;
	name: string;
	description: string;

	provider_settings: Settings;
	Settings = ({
		settings,
		saveSettings,
	}: {
		settings: string | null;
		saveSettings: (settings: string) => void;
	}) => (
		<SettingsItem
			name="Context length"
			description="In characters, how much context should the model get"
		>
			<input
				type="number"
				value={parse_model_settings(settings || "").context_length}
				onChange={(e) =>
					saveSettings(
						JSON.stringify({
							context_length: parseInt(e.target.value),
						})
					)
				}
			/>
		</SettingsItem>
	);

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
		const config = new Configuration({
			apiKey: this.provider_settings.api_key,
		});
		const api = new OpenAIApi(config);

		const response = await api.createCompletion({
			model: this.id,
			prompt: prompt.prefix.slice(-parsed_settings.context_length),
			max_tokens: 64,
		});

		if (response.status === 401) {
			throw new Error("OpenAI API key is invalid");
		} else if (response.status !== 200) {
			throw new Error(`OpenAI API returned status ${response.status}`);
		}

		return response.data.choices[0].text || "";
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
