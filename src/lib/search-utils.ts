import React, { ComponentType } from "react";

export interface MenuItem {
  title: string;
  url: string;
  icon: ComponentType<any>;
}

export interface SearchResult {
  item: MenuItem;
  section: string;
  subsection?: string;
  matches: {
    title: boolean;
    section: boolean;
    subsection: boolean;
  };
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
  subsections?: { title: string; items: MenuItem[] }[];
}

// Normalize text for searching (remove special chars, lowercase)
const normalizeText = (text: string): string => {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
};

// Check if text matches search query
const matchesQuery = (text: string, query: string): boolean => {
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  return normalizedText.includes(normalizedQuery);
};

// Search through all menu items
export const searchMenuItems = (
  sections: { [key: string]: MenuSection },
  query: string
): SearchResult[] => {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];

  Object.entries(sections).forEach(([sectionKey, section]) => {
    const sectionTitle = section.title;

    // Search in main section items
    section.items.forEach(item => {
      const titleMatch = matchesQuery(item.title, query);
      const sectionMatch = matchesQuery(sectionTitle, query);

      if (titleMatch || sectionMatch) {
        results.push({
          item,
          section: sectionTitle,
          matches: {
            title: titleMatch,
            section: sectionMatch,
            subsection: false
          }
        });
      }
    });

    // Search in subsections if they exist
    section.subsections?.forEach(subsection => {
      subsection.items.forEach(item => {
        const titleMatch = matchesQuery(item.title, query);
        const sectionMatch = matchesQuery(sectionTitle, query);
        const subsectionMatch = matchesQuery(subsection.title, query);

        if (titleMatch || sectionMatch || subsectionMatch) {
          results.push({
            item,
            section: sectionTitle,
            subsection: subsection.title,
            matches: {
              title: titleMatch,
              section: sectionMatch,
              subsection: subsectionMatch
            }
          });
        }
      });
    });
  });

  // Sort results by relevance (title matches first, then section matches)
  return results.sort((a, b) => {
    if (a.matches.title && !b.matches.title) return -1;
    if (!a.matches.title && b.matches.title) return 1;
    if (a.matches.section && !b.matches.section) return -1;
    if (!a.matches.section && b.matches.section) return 1;
    return a.item.title.localeCompare(b.item.title);
  });
};

// Highlight matching text in search results
export const highlightMatch = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text;

  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);

  const index = normalizedText.indexOf(normalizedQuery);
  if (index === -1) return text;

  // Find the actual position in the original text (accounting for case and special chars)
  let actualStart = 0;
  let normalizedIndex = 0;

  for (let i = 0; i < text.length && normalizedIndex < index; i++) {
    if (/[a-z0-9\s]/i.test(text[i])) {
      normalizedIndex++;
    }
    actualStart = i + 1;
  }

  const actualEnd = actualStart + query.length;

  return React.createElement(
    React.Fragment,
    null,
    text.slice(0, actualStart),
    React.createElement(
      'mark',
      { className: 'bg-sidebar-primary/20 text-sidebar-primary-foreground px-0.5 rounded' },
      text.slice(actualStart, actualEnd)
    ),
    text.slice(actualEnd)
  );
};

// Debounce function for search input
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};