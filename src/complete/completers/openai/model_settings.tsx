import * as React from "react";
import SettingsItem from "../../../components/SettingsItem";
import { z } from "zod";

export const settings_schema = z.object({
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  presence_penalty: z.number().optional(),
  frequency_penalty: z.number().optional(),
  prompt_length: z.number().optional(),
  context_length: z.number().optional(),
});

export type Settings = z.infer<typeof settings_schema>;

const default_settings: Settings = {
  temperature: 1,
  top_p: 0.7,
  presence_penalty: 0.6,
  frequency_penalty: 0,
  prompt_length: 64,
  context_length: 6000,
};

export const parse_settings = (data: string | null): Settings => {
  if (data == null) {
    return default_settings;
  }
  try {
    const settings: unknown = JSON.parse(data);
    return settings_schema.parse(settings);
  } catch (e) {
    return default_settings;
  }
};

export function SettingsUI({
  settings,
  saveSettings,
}: {
  settings: string | null;
  saveSettings: (settings: string) => void;
}) {
  const parsed_settings = parse_settings(settings);

  return (
    <>
      <SettingsItem name="Temperature">
        <input
          type="number"
          value={
            parsed_settings.temperature === undefined
              ? ""
              : parsed_settings.temperature
          }
          onChange={(e) =>
            saveSettings(
              JSON.stringify({
                ...parsed_settings,
                temperature: parseFloat(e.target.value),
              })
            )
          }
        />
      </SettingsItem>
      <SettingsItem 
        name="Top P"
        description="The cumulative probability of the model's most likely tokens to generate. Setting this to 0.7 means only tokens comprising 70% of the probability mass will be considered."
      >
        <input
          type="number"
          value={
            parsed_settings.top_p === undefined
              ? ""
              : parsed_settings.top_p
          }
          onChange={(e) =>
            saveSettings(
              JSON.stringify({
                ...parsed_settings,
                top_p: parseFloat(e.target.value),
              })
            )
          }
        />
      </SettingsItem>
      <SettingsItem
        name="Presence penalty"
        description="How much to penalize new tokens based on whether they appear in the text so far. Increases the model's likelihood to talk about new topics."
      >
        <input
          type="number"
          value={
            parsed_settings.presence_penalty === undefined
              ? ""
              : parsed_settings.presence_penalty
          }
          onChange={(e) =>
            saveSettings(
              JSON.stringify({
                ...parsed_settings,
                presence_penalty: parseFloat(e.target.value),
              })
            )
          }
        />
      </SettingsItem>
      <SettingsItem
        name="Frequency penalty"
        description="How much to penalize new tokens based on their existing frequency in the text so far. Decreases the model's likelihood to repeat the same line verbatim."
      >
        <input
          type="number"
          value={
            parsed_settings.frequency_penalty === undefined
              ? ""
              : parsed_settings.frequency_penalty
          }
          onChange={(e) =>
            saveSettings(
              JSON.stringify({
                ...parsed_settings,
                frequency_penalty: parseFloat(e.target.value),
              })
            )
          }
        />
      </SettingsItem>
      <SettingsItem
        name="Maximum length"
        description="The maximum length of the generated text, in tokens (1 token is roughly 4 characters)"
      >
        <input
          type="number"
          value={
            parsed_settings.prompt_length === undefined
              ? ""
              : parsed_settings.prompt_length
          }
          onChange={(e) =>
            saveSettings(
              JSON.stringify({
                ...parsed_settings,
                prompt_length: parseInt(e.target.value),
              })
            )
          }
        />
      </SettingsItem>
      <SettingsItem
        name="Context length"
        description="How much context should the model get, in characters"
      >
        <input
          type="number"
          value={
            parsed_settings.context_length === undefined
              ? ""
              : parsed_settings.context_length
          }
          onChange={(e) =>
            saveSettings(
              JSON.stringify({
                ...parsed_settings,
                context_length: parseInt(e.target.value),
              })
            )
          }
        />
      </SettingsItem>
    </>
  );
}
