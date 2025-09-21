import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { SlashCommand } from './types';
import {
  getFilteredCommands,
  getFilteredBasicBlocks,
  getFilteredAdvancedBlocks,
  getFilteredNotionAI,
  basicBlocks,
  advancedBlocks,
  notionAI
} from './registry';

export interface SlashCommandMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface SlashCommandMenuProps {
  query: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
}

export const SlashCommandMenu = forwardRef<SlashCommandMenuRef, SlashCommandMenuProps>(
  ({ query, onSelect, onClose }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [filterQuery, setFilterQuery] = useState(query);

    // Get filtered commands for each section
    const filteredBasicBlocks = getFilteredBasicBlocks(filterQuery);
    const filteredAdvancedBlocks = getFilteredAdvancedBlocks(filterQuery);
    const filteredNotionAI = getFilteredNotionAI(filterQuery);

    // Combine all commands for navigation
    const allCommands = [...filteredBasicBlocks, ...filteredAdvancedBlocks, ...filteredNotionAI];

    useEffect(() => {
      setSelectedIndex(0);
      setFilterQuery(query);
    }, [query]);

    const selectCommand = (index: number) => {
      const command = allCommands[index];
      if (command) {
        onSelect(command);
      }
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((selectedIndex + allCommands.length - 1) % allCommands.length);
          return true;
        }

        if (event.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % allCommands.length);
          return true;
        }

        if (event.key === 'Enter') {
          selectCommand(selectedIndex);
          return true;
        }

        if (event.key === 'Escape') {
          onClose();
          return true;
        }

        return false;
      },
    }));

    if (allCommands.length === 0) {
      return (
        <div className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-lg shadow-2xl w-[460px] backdrop-blur-md">
          <div className="p-3">
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="/Filter..."
                value={`/${filterQuery}`}
                className="w-full bg-transparent text-gray-300 text-sm placeholder-gray-500 outline-none"
                readOnly
              />
            </div>
            <div className="text-gray-400 text-sm px-2 py-1">No commands found</div>
          </div>
        </div>
      );
    }

    let globalIndex = 0;

    const renderSection = (title: string, commands: SlashCommand[]) => {
      if (commands.length === 0) return null;

      const sectionStartIndex = globalIndex;
      const sectionItems = commands.map((command, localIndex) => {
        const itemIndex = sectionStartIndex + localIndex;
        const isSelected = itemIndex === selectedIndex;

        return (
          <div
            key={command.id}
            className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer text-sm transition-all duration-150 ease-out ${
              isSelected
                ? 'bg-[#37352f] text-white'
                : 'hover:bg-[#37352f] text-gray-300'
            }`}
            onClick={() => selectCommand(itemIndex)}
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 flex items-center justify-center text-gray-400 text-sm">
                {command.icon}
              </div>
              <span className="font-medium">{command.title}</span>
            </div>

            {command.shortcut && (
              <div className="text-xs text-gray-500 font-mono">
                {command.shortcut}
              </div>
            )}
          </div>
        );
      });

      globalIndex += commands.length;

      return (
        <div className="mb-2">
          <div className="text-xs text-gray-500 px-2 py-2 font-medium">
            {title}
          </div>
          <div className="space-y-1">
            {sectionItems}
          </div>
        </div>
      );
    };

    return (
      <div className="bg-[#2f2f2f] border border-[#3f3f3f] rounded-lg shadow-2xl w-[460px] backdrop-blur-md max-h-[500px] overflow-y-auto">
        {/* Filter Input */}
        <div className="p-3 border-b border-[#3f3f3f] sticky top-0 bg-[#2f2f2f]">
          <div className="relative">
            <input
              type="text"
              placeholder="/Filter..."
              value={`/${filterQuery}`}
              className="w-full bg-transparent text-gray-300 text-sm placeholder-gray-500 outline-none"
              readOnly
            />
          </div>
        </div>

        {/* Sections */}
        <div className="p-2">
          {filteredBasicBlocks.length > 0 && renderSection('Basic blocks', filteredBasicBlocks)}
          {filteredAdvancedBlocks.length > 0 && renderSection('', filteredAdvancedBlocks)}
          {filteredNotionAI.length > 0 && renderSection('Notion AI', filteredNotionAI)}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-[#3f3f3f] bg-[#2a2a2a] rounded-b-lg sticky bottom-0">
          <div className="text-xs text-gray-500 flex items-center justify-between">
            <span>Type <span className="font-mono bg-[#3f3f3f] px-1 rounded">/</span> on the page</span>
            <span className="font-mono bg-[#3f3f3f] px-1 rounded">esc</span>
          </div>
        </div>
      </div>
    );
  }
);

SlashCommandMenu.displayName = 'SlashCommandMenu';