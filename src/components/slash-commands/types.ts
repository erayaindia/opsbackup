import { Editor } from '@tiptap/react';

export interface SlashCommand {
  id: string;
  title: string;
  icon: string;
  shortcut: string;
  run: (editor: Editor) => void;
}

export interface SlashCommandsState {
  query: string;
  range: { from: number; to: number };
  decorationNode: Element | null;
}