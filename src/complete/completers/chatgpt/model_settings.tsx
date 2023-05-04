import * as React from "react";
import SettingsItem from "../../../components/SettingsItem";
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
	system_prompt:
		"You are trying to give a long suggestion on how to complete the user's message. Complete in the language of the original message. Write only the completion and nothing else. Do not include the user's text in your message. Only include the completion.",
	user_prompt: "Continue the following:\n\n{{prefix}}",
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
			<SettingsItem name="Rate limits" />
			<p>
				If you're getting rate limit errors, OpenAI doesn't allow you to
				make that many requests. I can't do anything about that. You can
				either{" "}
				<a href="https://platform.openai.com/account/billing/overview">
					upgrade your plan
				</a>{" "}
				or set up a fallback preset. A fallback will be used while the
				plugin waits for the rate limit to reset.
			</p>
			<SettingsItem name="System prompt" />
			<textarea
				className="ai-complete-chatgpt-full-width"
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
				className="ai-complete-chatgpt-full-width"
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
			<SettingsItem name="Top P">
				<input
					type="number"
					value={
						parsed_settings.top_p === undefined
							? ""
							: parsed_settings.top_p
					}
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
			<SettingsItem name="Presence penalty">
				<input
					type="number"
					value={
						parsed_settings.presence_penalty === undefined
							? ""
							: parsed_settings.presence_penalty
					}
					onChange={(e) =>
						saveSettings(
							JSON.stringify({
								...parsed_settings,
								presence_penalty: parseFloat(e.target.value),
							})
						)
					}
				/>
			</SettingsItem>
			<SettingsItem name="Frequency penalty">
				<input
					type="number"
					value={
						parsed_settings.frequency_penalty === undefined
							? ""
							: parsed_settings.frequency_penalty
					}
					onChange={(e) =>
						saveSettings(
							JSON.stringify({
								...parsed_settings,
								frequency_penalty: parseFloat(e.target.value),
							})
						)
					}
				/>
			</SettingsItem>
		</>
	);
}
