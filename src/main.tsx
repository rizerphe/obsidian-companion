import {
	App,
	Editor,
	MarkdownView,
	FuzzySuggestModal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { createRoot } from "react-dom/client";
import React from "react";
import { inlineSuggestion } from "codemirror-companion-extension";
import SettingsComponent from "./settings/settings";
import { CompletionCacher } from "./cache";
import { available } from "./complete/completers";
import { Model } from "./complete/complete";

interface CompanionModelSettings {
	name: string;
	provider: string;
	model: string;
	provider_settings: string;
	model_settings: string;
	enable_editor_command: boolean;
}

interface CompanionSettings {
	provider: string;
	model: string;
	enable_by_default: boolean;
	provider_settings: {
		[provider: string]: {
			settings: string;
			models: {
				[model: string]: string;
			};
		};
	};
	presets: CompanionModelSettings[];
}

const DEFAULT_SETTINGS: CompanionSettings = {
	provider: "openai-chatgpt",
	model: "gpt3.5-turbo",
	enable_by_default: false,
	provider_settings: {},
	presets: [],
};

export default class Companion extends Plugin {
	settings: CompanionSettings;
	enabled: boolean = false;
	active_provider: string = "";
	active_model: CompletionCacher | null = null;
	statusBarItemEl: HTMLElement | null = null;

	async setupModelChoice() {
		await this.loadSettings();
		this.enabled = this.settings.enable_by_default;

		this.addCommand({
			id: "load-preset",
			name: "Load preset",
			callback: () => {
				new PresetChooserModal(this).open();
			},
		});

		for (const preset of this.settings.presets) {
			if (!preset.enable_editor_command) continue;
			this.addCommand({
				id: `load-preset-${preset.name}`,
				name: `Load preset: ${preset.name}`,
				callback: () => {
					this.loadPreset(preset.name);
				},
			});
		}
	}

	async setupToggle() {
		this.addRibbonIcon(
			"terminal",
			"Toggle completion",
			(evt: MouseEvent) => {
				this.enabled = !this.enabled;
				this.fillStatusbar();
				new Notice(
					`Completion is now ${this.enabled ? "enabled" : "disabled"}`
				);
			}
		);
		this.addCommand({
			id: "toggle",
			name: "Toggle completion",
			callback: () => {
				this.enabled = !this.enabled;
				this.fillStatusbar();
				new Notice(
					`Completion is now ${this.enabled ? "enabled" : "disabled"}`
				);
			},
		});
	}

	async setupSuggestions() {
		this.registerEditorExtension(
			inlineSuggestion({
				fetchFn: () => this.triggerCompletion(),
				delay: 2000,
				continue_suggesting: true,
			})
		);
	}

	async setupStatusbar() {
		this.statusBarItemEl = this.addStatusBarItem();
		this.fillStatusbar();
	}

	async onload() {
		await this.setupModelChoice();
		await this.setupToggle();
		await this.setupSuggestions();
		await this.setupStatusbar();

		this.addSettingTab(new CompanionSettingsTab(this.app, this));
	}

	onunload() { }

	fillStatusbar() {
		if (!this.statusBarItemEl) return;
		this.statusBarItemEl.setText(
			`Completion: ${this.enabled ? "enabled" : "disabled"}`
		);
	}

	loadPreset(name: string) {
		const preset = this.settings.presets.find(
			(preset) => preset.name == name
		);
		if (!preset) return;

		this.settings.provider = preset.provider;
		this.settings.model = preset.model;
		this.settings.provider_settings[preset.provider] = {
			settings: preset.provider_settings,
			models: {
				[preset.model]: preset.model_settings,
			},
		};
		this.saveSettings();
	}

	savePreset(name: string) {
		const preset = this.settings.presets.find(
			(preset) => preset.name == name
		);
		if (preset) {
			preset.provider = this.settings.provider;
			preset.model = this.settings.model;
			preset.provider_settings =
				this.settings.provider_settings[
					this.settings.provider
				].settings;
			preset.model_settings =
				this.settings.provider_settings[this.settings.provider].models[
				this.settings.model
				];
		} else {
			this.settings.presets.push({
				name: name,
				provider: this.settings.provider,
				model: this.settings.model,
				provider_settings:
					this.settings.provider_settings[this.settings.provider]
						.settings,
				model_settings:
					this.settings.provider_settings[this.settings.provider]
						.models[this.settings.model],
				enable_editor_command: false,
			});
		}
		this.saveSettings();
	}

	deletePreset(name: string) {
		this.settings.presets = this.settings.presets.filter(
			(preset) => preset.name != name
		);
		this.saveSettings();
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async triggerCompletion() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return "";
		if (!this.enabled) return "";

		const cursor = view.editor.getCursor();
		const currentLine = view.editor.getLine(cursor.line);
		if (!currentLine.length) return ""; // Don't complete on empty lines
		const prefix = view.editor.getRange({ line: 0, ch: 0 }, cursor);
		const suffix = view.editor.getRange(cursor, {
			line: view.editor.lastLine(),
			ch: view.editor.getLine(view.editor.lastLine()).length,
		});

		const completion = await this.complete(prefix, suffix);

		return completion;
	}

	async complete(prefix: string, suffix: string) {
		if (this.active_provider != this.settings.provider) {
			this.active_provider = this.settings.provider;
			this.active_model = null;
		}

		const provider_settings =
			this.settings.provider_settings[this.active_provider];
		if (
			!this.active_model ||
			this.active_model.model.id != this.settings.model
		) {
			const provider = available.find(
				(provider) => provider.id == this.active_provider
			);
			if (!provider) return "";
			const available_models = await provider.get_models(
				provider_settings ? provider_settings.settings : ""
			);
			const model: Model =
				available_models.find(
					(model: Model) => model.id == this.settings.model
				) || available_models[0];
			this.settings.model = model.id;
			this.active_model = new CompletionCacher(
				model,
				provider_settings ? provider_settings.models[model.id] : ""
			);
		}

		try {
			return await this.active_model.complete({
				prefix: prefix,
				suffix: suffix,
			});
		} catch (e) {
			new Notice(`Error completing: ${e.message}`);
			return "";
		}
	}
}

class PresetChooserModal extends FuzzySuggestModal<CompanionModelSettings> {
	plugin: Companion;

	constructor(plugin: Companion) {
		super(plugin.app);
		this.plugin = plugin;
	}

	getItems(): CompanionModelSettings[] {
		return this.plugin.settings.presets;
	}

	getItemText(item: CompanionModelSettings): string {
		return item.name;
	}

	onChooseItem(
		preset: CompanionModelSettings,
		evt: MouseEvent | KeyboardEvent
	) {
		this.plugin.loadPreset(preset.name);
		new Notice("Loaded preset " + preset.name);
	}
}

class CompanionSettingsTab extends PluginSettingTab {
	plugin: Companion;
	root: any;
	reload_signal: { reload: boolean };

	constructor(app: App, plugin: Companion) {
		super(app, plugin);
		this.plugin = plugin;
		this.reload_signal = { reload: false };
	}

	display(): void {
		const { containerEl } = this;
		this.reload_signal.reload = false;
		this.root = createRoot(containerEl.createDiv());
		this.root.render(
			<React.StrictMode>
				<SettingsComponent
					plugin={this.plugin}
					reload_signal={this.reload_signal}
				/>
			</React.StrictMode>
		);
	}

	hide(): void {
		this.root.unmount();
		super.hide();

		if (this.reload_signal.reload) {
			this.reload_signal.reload = false;
			const reload = async () => {
				const app: any = this.plugin.app; // Otherwise typescript complains
				await app.plugins.disablePlugin("companion");
				await app.plugins.enablePlugin("companion");
			};
			reload();
		}
	}
}
