import * as React from "react";
import { useState } from "react";
import SettingsItem from "../../../components/SettingsItem";

export interface PenaltySettings {
	scale: number;
	applyToWhitespaces?: boolean;
	applyToPunctuations?: boolean;
	applyToNumbers?: boolean;
	applyToStopwords?: boolean;
	applyToEmojis?: boolean;
}

export interface GenerationSettings {
	maxTokens?: number;
	minTokens?: number;
	temperature?: number;
	topP?: number;
	stopSequences?: string[];
	topKReturn?: number;
	frequencyPenalty?: PenaltySettings;
	presencePenalty?: PenaltySettings;
	countPenalty?: PenaltySettings;
}

type KeysOfType<T, V> = keyof {
	[P in keyof T as T[P] extends V ? P : never]: any;
};

export interface Settings {
	api_key: string;

	generation_settings: GenerationSettings;
}

export const parse_settings = (data: string | null): Settings => {
	if (data === null) {
		return { api_key: "", generation_settings: {} };
	}
	try {
		const settings = JSON.parse(data);
		if (typeof settings.api_key !== "string") {
			return { api_key: "", generation_settings: {} };
		}
		return settings;
	} catch (e) {
		return { api_key: "", generation_settings: {} };
	}
};

function GenerationSettingsItem({
	id,
	description,
	settings,
	saveSettings,
	parseFn = parseInt,
}: {
	id: KeysOfType<GenerationSettings, number | undefined>;
	description: string;
	settings: string | null;
	saveSettings: (settings: string) => void;
	parseFn?: (s: string) => number;
}) {
	const parsed_settings = parse_settings(settings);
	return (
		<SettingsItem name={id} description={description}>
			<input
				type="number"
				value={parsed_settings.generation_settings?.[id]}
				onChange={(e) =>
					saveSettings(
						JSON.stringify({
							...parsed_settings,
							generation_settings: isNaN(parseFn(e.target.value))
								? (({ [id]: _, ...rest }) => rest)(
										parsed_settings.generation_settings
								  )
								: {
										...parsed_settings.generation_settings,
										[id]: parseFn(e.target.value),
								  },
						})
					)
				}
			/>
		</SettingsItem>
	);
}

function PenaltySettingsBooleanItem({
	id,
	item,
	description,
	settings,
	saveSettings,
}: {
	id: KeysOfType<GenerationSettings, PenaltySettings | undefined>;
	item: KeysOfType<PenaltySettings, boolean | undefined>;
	description: string;
	settings: string | null;
	saveSettings: (settings: string) => void;
}) {
	const parsed_settings = parse_settings(settings);
	let state = parsed_settings.generation_settings?.[id]?.[item];
	if (typeof state !== "boolean") {
		state = true;
	}
	return (
		<SettingsItem name={item} description={description}>
			<div
				className={"checkbox-container" + (state ? " is-enabled" : "")}
				onClick={(_e) =>
					saveSettings(
						JSON.stringify({
							...parsed_settings,
							generation_settings:
								parsed_settings.generation_settings && {
									...parsed_settings.generation_settings,
									[id]: {
										...parsed_settings
											.generation_settings?.[id],
										[item]: !state,
									},
								},
						})
					)
				}
			/>
		</SettingsItem>
	);
}

function PenaltySettings({
	id,
	default_scale,
	settings,
	saveSettings,
}: {
	id: KeysOfType<GenerationSettings, PenaltySettings | undefined>;
	default_scale: number;
	settings: string | null;
	saveSettings: (settings: string) => void;
}) {
	const [expanded, setExpanded] = useState(false);
	const parsed_settings = parse_settings(settings);
	return (
		<>
			<SettingsItem
				name={
					<span
						className="ai-complete-jurassic-expandable"
						onClick={() => setExpanded(!expanded)}
					>
						<span>{expanded ? "▾" : "▸"}</span>
						<span>{id}</span>
					</span>
				}
			/>
			{expanded && (
				<>
					<SettingsItem
						name="scale"
						description={`Controls the magnitude of the penalty. 1 <= int <= 500. Default: ${default_scale}`}
					>
						<input
							type="number"
							value={
								parsed_settings.generation_settings?.[id]?.scale
							}
							onChange={(e) => {
								saveSettings(
									JSON.stringify({
										...parsed_settings,
										generation_settings:
											typeof parseInt(e.target.value) ===
												"number" &&
											!isNaN(parseInt(e.target.value))
												? {
														...parsed_settings.generation_settings,
														[id]: {
															...parsed_settings
																.generation_settings?.[
																id
															],
															scale: parseInt(
																e.target.value
															),
														},
												  }
												: (({ [id]: _, ...rest }) =>
														rest)(
														parsed_settings.generation_settings
												  ),
									})
								);
							}}
						/>
					</SettingsItem>
					{typeof parsed_settings.generation_settings?.[id]?.scale ===
						"number" && (
						<>
							<PenaltySettingsBooleanItem
								id={id}
								item="applyToWhitespaces"
								description="Apply the penalty to whitespaces and newlines. Optional, default=true"
								settings={settings}
								saveSettings={saveSettings}
							/>
							<PenaltySettingsBooleanItem
								id={id}
								item="applyToPunctuations"
								description="Apply the penalty to punctuations. Optional, default=true"
								settings={settings}
								saveSettings={saveSettings}
							/>
							<PenaltySettingsBooleanItem
								id={id}
								item="applyToNumbers"
								description="Apply the penalty to numbers. Optional, default=true"
								settings={settings}
								saveSettings={saveSettings}
							/>
							<PenaltySettingsBooleanItem
								id={id}
								item="applyToStopwords"
								description="Apply the penalty to stop words. Optional, default=true "
								settings={settings}
								saveSettings={saveSettings}
							/>
							<PenaltySettingsBooleanItem
								id={id}
								item="applyToEmojis"
								description="Exclude emojis from the penalty. Optional, default=true "
								settings={settings}
								saveSettings={saveSettings}
							/>
						</>
					)}
				</>
			)}
		</>
	);
}

export function SettingsUI({
	settings,
	saveSettings,
}: {
	settings: string | null;
	saveSettings: (settings: string) => void;
}) {
	const [expanded, setExpanded] = useState(false);

	return (
		<>
			<SettingsItem
				name="API key"
				description={
					<>
						Your AI21{" "}
						<a href="https://studio.ai21.com/account">API key</a>
					</>
				}
			>
				<input
					type="text"
					value={parse_settings(settings).api_key}
					onChange={(e) =>
						saveSettings(
							JSON.stringify({ api_key: e.target.value })
						)
					}
				/>
			</SettingsItem>
			<SettingsItem
				name={
					<span
						className="ai-complete-jurassic-expandable"
						onClick={() => setExpanded(!expanded)}
					>
						<span>{expanded ? "▾" : "▸"}</span>
						<span>Advanced</span>
					</span>
				}
				description={
					<>
						You can learn more{" "}
						<a href="https://docs.ai21.com/reference/j2-complete-ref">
							here
						</a>
					</>
				}
			/>
			{expanded && (
				<>
					<GenerationSettingsItem
						id="maxTokens"
						description="The maximum number of tokens to generate per result. Optional, default = 16"
						settings={settings}
						saveSettings={saveSettings}
					/>
					<GenerationSettingsItem
						id="minTokens"
						description="The minimum number of tokens to generate per result. Optional, default = 0"
						settings={settings}
						saveSettings={saveSettings}
					/>
					<GenerationSettingsItem
						id="temperature"
						description="Modifies the distribution from which tokens are sampled. Optional, default = 0.7
				Setting temperature to 1.0 samples directly from the model distribution. Lower (higher) values increase the chance of sampling higher (lower) probability tokens. A value of 0 essentially disables sampling and results in greedy decoding, where the most likely token is chosen at every step."
						settings={settings}
						saveSettings={saveSettings}
						parseFn={parseFloat}
					/>
					<GenerationSettingsItem
						id="topP"
						description="Sample tokens from the corresponding top percentile of probability mass. Optional, default = 1
				For example, a value of 0.9 will only consider tokens comprising the top 90% probability mass."
						settings={settings}
						saveSettings={saveSettings}
						parseFn={parseFloat}
					/>
					<PenaltySettings
						id="frequencyPenalty"
						settings={settings}
						saveSettings={saveSettings}
						default_scale={1}
					/>
					<PenaltySettings
						id="presencePenalty"
						settings={settings}
						saveSettings={saveSettings}
						default_scale={0}
					/>
					<PenaltySettings
						id="countPenalty"
						settings={settings}
						saveSettings={saveSettings}
						default_scale={0}
					/>
				</>
			)}
		</>
	);
}
