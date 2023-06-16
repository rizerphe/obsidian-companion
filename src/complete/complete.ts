import * as React from "react";

export interface Prompt {
	prefix: string;
	suffix: string;
}

export interface Model {
	id: string;
	name: string;
	description: string;
	Settings?: React.ElementType<{
		settings: string | null;
		saveSettings: (settings: string) => void;
	}>;

	complete: (prompt: Prompt, settings: string) => Promise<string>;

	// The plugin will assure that unload() is called before load()
	// is called for another model, and that load() is called before
	// complete() is called for that model. It can, however, call
	// unload() and load() multiple times for the same model, even
	// consecutively.
	load?: () => Promise<void>;
	unload?: () => Promise<void>;
}

export interface Completer {
	id: string;
	name: string;
	description: React.ReactNode;
	get_models: (settings: string) => Promise<Model[]>;
	Settings?: React.ElementType<{
		settings: string | null;
		saveSettings: (settings: string) => void;
	}>;
}
