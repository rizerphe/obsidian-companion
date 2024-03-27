import React from "react";
import { z } from "zod";
import SettingsItem from "../../../components/SettingsItem";

export const settings_schema = z.object({
	api_key: z.string(),
});

export type Settings = z.infer<typeof settings_schema>;

const default_settings: Settings = {
	api_key: "",
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
	return (
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
				value={parse_settings(settings).api_key}
				onChange={(e) =>
					saveSettings(JSON.stringify({ api_key: e.target.value }))
				}
			/>
		</SettingsItem>
	);
}
