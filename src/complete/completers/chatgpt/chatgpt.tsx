import * as React from "react";
import { Completer, Model, Prompt } from "../../complete";
import { SettingsUI as ProviderSettingsUI, Settings as ProviderSettings, parse_settings as parse_provider_settings } from "./provider_settings";
import { SettingsUI as ModelSettingsUI, Settings as ModelSettings, parse_settings as parse_model_settings } from "./model_settings";
import { Configuration, OpenAIApi } from "openai";
import Mustache from "mustache";


export default class ChatGPT implements Model {
    id: string;
    name: string;
    description: string;
    Settings = ModelSettingsUI;

    provider_settings: ProviderSettings;

    constructor(provider_settings: string) {
        this.id = "gpt-3.5-turbo";
        this.name = "GPT 3.5 Turbo";
        this.description = "OpenAI's ChatGPT model";
        this.provider_settings = parse_provider_settings(provider_settings);
    }

    async complete(prompt: Prompt, settings: string): Promise<string> {
        const model_settings = parse_model_settings(settings);

        const config = new Configuration({
            apiKey: this.provider_settings.api_key,
        });
        const api = new OpenAIApi(config);

        const response = await api.createChatCompletion({
            messages: [
                {
                    role: "system",
                    content: model_settings.system_prompt,
                },
                {
                    role: "user",
                    content: Mustache.render(model_settings.user_prompt, prompt),
                },
            ],
            model: this.id,
            max_tokens: 64,
            presence_penalty: model_settings.presence_penalty,
            frequency_penalty: model_settings.frequency_penalty,
            top_p: model_settings.top_p,
            temperature: model_settings.temperature,
        });

        if (response.status === 401) {
            throw new Error("OpenAI API key is invalid");
        } else if (response.status !== 200) {
            throw new Error(`OpenAI API returned status ${response.status}`);
        }

        const completion = response.data.choices[0].message?.content || "";

        return this.interpret(prompt, completion);
    }

    interpret(prompt: Prompt, completion: string) {
        // Since this is ChatGPT, we can do a bit of interpretation to make the
        // completion fit better.

        if (!completion.startsWith(" ") && !completion.startsWith("\n") && !prompt.prefix.endsWith(" ") && !prompt.prefix.endsWith("\n")) {
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
