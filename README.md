# Obsidian Companion

Companion is an Obsidian plugin that adds an **AI-powered autocomplete** feature to your note-taking and personal knowledge management platform. With Companion, you can write notes more quickly and easily by receiving suggestions for completing words, phrases, and even entire sentences based on the context of your writing. The autocomplete feature uses OpenAI's state-of-the-art **GPT-3 and GPT-3.5 models, including ChatGPT**, to generate smart suggestions that are tailored to your specific writing style and preferences. Support for more models is planned, too.

Companion's autocomplete feature is designed to be unobtrusive, providing suggestions in ghost text that can be accepted or ignored by the you as you see fit, similar to what github copilot does. With Companion, you can write notes more efficiently and effectively, leveraging the power of AI to enhance your productivity and creativity. Whether you're a student, a researcher, or a knowledge worker, Companion can help you to take your note-taking and knowledge management to the next level.

Uses [codemirror-companion-extension](https://www.npmjs.com/package/codemirror-companion-extension), my own fork of saminzadeh's awesome [codemirror-extension-inline-suggestion](https://github.com/saminzadeh/codemirror-extension-inline-suggestion)

# Demo

![demo](https://raw.githubusercontent.com/rizerphe/obsidian-companion/main/screenshots/demo.gif)

# Installation

Companion is now available in the [Obsidian Community Plugin Directory](https://obsidian.md/plugins). Here's how to install it:

1. Open Obsidian and navigate to the **Community Plugins** settings page.
2. Search for "Companion" in the plugin search bar.
3. Click on the **Install** button next to the Companion plugin.
4. Once the installation is complete, you will see a confirmation message in the top right corner of the Obsidian window.
5. Finally, enable the Companion plugin by toggling the switch next to its name in the Community Plugins settings page.

# How to Use

To use Companion with OpenAI's ChatGPT models, you'll need to generate an API key and configure the plugin settings. Here's how:

1. Go to the [OpenAI API Keys](https://platform.openai.com/account/api-keys) page and log in to your account (or create a new one if you don't have one already).
2. Click the "Create new secret Key" button to create a new API key.
3. Copy the API key to your clipboard.
4. In Obsidian, open the Companion plugin settings by clicking on the gear icon in the bottom left corner of the app and looking for the "Companion" tab in the "Community plugins" section.
5. Paste your OpenAI API key into the "API Key" field.
6. Close the Companion settings.
7. To activate the autocomplete feature, open the command palette by pressing `Ctrl/Cmd + P` and search for "Toggle Completion". Select the command and hit Enter.
8. Once a suggestion appears, use the `Tab` key to accept the next word.

Once you've completed these steps, the Companion plugin will be ready to suggest completions based on the context of your writing. You can accept or ignore these suggestions as you see fit, and continue writing notes more efficiently and effectively with the power of AI.

If you have any issues with installation or usage, feel free to submit an issue at the [plugin's GitHub repository](https://github.com/rizerphe/obsidian-companion).

# Presets

Companion's "Presets" feature allows you to save your current settings as a preset, enable a "command" switch for that preset, and then use the preset as a global editor command in the command palette. This can be useful if you have certain settings that you use frequently and want to access them quickly and easily.
To use the Presets feature, follow these steps:

1. Open the Companion plugin settings by clicking on the gear icon in the bottom left corner of the app and looking for the "Companion" tab in the "Community plugins" section.
2. Configure the settings that you want to save as a preset.
3. Enter a name for your preset and click the "Save Preset" button at the bottom of the settings page.
4. Toggle the "Command" switch for your new preset to enable it as a global editor command.
5. To use the preset, open the command palette by pressing `Ctrl/Cmd + P` and search for the name of your preset. Select the command and hit Enter.

You can create multiple presets with different settings and enable them as global editor commands, making it easy to switch between different configurations as you work. With the Presets feature, you can customize your Companion experience to suit your needs and work more efficiently with AI-powered autocomplete suggestions.

# Say Thank You

Thanks to all those using my plugin! I made this project as a passion project, and I don't expect to receive any financial compensation for it. However, if you find my work useful and want to support me, feel free to <a href="https://www.buymeacoffee.com/rizerphe" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

Your support will be greatly appreciated and will help me continue working on this project and others like it. But if you can't or don't want to contribute financially, don't worry, I'm just happy that my work is useful to you!
