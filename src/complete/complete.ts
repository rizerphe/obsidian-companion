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
}

export interface Completer {
    id: string;
    name: string;
    description: string;
    get_models: (settings: string) => Promise<Model[]>;
    Settings?: React.ElementType<{
        settings: string | null;
        saveSettings: (settings: string) => void;
    }>;
}