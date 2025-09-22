import { Editor } from '@tiptap/react';
import { Node, Mark } from '@tiptap/pm/model';
import { EditorState } from '@tiptap/pm/state';

// Editor content types
export interface EditorContent {
  type: string;
  content?: EditorContent[];
  text?: string;
  marks?: EditorMark[];
  attrs?: Record<string, unknown>;
}

export interface EditorMark {
  type: string;
  attrs?: Record<string, unknown>;
}

// Range interface for selections
export interface EditorRange {
  from: number;
  to: number;
}

// Slash command types
export interface SlashCommandProps {
  editor: Editor;
  query: string;
  range: EditorRange;
}

export interface SlashCommandRenderProps {
  editor: Editor;
  query: string;
  range: EditorRange;
}

export interface SlashCommandKeyDownProps {
  event: KeyboardEvent;
}

// Link preview types
export interface LinkPreview {
  url: string;
  id: string;
}

// Editor event handlers
export interface EditorClickHandler {
  (view: unknown, pos: number, event: MouseEvent): boolean;
}

export interface EditorKeyDownHandler {
  (view: unknown, event: KeyboardEvent): boolean;
}

// Node and Mark types for traversal
export interface EditorNode {
  type: {
    name: string;
  };
  marks?: EditorNodeMark[];
  content?: EditorNode[];
  attrs?: Record<string, unknown>;
}

export interface EditorNodeMark {
  type: {
    name: string;
  };
  attrs?: {
    href?: string;
    [key: string]: unknown;
  };
}

// Menu position
export interface MenuPosition {
  top: number;
  left: number;
}

// Error boundary types
export interface EditorError {
  message: string;
  stack?: string;
  componentStack?: string;
}

export interface ErrorInfo {
  componentStack: string;
}