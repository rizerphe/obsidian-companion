import React from "react";
import { Completer, Model, Prompt } from "../../complete";
import {
	SettingsUI as ProviderSettingsUI,
	Settings,
	parse_settings,
} from "./provider_settings";
import SettingsItem from "../../../components/SettingsItem";
import { z } from "zod";

export const model_settings_schema = z.object({
	context_length: z.number().int().nonnegative(),
	max_new_tokens: z.number().int().nonnegative().optional(),
	temperature: z.number().nonnegative().optional(),
	top_p: z.number().nonnegative().optional(),
	typical_p: z.number().nonnegative().optional(),
	top_k: z.number().int().nonnegative().optional(),
	min_length: z.number().int().nonnegative().optional(),
	penalty_alpha: z.number().nonnegative().optional(),
	repetition_penalty: z.number().nonnegative().optional(),
	length_penalty: z.number().nonnegative().optional(),
	no_repeat_ngram_size: z.number().int().nonnegative().optional(),
});

const default_model_settings: ModelSettings = {
	context_length: 4000,
	max_new_tokens: 120,
	temperature: 0.3,
	top_p: 1,
	typical_p: 1,
	top_k: 0,
	min_length: 0,
	penalty_alpha: 0,
	repetition_penalty: 1.18,
	length_penalty: 1,
	no_repeat_ngram_size: 0,
};
const model_settings_fields: {
	name: string;
	description: string;
	field_name: keyof ModelSettings;
}[] = [
	{
		name: "Context length",
		description: "In characters, how much context should the model get",
		field_name: "context_length",
	},
	{
		name: "Max new tokens",
		description: "In tokens, how many tokens should the model generate",
		field_name: "max_new_tokens",
	},
	{
		name: "Temperature",
		description: "How creative should the model be",
		field_name: "temperature",
	},
	{
		name: "Top p",
		description: "What percentage of tokens should be considered",
		field_name: "top_p",
	},
	{
		name: "Typical p",
		description: "Cumulative probability of considered tokens",
		field_name: "typical_p",
	},
	{
		name: "Top k",
		description: "How many tokens should be considered (0 = all)",
		field_name: "top_k",
	},
	{
		name: "Min length",
		description: "Minimum length of generated text (in tokens)",
		field_name: "min_length",
	},
	{
		name: "Penalty alpha",
		description: "Penalty alpha",
		field_name: "penalty_alpha",
	},
	{
		name: "Repetition penalty",
		description: "How much should the model avoid repeating itself",
		field_name: "repetition_penalty",
	},
	{
		name: "Length penalty",
		description: "How much should the model avoid short outputs",
		field_name: "length_penalty",
	},
	{
		name: "No repeat ngram size",
		description: "How long are the sequences that should be kept unique",
		field_name: "no_repeat_ngram_size",
	},
];

export type ModelSettings = z.infer<typeof model_settings_schema>;
const parse_model_settings = (settings: string): ModelSettings => {
	try {
		return model_settings_schema.parse(JSON.parse(settings));
	} catch (e) {
		return { context_length: 4000 };
	}
};

const model_list_response_schema = z.object({
	result: z.array(z.string()),
});

const model_response_schema = z.object({
	result: z.optional(z.string()),
});

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
	}) => {
		const parsed_settings = parse_model_settings(settings || "");
		return (
			<>
				{model_settings_fields.map((property) => (
					<SettingsItem
						name={property.name}
						description={property.description}
					>
						<input
							type="number"
							value={parsed_settings[property.field_name]}
							placeholder={default_model_settings[
								property.field_name
							]?.toString()}
							onChange={(e) =>
								saveSettings(
									JSON.stringify({
										...parsed_settings,
										[property.field_name]: parseFloat(
											e.target.value
										),
									})
								)
							}
						/>
					</SettingsItem>
				))}
			</>
		);
	};

	constructor(id: string, provider_settings: string) {
		this.id = id;
		this.name = id;
		this.description = `Oobabooga ${id} model`;
		this.provider_settings = parse_settings(provider_settings);
	}

	async set_model(): Promise<void> {
		await fetch(`${this.provider_settings.host_url}/api/v1/model`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				action: "load",
				model_name: this.id,
			}),
		}).then((res) => res.json());
	}

	async get_current_model(): Promise<string | undefined> {
		const currently_enabled_model = await fetch(
			`${this.provider_settings.host_url}/api/v1/model`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-cache",
				},
			}
		).then((res) => res.json());

		return model_response_schema.parse(currently_enabled_model).result;
	}

	async assure_correct_model(): Promise<void> {
		const currently_enabled_model = await this.get_current_model();
		if (currently_enabled_model !== this.id) {
			await this.set_model();
		}
	}

	async create_completion(request: any): Promise<any> {
		try {
			await this.assure_correct_model();

			const response = await fetch(
				`${this.provider_settings.host_url}/api/v1/generate`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(request),
				}
			).then((res) => res.json());

			return response;
		} catch (error) {
			throw new Error(`Request failed: ${error.message}`);
		}
	}

	async complete(prompt: Prompt, settings: string): Promise<string> {
		const parsed_settings = parse_model_settings(settings);
		const { context_length, ...model_params } = parsed_settings;

		const response = await this.create_completion({
			...model_params,
			prompt: prompt.prefix.slice(-context_length),
			do_sample: true,
			num_beams: 1,
			early_stopping: false,
			seed: -1,
			add_bos_token: true,
			ban_eos_token: false,
			skip_special_tokens: true,
			stopping_strings: [],
		});

		return response.results[0].text || "";
	}
}

export class OobaboogaComplete implements Completer {
	id: string = "oobabooga";
	name: string = "Oobabooga";
	description: string = "Oobabooga text generation webui";

	async get_models(settings: string) {
		const models = await fetch(
			`${parse_settings(settings).host_url}/api/v1/model`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ action: "list" }),
			}
		).then((res) => res.json());

		return model_list_response_schema
			.parse(models)
			.result.map((model) => new OobaboogaModel(model, settings));
	}

	Settings = ProviderSettingsUI;
}
