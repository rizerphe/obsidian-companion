import * as React from "react";
import { Completer, Model } from "../complete/complete";
import { available } from "../complete/completers";
import { useState, useEffect } from "react";
import Companion, { AcceptSettings } from "../main";
import SettingsItem from "../components/SettingsItem";

function Presets({
	plugin,
	setModel,
	setProvider,
	reload_signal,
}: {
	plugin: Companion;
	setModel: (model: string) => void;
	setProvider: (provider: string) => void;
	reload_signal: { reload: boolean };
}) {
	const [name, setName] = useState("");
	const [force_update, setForceUpdate] = useState(0);

	const savePreset = () => {
		if (!name) return;
		plugin.savePreset(name);
		setName("");
	};

	return (
		<>
			<SettingsItem
				name="Presets"
				description="
				Quickly switch between different settings."
			></SettingsItem>
			<>
				{plugin.settings.presets.map((preset) => (
					<SettingsItem key={preset.name} name={preset.name}>
						<div
							className={
								"checkbox-container" +
								(preset.enable_editor_command
									? " is-enabled"
									: "")
							}
							onClick={(_e) => {
								preset.enable_editor_command =
									!preset.enable_editor_command;
								plugin.saveSettings();
								setForceUpdate(force_update + 1);
								reload_signal.reload = true;
							}}
						></div>
						Command
						<button
							onClick={() => {
								plugin.loadPreset(preset.name);
								setProvider(preset.provider);
								setModel(preset.model);
							}}
						>
							Load
						</button>
						<button
							onClick={() => {
								plugin.deletePreset(preset.name);
								setForceUpdate(force_update + 1);
							}}
						>
							Delete
						</button>
					</SettingsItem>
				))}
			</>
			<SettingsItem
				name="Save preset"
				description="Save the current settings as a preset"
			>
				<input
					type="text"
					placeholder="Preset name"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
				<button onClick={savePreset}>Save preset</button>
			</SettingsItem>
		</>
	);
}

function ProviderModelChooser({
	plugin,
	reload_signal,
}: {
	plugin: Companion;
	reload_signal: { reload: boolean };
}) {
	const [provider, _setProvider] = useState<null | Completer>(null);
	const [providerSettings, _setProviderSettings] = useState<null | string>(
		null
	);
	const [available_models, setAvailableModels] = useState<Model[]>([]);
	const [model, _setModel] = useState<null | Model>(null);
	const [modelSettings, _setModelSettings] = useState<null | string>(null);

	useEffect(() => {
		const candidates = available.filter(
			(provider) => provider.id === plugin.settings.provider
		);
		_setProvider(candidates.length > 0 ? candidates[0] : available[0]);
		_setProviderSettings(
			plugin.settings.provider_settings[plugin.settings.provider]
				?.settings
		);
	}, [plugin.settings.provider]);

	useEffect(() => {
		const fetch_model = async () => {
			if (!provider) return;
			setAvailableModels([]);
			_setModel(null);
			const available_models = await provider.get_models(
				plugin.settings.provider_settings[provider.id]?.settings
			);
			setAvailableModels(available_models);
			const candidates = available_models.filter(
				(model) => model.id === plugin.settings.model
			);
			_setModel(
				candidates.length > 0 ? candidates[0] : available_models[0]
			);
			plugin.settings.model =
				candidates.length > 0
					? candidates[0].id
					: available_models[0].id;
			_setModelSettings(
				plugin.settings.provider_settings[provider.id]?.models[
					plugin.settings.model
				]
			);
		};
		fetch_model();
	}, [plugin.settings.model, provider, providerSettings]);

	const setProvider = (provider_id: string) => {
		_setProvider(
			available.filter((provider) => provider.id === provider_id)[0]
		);
		_setProviderSettings(
			plugin.settings.provider_settings[provider_id]?.settings
		);
		plugin.settings.provider = provider_id;
		plugin.saveData(plugin.settings);
	};

	const setProviderSettings = (settings: string) => {
		if (!provider) return;
		_setProviderSettings(settings);
		plugin.settings.provider_settings[provider.id] = {
			settings,
			models: {
				...plugin.settings.provider_settings[provider.id]?.models,
			},
		};
		plugin.active_model = null;
		plugin.saveData(plugin.settings);
	};

	const setModel = (model_id: string) => {
		if (!provider) return;
		_setModel(available_models.filter((model) => model.id === model_id)[0]);
		plugin.settings.model = model_id;
		plugin.saveData(plugin.settings);
	};

	const setModelSettings = (settings: string) => {
		if (!provider || !model) return;
		_setModelSettings(settings);
		plugin.settings.provider_settings[provider.id] = {
			settings: plugin.settings.provider_settings[provider.id]?.settings,
			models: {
				...plugin.settings.provider_settings[provider.id]?.models,
				[model.id]: settings,
			},
		};
		plugin.active_model = null;
		plugin.saveData(plugin.settings);
	};

	const ProviderSettings = provider?.Settings;
	const ModelSettings = model?.Settings;

	return (
		<>
			<>
				<SettingsItem
					name="Provider"
					description={provider ? provider.description : ""}
				>
					<select
						className="dropdown"
						value={provider ? provider.id : ""}
						onChange={(e) => {
							setProvider(e.target.value);
						}}
					>
						{available.map((provider) => (
							<option value={provider.id}>{provider.name}</option>
						))}
					</select>
				</SettingsItem>
				{ProviderSettings && (
					<ProviderSettings
						settings={providerSettings}
						saveSettings={setProviderSettings}
					/>
				)}
			</>
			<>
				<SettingsItem
					name="Model"
					description={model ? model.description : ""}
				>
					<select
						className="dropdown"
						value={model ? model.id : ""}
						onChange={(e) => {
							setModel(e.target.value);
						}}
					>
						{provider &&
							available_models.map((model) => (
								<option value={model.id}>{model.name}</option>
							))}
					</select>
				</SettingsItem>
				{ModelSettings && (
					<ModelSettings
						settings={modelSettings}
						saveSettings={setModelSettings}
					/>
				)}
			</>
			<Presets
				plugin={plugin}
				setModel={setModel}
				setProvider={setProvider}
				reload_signal={reload_signal}
			/>
		</>
	);
}

function AcceptSettingsComponent({
	plugin,
	reload_signal,
}: {
	plugin: Companion;
	reload_signal: { reload: boolean };
}) {
	const [accept_settings, _setAcceptSettings] = useState(
		plugin.settings.accept
	);
	const [delay, _setDelay] = useState(plugin.settings.delay_ms);
	const [keybind, _setKeybind] = useState(plugin.settings.keybind);
	const [expanded, setExpanded] = useState(false);

	const setAcceptSettings = (settings: AcceptSettings) => {
		_setAcceptSettings(settings);
		plugin.settings.accept = settings;
		if (plugin.active_model) {
			plugin.active_model.accept_settings = settings;
		}
		plugin.saveData(plugin.settings);
	};
	const setDelay = (delay: number) => {
		_setDelay(delay);
		plugin.settings.delay_ms = delay;
		plugin.saveData(plugin.settings);
		reload_signal.reload = true;
	};
	const setKeybind = (keybind: string | null) => {
		_setKeybind(keybind);
		plugin.settings.keybind = keybind;
		plugin.saveData(plugin.settings);
		reload_signal.reload = true;
	};

	return (
		<>
			<SettingsItem name="Delay">
				<input
					type="number"
					value={delay}
					onChange={(e) => {
						setDelay(parseInt(e.target.value));
					}}
				/>
				<span>ms</span>
			</SettingsItem>
			<SettingsItem name="Use a CodeMiror Keybind">
				<div
					className={
						"checkbox-container" +
						(keybind !== null ? " is-enabled" : "")
					}
					onClick={(_e) => {
						setKeybind(keybind === null ? "Tab" : null);
					}}
				/>
			</SettingsItem>
			{keybind === null ? null : (
				<SettingsItem name="CodeMiror Keybind">
					<input
						type="text"
						value={keybind || ""}
						onChange={(e) => {
							setKeybind(e.target.value);
						}}
					/>
				</SettingsItem>
			)}
			<SettingsItem name="Accept">
				<button
					onClick={() =>
						setAcceptSettings({
							splitter_regex: " ",
							display_splitter_regex: "\\.",
							completion_completeness_regex: ".*(?!p{L})[^d]$",
							min_accept_length: 4,
							min_display_length: 50,
							retrigger_threshold: 48,
						})
					}
				>
					One word at a time
				</button>
				<button
					onClick={() =>
						setAcceptSettings({
							splitter_regex: "\\.",
							display_splitter_regex: "\\.",
							completion_completeness_regex: ".*[^d]$",
							min_accept_length: 4,
							min_display_length: 50,
							retrigger_threshold: 128,
						})
					}
				>
					One sentence at a time
				</button>
				<button
					onClick={() =>
						setAcceptSettings({
							splitter_regex: "\n",
							display_splitter_regex: "\n",
							completion_completeness_regex: ".*$",
							min_accept_length: 4,
							min_display_length: 50,
							retrigger_threshold: 128,
						})
					}
				>
					One line at a time
				</button>
				<button
					onClick={() =>
						setAcceptSettings({
							splitter_regex: "$",
							display_splitter_regex: "$",
							completion_completeness_regex: ".*",
							min_accept_length: 0,
							min_display_length: 0,
							retrigger_threshold: 128,
						})
					}
				>
					Whole completion
				</button>
			</SettingsItem>
			<span onClick={() => setExpanded(!expanded)}>
				{expanded ? "▾" : "▸"} Advanced
			</span>
			{expanded && (
				<div className="ai-complete-advanced-settings">
					<SettingsItem
						name="Splitter regex"
						description="Defines how to split the completion chunks;
						only one chunk is accepted at a time when the completion is triggered"
					>
						<input
							type="text"
							value={accept_settings.splitter_regex}
							onChange={(e) => {
								setAcceptSettings({
									...accept_settings,
									splitter_regex: e.target.value,
								});
							}}
						/>
					</SettingsItem>
					<SettingsItem
						name="Preview splitter regex"
						description="Defines how to split the preview chunks;
						only one chunk is displayed at a time when the completion is triggered"
					>
						<input
							type="text"
							value={accept_settings.display_splitter_regex}
							onChange={(e) => {
								setAcceptSettings({
									...accept_settings,
									display_splitter_regex: e.target.value,
								});
							}}
						/>
					</SettingsItem>
					<SettingsItem
						name="Completion completeness regex"
						description="If this is not matched, the last chunk
						(according to the preview splitter regex) is discarded"
					>
						<input
							type="text"
							value={
								accept_settings.completion_completeness_regex
							}
							onChange={(e) => {
								setAcceptSettings({
									...accept_settings,
									completion_completeness_regex:
										e.target.value,
								});
							}}
						/>
					</SettingsItem>
					<SettingsItem
						name="Minimum completion length"
						description="Will complete the fewest chunks
						that add up to more than this many characters"
					>
						<input
							type="number"
							value={accept_settings.min_accept_length}
							onChange={(e) => {
								setAcceptSettings({
									...accept_settings,
									min_accept_length: parseInt(e.target.value),
								});
							}}
						/>
					</SettingsItem>
					<SettingsItem
						name="Minimum display length"
						description="Will display the fewest preview chunks
						that add up to more than this many characters"
					>
						<input
							type="number"
							value={accept_settings.min_display_length}
							onChange={(e) => {
								setAcceptSettings({
									...accept_settings,
									min_display_length: parseInt(
										e.target.value
									),
								});
							}}
						/>
					</SettingsItem>
					<SettingsItem
						name="Retrigger threshold"
						description="When this many characters is left,
						the API will be pinged again"
					>
						<input
							type="number"
							value={accept_settings.retrigger_threshold}
							onChange={(e) => {
								setAcceptSettings({
									...accept_settings,
									retrigger_threshold: parseInt(
										e.target.value
									),
								});
							}}
						/>
					</SettingsItem>
				</div>
			)}
		</>
	);
}

export default function SettingsComponent({
	plugin,
	reload_signal,
}: {
	plugin: Companion;
	reload_signal: { reload: boolean };
}) {
	const [enable_by_default, setEnableByDefault] = useState(
		plugin.settings.enable_by_default
	);

	return (
		<>
			<>
				<SettingsItem name="Enable by default">
					<div
						className={
							"checkbox-container" +
							(enable_by_default ? " is-enabled" : "")
						}
						onClick={(_e) => {
							setEnableByDefault(!enable_by_default);
							plugin.settings.enable_by_default =
								!enable_by_default;
							plugin.saveData(plugin.settings);
						}}
					/>
				</SettingsItem>
				<AcceptSettingsComponent
					plugin={plugin}
					reload_signal={reload_signal}
				/>
			</>
			<ProviderModelChooser
				plugin={plugin}
				reload_signal={reload_signal}
			/>
		</>
	);
}
