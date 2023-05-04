import * as React from "react";
import SettingsItem from "../../../components/SettingsItem";

export interface Settings {
	api_key: string;
}

export const parse_settings = (data: string | null): Settings => {
	if (data === null) {
		return { api_key: "" };
	}
	try {
		const settings = JSON.parse(data);
		if (typeof settings.api_key !== "string") {
			return { api_key: "" };
		}
		return settings;
	} catch (e) {
		return { api_key: "" };
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
					Your OpenAI{" "}
					<a href="https://platform.openai.com/account/api-keys">
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
