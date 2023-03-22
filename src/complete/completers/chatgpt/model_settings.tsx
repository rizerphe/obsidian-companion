import * as React from "react"
import { z } from "zod";


export const settings_schema = z.object({
    system_prompt: z.string(),
    user_prompt: z.string(),
    temperature: z.number().optional(),
    top_p: z.number().optional(),
    presence_penalty: z.number().optional(),
    frequency_penalty: z.number().optional(),
});

export type Settings = z.infer<typeof settings_schema>;

const default_settings: Settings = {
    system_prompt: "You are trying to give a long suggestion on how to complete the user's message. Complete in the language of the original message. Write only the completion and nothing else. Do not include the user's text in your message. Only include the completion.",
    user_prompt: "Continue the following:\n\n{{prefix}}",
}

export const parse_settings = (data: string | null): Settings => {
    if (data == null) {
        return default_settings;
    }
    try {
        const settings: unknown = JSON.parse(data);
        return settings_schema.parse(settings);
    } catch (e) {
        return default_settings;
    }
}

export function SettingsUI({ settings, saveSettings }: { settings: string | null; saveSettings: (settings: string) => void; }) {
    return (
        <div className="chatgpt-settings">
            <span className="category-name">System prompt:</span>
            <textarea value={parse_settings(settings).system_prompt} onChange={(e) => saveSettings(JSON.stringify({ ...parse_settings(settings), system_prompt: e.target.value }))} />
            <span className="category-name">User prompt:</span>
            <textarea value={parse_settings(settings).user_prompt} onChange={(e) => saveSettings(JSON.stringify({ ...parse_settings(settings), user_prompt: e.target.value }))} />
            <span className="category-name">Generation settings:</span>
            <div className="generation-settings">
                <div className="generation-setting">
                    <span>Temperature:</span>
                    <input type="number" value={parse_settings(settings).temperature} onChange={(e) => saveSettings(JSON.stringify({ ...parse_settings(settings), temperature: parseFloat(e.target.value) }))} />
                </div>
                <div className="generation-setting">
                    <span>Top p:</span>
                    <input type="number" value={parse_settings(settings).top_p} onChange={(e) => saveSettings(JSON.stringify({ ...parse_settings(settings), top_p: parseFloat(e.target.value) }))} />
                </div>
                <div className="generation-setting">
                    <span>Presence penalty:</span>
                    <input type="number" value={parse_settings(settings).presence_penalty} onChange={(e) => saveSettings(JSON.stringify({ ...parse_settings(settings), presence_penalty: parseFloat(e.target.value) }))} />
                </div>
                <div className="generation-setting">
                    <span>Frequency penalty:</span>
                    <input type="number" value={parse_settings(settings).frequency_penalty} onChange={(e) => saveSettings(JSON.stringify({ ...parse_settings(settings), frequency_penalty: parseFloat(e.target.value) }))} />
                </div>
            </div>
        </div>
    )
}