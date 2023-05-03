import { Completer, Model, Prompt } from "../../complete";
import available_models from "./models.json";
import {
	SettingsUI as ProviderSettingsUI,
	Settings,
	parse_settings,
} from "./provider_settings";

export default class J2Model implements Model {
	id: string;
	name: string;
	description: string;

	provider_settings: Settings;

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

	async complete(prompt: Prompt): Promise<string> {
		if (this.provider_settings.api_key === "") {
			throw new Error("API Key not set");
		}
		const response = await fetch(
			`https://api.ai21.com/studio/v1/j2-${this.id}/complete`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.provider_settings.api_key}`,
				},
				body: JSON.stringify({
					prompt: prompt.prefix,
					numResults: 1,
					...this.provider_settings.generation_settings,
				}),
			}
		);
		if (!response.ok) {
			throw new Error(
				`Jurassic-j2 API returned ${response.status} ${
					(await response.json()).detail
				}`
			);
		}
		const data = await response.json();
		return data.completions[0].data.text;
	}
}

export class JurassicJ2Complete implements Completer {
	id: string = "jurassic";
	name: string = "AI21 Jurassic";
	description: string = "AI21's Jurassic-j2 models";

	async get_models(settings: string) {
		return available_models.map(
			(model) =>
				new J2Model(model.id, model.name, model.description, settings)
		);
	}

	Settings = ProviderSettingsUI;
}
