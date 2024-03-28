import React from "react";
import { z } from "zod";
import SettingsItem from "../../../components/SettingsItem";

export const settings_schema = z.object({
	system_prompt: z.string(),
	user_prompt: z.string(),
	prompt_length: z.number().optional(),
	temperature: z.number().optional(),
	top_p: z.number().optional(),
	top_k: z.number().optional(),
});

export type Settings = z.infer<typeof settings_schema>;

const default_settings: Settings = {
	system_prompt:
		"You are trying to give a long suggestion on how to complete the user's message. Complete in the language of the original message. Write only the completion and nothing else. Do not include the user's text in your message. Only include the completion.",
	user_prompt: "Continue the following:\n\n{{prefix}}",
	prompt_length: 256,
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
}

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
			<SettingsItem name="Rate limits" />
			<p>
				If you're getting rate limit errors, I can't really help. OpenAI
				doesn't like you using their API too much. You can either{" "}
				<a href="https://platform.openai.com/account/billing/overview">
					upgrade your plan
				</a>{" "}
				or set up a fallback preset. A fallback will be used while the
				plugin waits for the rate limit to reset; scroll down to the
				"Presets" section to set one up.
			</p>
			<SettingsItem name="System prompt" />
			<textarea
				className="ai-complete-full-width"
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
				className="ai-complete-full-width"
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
			<SettingsItem name="Max tokens">
				<input
					type="number"
					value={parsed_settings.prompt_length}
					onChange={(e) =>
						saveSettings(
							JSON.stringify({
								...parsed_settings,
								prompt_length: parseInt(e.target.value),
							})
						)
					}
				/>
			</SettingsItem>
			<SettingsItem name="Temperature">
				<input
					type="number"
					value={parsed_settings.temperature}
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
			<SettingsItem name="Top P">
				<input
					type="number"
					value={parsed_settings.top_p}
					onChange={(e) =>
						saveSettings(
							JSON.stringify({
								...parsed_settings,
								top_p: parseFloat(e.target.value),
							})
						)
					}
				/>
			</SettingsItem>
			<SettingsItem name="Top K">
				<input
					type="number"
					value={parsed_settings.top_k}
					onChange={(e) =>
						saveSettings(
							JSON.stringify({
								...parsed_settings,
								top_K: parseFloat(e.target.value),
							})
						)
					}
				/>
			</SettingsItem>
		</>
	);
}
