import * as React from "react";
import { Completer, Model, Prompt } from "../../complete";
import available_models from "./models.json";
import { SettingsUI as ProviderSettingsUI, Settings, parse_settings } from "./provider_settings";
import { Configuration, OpenAIApi } from "openai";


export default class OpenAIModel implements Model {
    id: string;
    name: string;
    description: string;

    provider_settings: Settings;

    constructor(id: string, name: string, description: string, provider_settings: string) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.provider_settings = parse_settings(provider_settings);
    }

    async complete(prompt: Prompt): Promise<string> {
        const config = new Configuration({
            apiKey: this.provider_settings.api_key,
        });
        const api = new OpenAIApi(config);

        const response = await api.createCompletion({
            model: this.id,
            prompt: prompt.prefix,
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
        return available_models.map((model) => new OpenAIModel(model.id, model.name, model.description, settings));
    }

    Settings = ProviderSettingsUI;
}
