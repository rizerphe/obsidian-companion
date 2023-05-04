import * as React from "react";
import SettingsItem from "../../../components/SettingsItem";

export interface Settings {
	api_key: string;
	context_length?: number;
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
		<>
			<SettingsItem
				name="API key"
				description={
					<>
						Your{" "}
						<a href="https://goose.ai/dashboard/apikeys">
							goose.ai API key
						</a>
					</>
				}
			>
				<input
					type="text"
					value={parse_settings(settings).api_key}
					onChange={(e) =>
						saveSettings(
							JSON.stringify({
								api_key: e.target.value,
								context_length:
									parse_settings(settings).context_length,
							})
						)
					}
				/>
			</SettingsItem>
			<SettingsItem
				name="Context length"
				description="How much information to give the model (in characters)"
			>
				<input
					type="number"
					value={parse_settings(settings).context_length}
					onChange={(e) =>
						saveSettings(
							JSON.stringify({
								api_key: parse_settings(settings).api_key,
								context_length: parseInt(e.target.value),
							})
						)
					}
				/>
			</SettingsItem>
		</>
	);
}
