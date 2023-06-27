import * as React from "react";
import SettingsItem from "../../../components/SettingsItem";

export interface Settings {
	host_url: string;
}

const default_settings: Settings = {
	host_url: "http://localhost:5000",
};

export const parse_settings = (data: string | null): Settings => {
	if (data === null) {
		return default_settings;
	}
	try {
		const settings = JSON.parse(data);
		if (typeof settings.host_url !== "string") {
			return default_settings;
		}
		return settings;
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
			name="API URL"
			description={
				<>
					Your{" "}
					<a href="https://github.com/oobabooga/text-generation-webui-with-cors">
						oobabooga
					</a>{" "}
					api host URL. Make sure you're running it in text completion
					(not chat) mode.
				</>
			}
		>
			<input
				type="text"
				value={parse_settings(settings).host_url}
				onChange={(e) =>
					saveSettings(JSON.stringify({ host_url: e.target.value }))
				}
			/>
		</SettingsItem>
	);
}
