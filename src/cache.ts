import { Prompt, Model } from "./complete/complete";
import { Suggestion } from 'codemirror-companion-extension';

export class CompletionCacher {
    cache: Map<Prompt, string>;
    model: Model;
    model_settings: string;
    current_fetch: Promise<undefined> | null = null;

    constructor(model: Model, model_settings: string) {
        this.cache = new Map();
        this.model = model;
        this.model_settings = model_settings;
    }

    get_cached(prompt: Prompt): Suggestion | null {
        for (let [key, value] of this.cache) {
            if (prompt.suffix == key.suffix) {
                // We have a match if the cached prefix + completion
                // starts with the prompt prefix
                if ((key.prefix + value).startsWith(prompt.prefix)) {
                    // Make sure we are not completing with what the user previously typed
                    if (!prompt.prefix.startsWith(key.prefix)) continue;

                    // We have a match
                    // We need to isolate the completion
                    const completion = (key.prefix + value).slice(prompt.prefix.length);

                    if (completion.length == 0) {
                        // We don't have a completion
                        return null;
                    }

                    // We discard the last word of the completion because it's probably not complete
                    // Except if the completion ends with a punctuation mark
                    // Plus, we end at the first period that comes after the 50th character
                    let partial_completion = /.*(?!\p{L})[^\d]$/.test(completion) ? completion : completion.split(" ").slice(0, -1).join(" ");
                    partial_completion = partial_completion.slice(0, 50) + partial_completion.slice(50).split(".")[0] + (partial_completion.slice(50).split(".").length > 1 ? "." : "");

                    // We also isolate the first word of the completion
                    // This is the part that we will insert
                    // Note that we add more than just the first word if the completion is short
                    // the threshold being 4 characters
                    const first_word = completion.slice(0, 4) + completion.slice(4).split(" ")[0];

                    // We check whether we're getting close to the end of the completion
                    // If we are, we should start fetching a new completion
                    if (partial_completion.length - first_word.length < 48) {
                        if (!this.current_fetch) {
                            this.current_fetch = this.fetch(
                                {
                                    prefix: prompt.prefix + completion,
                                    suffix: prompt.suffix,
                                }
                            )
                            this.current_fetch.then(() => {this.current_fetch = null});
                        }
                    }

                    return {
                        display_suggestion: partial_completion.length > 0 ? partial_completion : completion,
                        complete_suggestion: first_word,
                    };
                }
            }
        }
        return null;
    }

    async fetch(prompt: Prompt): Promise<undefined> {
        // We fetch a completion and cache it
        const completion = await this.model.complete(prompt, this.model_settings);

        // We see if we have to update a cached completion\
        for (let [key, value] of this.cache) {
            if (prompt.suffix == key.suffix) {
                if (prompt.prefix.startsWith(key.prefix + value)) {
                    // We have a match
                    // We need to isolate the completion
                    const isolated_completion = (prompt.prefix + completion).slice(key.prefix.length);
                    this.cache.set(key, isolated_completion);
                    return;
                }
            }
        }

        // We didn't find a match, so we just add it to the cache
        this.cache.set(prompt, completion);
    }

    async complete(prompt: Prompt): Promise<Suggestion> {
        // This is a three step process:
        // 1. Check if we have a cached result
        // 2. If not, wait for the current fetch to complete
        // 3. If we still don't have a result, fetch it and cache it
        // This solution might be a bit slow because we aren't checking what the current fetch is for.
        let cached = this.get_cached(prompt);
        if (cached) {
            return cached;
        }
        if (this.current_fetch) {
            await this.current_fetch;
        }
        cached = this.get_cached(prompt);
        if (cached) {
            return cached;
        }
        this.current_fetch = this.fetch(prompt);
        await this.current_fetch;
        this.current_fetch = null;

        cached = this.get_cached(prompt);
        if (cached) {
            return cached;
        }
        return {
            display_suggestion: "",
            complete_suggestion: "",
        };
    }
}
