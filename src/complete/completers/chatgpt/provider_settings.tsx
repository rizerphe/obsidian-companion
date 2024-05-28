import * as React from "react";
import SettingsItem from "../../../components/SettingsItem";
import { z } from "zod";

export const settings_schema = z.object({
	api_key: z.string(),
	base_url: z.string(),
});

export type Settings = z.infer<typeof settings_schema>;

const default_settings: Settings = {
	api_key: "",
	base_url: "",
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
					value={parsed_settings.api_key}
					onChange={(e) =>
						saveSettings(JSON.stringify({ ...parsed_settings, api_key: e.target.value }))
					}
				/>
			</SettingsItem>

			<SettingsItem
				name="Base URL"
				description={
					<>
						Your OpenAI Base URL
					</>
				}
			>
				<input
					type="text"
					value={parsed_settings.base_url}
					onChange={(e) =>
						saveSettings(JSON.stringify({ ...parsed_settings, base_url: e.target.value }))
					}
				/>
			</SettingsItem>
		</>

	);
}
