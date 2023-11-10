import { AcceptSettings } from "./main";
import { Prompt, Model } from "./complete/complete";
import { Suggestion } from "codemirror-companion-extension";

function findLastRegexIndex(regex: RegExp, str: string) {
	let match;
	let lastIndex = -1;

	while ((match = regex.exec(str)) !== null) {
		lastIndex = match.index;
	}

	return lastIndex;
}

class ExhaustableConsumable<T> {
	queue: T[];
	consumers: ((item: { item: T } | null) => void)[];
	exhausted: boolean = false;

	constructor(exhausted: boolean = false) {
		this.queue = [];
		this.consumers = [];
		this.exhausted = exhausted;
	}

	enqueue(item: T) {
		this.queue.push(item);
		const old_consumers = this.consumers;
		this.consumers = [];
		for (let consumer of old_consumers) {
			consumer({ item });
		}
	}

	exhaust() {
		this.exhausted = true;
		for (let consumer of this.consumers) {
			consumer(null);
		}
	}

	reset() {
		this.consumers = [];
		this.exhausted = false;
	}

	async *iter(): AsyncGenerator<T> {
		for (let item of this.queue) {
			yield item;
		}

		let next_items: { item: T }[] = [];
		let next_item_promise: Promise<void> = Promise.resolve();
		const add_resolver = () => {
			next_item_promise = new Promise<void>((resolve) => {
				this.consumers.push((item) => {
					if (item == null) {
						return resolve();
					}
					next_items.push(item);
					add_resolver();
					resolve();
				});
			});
		};
		add_resolver();
		while (!this.exhausted) {
			await next_item_promise;
			while (next_items.length > 0) {
				const next_item = next_items.shift();
				if (next_item) {
					yield next_item.item;
				} else {
					continue;
				}
			}
		}
	}
}

export class CompletionCacher {
	cache: Map<Prompt, ExhaustableConsumable<string>>;
	model: Model;
	model_settings: string;
	accept_settings: AcceptSettings;
	accept_with_obsidian: boolean;
	last_suggestion: string = "";

	constructor(
		model: Model,
		model_settings: string,
		accept_settings: AcceptSettings,
		accept_with_obsidian: boolean
	) {
		this.cache = new Map();
		this.model = model;
		this.model_settings = model_settings;
		this.accept_settings = accept_settings;
		this.accept_with_obsidian = accept_with_obsidian;
	}

	get_cached_queue(
		prompt: Prompt
	): [Prompt, ExhaustableConsumable<string>] | null {
		for (let [cached_prompt, cached_suggestions] of this.cache) {
			const cached_prompt_and_continuation =
				cached_prompt.prefix + cached_suggestions.queue.join("");
			if (prompt.suffix != cached_prompt.suffix) {
				continue;
			}
			if (
				!prompt.prefix.startsWith(cached_prompt.prefix) ||
				!cached_prompt_and_continuation.startsWith(prompt.prefix)
			) {
				continue;
			}

			// We are in a situation where the prompt is a continuation of the cached prompt
			return [cached_prompt, cached_suggestions];
		}
		return null;
	}

	async fetch(prompt: Prompt, stream: boolean): Promise<void> {
		// We see whether the model supports iteration
		if (this.model.iterate && stream) {
			// If it does, we stream the results
			await this.fetch_iteratively(prompt);
		}
		// Otherwise, we fetch a single completion
		await this.fetch_blockwise(prompt);
	}

	async fetch_iteratively(prompt: Prompt): Promise<void> {
		if (!this.model.iterate) {
			return;
		}

		const queue =
			this.get_cached_queue(prompt)?.[1] ??
			this.cache
				.set(prompt, new ExhaustableConsumable<string>())
				.get(prompt)!;

		if (!queue.exhausted) return;
		queue.reset();

		// We fetch a single token at a time
		for await (const token of this.model.iterate(
			{
				prefix: prompt.prefix + queue.queue.join(""),
				suffix: prompt.suffix,
			},
			this.model_settings
		)) {
			queue.enqueue(token);
		}

		queue.exhaust();
	}

	async fetch_blockwise(prompt: Prompt): Promise<void> {
		// We fetch a completion and cache it
		const queue =
			this.get_cached_queue(prompt)?.[1] ??
			this.cache
				.set(prompt, new ExhaustableConsumable<string>())
				.get(prompt)!;

		if (!queue.exhausted) return;
		queue.reset();

		const completion = await this.model.complete(
			{
				prefix: prompt.prefix + queue.queue.join(""),
				suffix: prompt.suffix,
			},
			this.model_settings
		);

		if (completion == null) {
			return;
		}
		queue.enqueue(completion);
		queue.exhaust();
	}

	ensure_fetched(
		prompt: Prompt,
		queue: ExhaustableConsumable<string>,
		stream: boolean
	) {
		if (queue.queue.length > 0) {
			return;
		}
		this.fetch(prompt, stream);
	}

	async *complete(
		prompt: Prompt,
		stream: boolean = true
	): AsyncGenerator<Suggestion> {
		const [starting_prompt, queue] = this.get_cached_queue(prompt) ?? [
			prompt,
			this.cache
				.set(prompt, new ExhaustableConsumable<string>(true))
				.get(prompt)!,
		];

		this.ensure_fetched(prompt, queue, stream);

		let completion = "";
		let need_continuation = false;
		for await (const token of queue.iter()) {
			need_continuation = false;
			completion += token;
			const suggestion = this.suggestion_from_completion(
				completion.slice(
					prompt.prefix.length - starting_prompt.prefix.length
				),
				() => {
					need_continuation = true;
				}
			);
			if (suggestion == null) {
				continue;
			}
			yield this.strip(suggestion);
		}

		if (need_continuation) this.fetch(prompt, stream);
	}

	strip(suggestion: Suggestion): Suggestion {
		// We strip the suggestion of the actual completion if
		// obsidian should accept the completion
		this.last_suggestion = suggestion.complete_suggestion;
		if (this.accept_with_obsidian) {
			return {
				display_suggestion: suggestion.display_suggestion,
				complete_suggestion: "",
			};
		}
		return suggestion;
	}

	suggestion_from_completion(
		completion: string,
		launch_refetch?: () => void
	): Suggestion | null {
		if (completion.length == 0) {
			// We don't have a completion
			return null;
		}

		// We discard the last word of the completion because it's probably not complete
		// Except if the completion ends with a punctuation mark
		// Plus, we end at the first period that comes after the 50th character
		let partial_completion = new RegExp(
			this.accept_settings.completion_completeness_regex
		).test(completion)
			? completion
			: completion.slice(
					0,
					findLastRegexIndex(
						new RegExp(this.accept_settings.splitter_regex, "gi"),
						completion
					)
			  );
		const display_splitter_match = completion
			.slice(this.accept_settings.min_display_length)
			.match(new RegExp(this.accept_settings.display_splitter_regex));
		const display_splitter_index =
			display_splitter_match && display_splitter_match.index != undefined
				? display_splitter_match.index +
				  display_splitter_match.length +
				  50
				: -1;
		partial_completion = partial_completion.slice(
			0,
			display_splitter_index
		);

		// We also isolate the first word of the completion
		// This is the part that we will insert
		// Note that we add more than just the first word if the completion is short
		// the threshold being the min_accept_length setting
		const complete_splitter_match = completion
			.slice(this.accept_settings.min_accept_length)
			.match(new RegExp(this.accept_settings.splitter_regex));
		const complete_splitter_index =
			complete_splitter_match &&
			complete_splitter_match.index != undefined
				? complete_splitter_match.index +
				  this.accept_settings.min_accept_length
				: undefined;
		const first_word = completion.slice(0, complete_splitter_index);

		// We check whether we're getting close to the end of the completion
		// If we are, we should start fetching a new completion
		if (partial_completion.length - first_word.length < 48) {
			launch_refetch?.();
		}

		return {
			display_suggestion:
				partial_completion.length > 0 ? partial_completion : completion,
			complete_suggestion: first_word,
		};
	}
}
