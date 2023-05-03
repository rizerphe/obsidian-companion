import * as React from "react";
import { Completer, Model } from "../complete/complete";
import { available } from "../complete/completers";
import { useState, useEffect } from "react";
import Companion, { AcceptSettings } from "../main";

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
		<div className="presets">
			<span className="ai-complete-heading">
				<span className="section-name">Presets</span>
			</span>
			<p className="description">
				Presets give you a way to quickly switch between different
				settings. You can create a preset by clicking the "Save preset"
				button. You can then switch between presets by clicking the
				"Load" button on the corresponding preset, or by using the "Load
				preset" command in the command palette.
			</p>
			<div className="presets-list">
				{plugin.settings.presets.map((preset) => (
					<div className="preset" key={preset.name}>
						<span className="name">{preset.name}</span>
						<span className="enable-editor-command">
							<div
								className={
									"checkbox-container mod-small" +
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
						</span>
						<span className="load">
							<button
								onClick={() => {
									plugin.loadPreset(preset.name);
									setProvider(preset.provider);
									setModel(preset.model);
								}}
							>
								Load
							</button>
						</span>
						<span className="delete">
							<button
								onClick={() => {
									plugin.deletePreset(preset.name);
									setForceUpdate(force_update + 1);
								}}
							>
								Delete
							</button>
						</span>
					</div>
				))}
			</div>
			<span className="save-preset">
				<input
					type="text"
					placeholder="Preset name"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
				<button onClick={savePreset}>Save preset</button>
			</span>
		</div>
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
	}, [plugin.settings.model, provider]);

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
		plugin.saveData(plugin.settings);
	};

	const ProviderSettings = provider?.Settings;
	const ModelSettings = model?.Settings;

	return (
		<div className="autocomplete-settings">
			<div className="provider-settings">
				<span className="ai-complete-heading">
					<span className="section-name">Provider</span>
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
				</span>
				<p className="description">
					{provider ? provider.description : ""}
				</p>
				{ProviderSettings && (
					<ProviderSettings
						settings={providerSettings}
						saveSettings={setProviderSettings}
					/>
				)}
			</div>
			<div className="model-settings">
				<span className="ai-complete-heading">
					<span className="section-name">Model</span>
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
				</span>
				<p className="description">{model ? model.description : ""}</p>
				{ModelSettings && (
					<ModelSettings
						settings={modelSettings}
						saveSettings={setModelSettings}
					/>
				)}
			</div>
			<Presets
				plugin={plugin}
				setModel={setModel}
				setProvider={setProvider}
				reload_signal={reload_signal}
			/>
		</div>
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
			<div className="ai-complete-setting">
				<span>Delay:</span>
				<span>
					<input
						type="number"
						value={delay}
						onChange={(e) => {
							setDelay(parseInt(e.target.value));
						}}
					/>
					<span>ms</span>
				</span>
			</div>
			<div className="ai-complete-setting flex-start">
				<div
					className={
						"checkbox-container mod-small" +
						(keybind !== null ? " is-enabled" : "")
					}
					onClick={(_e) => {
						setKeybind(keybind === null ? "Tab" : null);
					}}
				/>
				<span>Use a CodeMirror Keybind</span>
			</div>
			{keybind === null ? null : (
				<div className="ai-complete-setting">
					<span>CodeMiror Keybind:</span>
					<input
						type="text"
						value={keybind || ""}
						onChange={(e) => {
							setKeybind(e.target.value);
						}}
					/>
				</div>
			)}
			<div className="ai-complete-tabs">
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
			</div>
			<span onClick={() => setExpanded(!expanded)}>
				{expanded ? "▾" : "▸"} Advanced
			</span>
			{expanded && (
				<div className="ai-complete-advanced">
					<div className="ai-complete-setting">
						<span>Splitter regex:</span>
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
					</div>
					<div className="ai-complete-setting">
						<span>Preview splitter regex:</span>
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
					</div>
					<div className="ai-complete-setting">
						<span>Completion completeness regex:</span>
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
					</div>
					<div className="ai-complete-setting">
						<span>Minimum accepted completion length:</span>
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
					</div>
					<div className="ai-complete-setting">
						<span>Minimum displayed completion length:</span>
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
					</div>
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
		<div>
			<div className="ai-complete-settings-header">
				<h1>Companion</h1>
				<span className="ai-complete-enable-by-default">
					<div
						className={
							"checkbox-container mod-small" +
							(enable_by_default ? " is-enabled" : "")
						}
						onClick={(_e) => {
							setEnableByDefault(!enable_by_default);
							plugin.settings.enable_by_default =
								!enable_by_default;
							plugin.saveData(plugin.settings);
						}}
					/>
					Enable by default
				</span>
				<AcceptSettingsComponent
					plugin={plugin}
					reload_signal={reload_signal}
				/>
			</div>
			<ProviderModelChooser
				plugin={plugin}
				reload_signal={reload_signal}
			/>
		</div>
	);
}
