# Obsidian Companion

Companion is an Obsidian plugin that adds an **AI-powered autocomplete** feature to your note-taking and personal knowledge management platform. With Companion, you can write notes more quickly and easily by receiving suggestions for completing words, phrases, and even entire sentences based on the context of your writing. The autocomplete feature uses OpenAI's state-of-the-art **GPT-3 and GPT-3.5 models, including ChatGPT**, to generate smart suggestions that are tailored to your specific writing style and preferences. Support for more models is planned, too.

Companion's autocomplete feature is designed to be unobtrusive, providing suggestions in ghost text that can be accepted or ignored by the you as you see fit, similar to what github copilot does. With Companion, you can write notes more efficiently and effectively, leveraging the power of AI to enhance your productivity and creativity. Whether you're a student, a researcher, or a knowledge worker, Companion can help you to take your note-taking and knowledge management to the next level.

Uses [codemirror-companion-extension](https://www.npmjs.com/package/codemirror-companion-extension), my own fork of saminzadeh's awesome [codemirror-extension-inline-suggestion](https://github.com/saminzadeh/codemirror-extension-inline-suggestion)

# Demo
![demo](https://raw.githubusercontent.com/rizerphe/obsidian-companion/main/screenshots/demo.gif)

# How to Use
To use Companion with OpenAI's ChatGPT models, you'll need to generate an API key and configure the plugin settings. Here's how:
1. Go to the [OpenAI API Keys](https://platform.openai.com/account/api-keys) page and log in to your account (or create a new one if you don't have one already).
2. Click the "Create new secret Key" button to create a new API key.
3. Copy the API key to your clipboard.
4. In Obsidian, open the Companion plugin settings by clicking on the gear icon in the bottom left corner of the app and looking for the "Companion" tab in the "Community plugins" section.
5. In the Companion settings, select "OpenAI ChatGPT" as the provider.
6. Paste your OpenAI API key into the "API Key" field.
7. Close the Companion settings.
8. To activate the autocomplete feature, open the command palette by pressing `Ctrl/Cmd + P` and search for "Toggle Completion". Select the command and hit Enter.
9. Once a suggestion appears, use the `Tab` key to accept the next word.

Once you've completed these steps, the Companion plugin will be ready to suggest completions based on the context of your writing. You can accept or ignore these suggestions as you see fit, and continue writing notes more efficiently and effectively with the power of AI.

# Presets
Companion's "Presets" feature allows you to save your current settings as a preset, enable a "command" switch for that preset, and then use the preset as a global editor command in the command palette. This can be useful if you have certain settings that you use frequently and want to access them quickly and easily.
To use the Presets feature, follow these steps:
1. Open the Companion plugin settings by clicking on the gear icon in the bottom left corner of the app and looking for the "Companion" tab in the "Community plugins" section.
2. Configure the settings that you want to save as a preset.
3. Enter a name for your preset and click the "Save Preset" button at the bottom of the settings page.
4. Toggle the "Command" switch for your new preset to enable it as a global editor command.
5. To use the preset, open the command palette by pressing `Ctrl/Cmd + P` and search for the name of your preset. Select the command and hit Enter.

You can create multiple presets with different settings and enable them as global editor commands, making it easy to switch between different configurations as you work. With the Presets feature, you can customize your Companion experience to suit your needs and work more efficiently with AI-powered autocomplete suggestions.
