import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

export interface SlashCommandOptions {
  suggestion: any;
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        allowSpaces: false,
        allowedPrefixes: [' ', '^'],
        startOfLine: false,
        decorationTag: 'span',
        decorationClass: 'slash-command',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});