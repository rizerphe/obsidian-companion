import React from "react";
import { Completer, Model, Prompt } from "../../complete";
import {
	SettingsUI as ProviderSettingsUI,
	Settings,
	parse_settings,
} from "./provider_settings";
import SettingsItem from "../../../components/SettingsItem";
import { z } from "zod";
import axios from 'axios';

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

export default class OobaboogaModel implements Model {
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
	};

	async createCompletion(request: any): Promise<any> {
		try {
			const response = await axios.post('http://localhost:5000/api/v1/generate', request);
			if (response.status === 200) {
			return response.data.results[0].text;
			} else {
			throw new Error(`API returned status ${response.status}`);
			}
		} catch (error) {
			throw new Error(`Request failed: ${error.message}`);
		}
	};

	async complete(prompt: Prompt, settings: string): Promise<string> {
		const parsed_settings = parse_model_settings(settings);

		const response = await this.createCompletion({
			prompt: prompt.prefix.slice(-parsed_settings.context_length),
			max_new_tokens: 120,
			do_sample: true,
			temperature: 1.3,
			top_p: 0.1,
			typical_p: 1,
			repetition_penalty: 1.18,
			top_k: 40,
			min_length: 0,
			no_repeat_ngram_size: 0,
			num_beams: 1,
			penalty_alpha: 0,
			length_penalty: 1,
			early_stopping: false,
			seed: -1,
			add_bos_token: true,
			truncation_length: 2048,
			ban_eos_token: false,
			skip_special_tokens: true,
			stopping_strings: []
		});
		

		if (response.status === 401) {
			throw new Error("API connection refused");
		} else if (response.status !== 200) {
			throw new Error(`API returned status ${response.status}`);
		}

		return response.data.choices[0].text || "";
	}
}

export class OobaboogaComplete implements Completer {
	id: string = "oobabooga";
	name: string = "Oobabooga";
	description: string = "Oobabooga text generation webui";

	async get_models(settings: string) {
		return [new OobaboogaModel(this.id, this.name, this.description, settings)];
	}

	Settings = ProviderSettingsUI;
}
