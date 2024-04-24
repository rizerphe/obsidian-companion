import * as React from "react";
import SettingsItem from "../../../components/SettingsItem";
import { z } from "zod";

export const settings_schema = z.object({
	system_prompt: z.string(),
	user_prompt: z.string(),
	temperature: z.number().optional(),
	prompt_length: z.number().optional(),
});

export type Settings = z.infer<typeof settings_schema>;

const default_settings: Settings = {
	system_prompt: "",
	user_prompt:
		"{{#context}}Context:\n\n{{context}}\n\n=================================\n{{/context}}Continue the following paragraph:\n\n{{last_line}}",
};

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
};

export function SettingsUI({
	settings,
	saveSettings,
}: {
	settings: string | null;
	saveSettings: (settings: string) => void;
}) {
	const parsed_settings = parse_settings(settings);

	return (
		<>
			<SettingsItem name="System prompt" />
			<textarea
				className="ai-complete-ollama-full-width"
				value={parsed_settings.system_prompt}
				onChange={(e) =>
					saveSettings(
						JSON.stringify({
							...parsed_settings,
							system_prompt: e.target.value,
						})
					)
				}
			/>
			<SettingsItem name="User prompt" />
			<textarea
				className="ai-complete-ollama-full-width"
				value={parsed_settings.user_prompt}
				onChange={(e) =>
					saveSettings(
						JSON.stringify({
							...parsed_settings,
							user_prompt: e.target.value,
						})
					)
				}
			/>
			<SettingsItem name="Temperature">
				<input
					type="number"
					value={
						parsed_settings.temperature === undefined
							? ""
							: parsed_settings.temperature
					}
					onChange={(e) =>
						saveSettings(
							JSON.stringify({
								...parsed_settings,
								temperature: parseFloat(e.target.value),
							})
						)
					}
				/>
			</SettingsItem>
		</>
	);
}
