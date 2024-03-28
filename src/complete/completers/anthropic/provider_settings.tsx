import React from "react";
import { z } from "zod";
import SettingsItem from "../../../components/SettingsItem";

export const settings_schema = z.object({
	api_key: z.string(),
	host_url: z.string().optional(),
});

export type Settings = z.infer<typeof settings_schema>;

const default_settings: Settings = {
	api_key: "",
	host_url: "https://api.anthropic.com",
};

export const parse_settings = (data: string | null): Settings => {
	if (data === null) {
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
			<SettingsItem
				name="API URL"
				description={
					<>
						Your{" "}
						<a href="https://console.anthropic.com/settings/keys">
							Anthropic
						</a>{" "}
						API host URL. Due to CORS, you will need to relay all requests to the Anthropic API.
					</>
				}
			>
				<input
					type="text"
					value={parsed_settings.host_url}
					onChange={(e) =>
						saveSettings(JSON.stringify({ 
							...parsed_settings,
							host_url: e.target.value 
						}))
					}
				/>
			</SettingsItem>
			<SettingsItem
				name="API key"
				description={
					<>
						Your Anthropic{" "}
						<a href="https://console.anthropic.com/settings/keys">
							API key
						</a>
					</>
				}
			>
				<input
					type="text"
					value={parsed_settings.api_key}
					onChange={(e) =>
						saveSettings(JSON.stringify({ 
							...parsed_settings,
							api_key: e.target.value,
						}))
					}
				/>
			</SettingsItem>
		</>
	);
}
