import React from 'react';

/**
 * Detects if text contains tabular data and converts it to HTML table
 */
const detectAndRenderTable = (text: string): JSX.Element | null => {
  // Detect table patterns: tab-separated or pipe-separated data
  const lines = text.trim().split('\n');
  if (lines.length < 2) return null;

  // Check for tab-separated values (TSV) - common when copying from Excel/Google Sheets
  const isTSV = lines.every(line => line.includes('\t') && line.split('\t').length > 1);

  // Check for pipe-separated values (markdown table format)
  const isPipeTable = lines.some(line => line.includes('|')) &&
    lines.some(line => /^\s*\|.*\|\s*$/.test(line));

  // Check for CSV-like structure (comma-separated, but be careful with regular text)
  const isCSV = lines.length > 1 &&
    lines.every(line => line.includes(',') && line.split(',').length > 2) &&
    lines.every(line => line.split(',').length === lines[0].split(',').length);

  if (!isTSV && !isPipeTable && !isCSV) return null;

  let rows: string[][] = [];
  let separator = '';

  if (isTSV) {
    separator = '\t';
    rows = lines.map(line => line.split(separator).map(cell => cell.trim()));
  } else if (isPipeTable) {
    // Handle markdown table format
    rows = lines
      .filter(line => line.includes('|') && !line.match(/^\s*\|[\s\-\|]*\|\s*$/)) // Skip separator rows
      .map(line =>
        line.split('|')
          .slice(1, -1) // Remove first and last empty elements
          .map(cell => cell.trim())
      );
  } else if (isCSV) {
    separator = ',';
    rows = lines.map(line => line.split(separator).map(cell => cell.trim()));
  }

  if (rows.length < 2) return null;

  // Check if all rows have consistent column count
  const columnCount = rows[0].length;
  if (!rows.every(row => row.length === columnCount)) return null;

  return (
    <div className="my-4 overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800">
            {rows[0].map((header, index) => (
              <th
                key={index}
                className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, rowIndex) => (
            <tr key={rowIndex} className="even:bg-gray-50 dark:even:bg-gray-800/50">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300"
                >
                  {linkifyText(cell, cellIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Enhanced function to detect and convert URLs in text to clickable links
 * Supports various URL formats including http(s), ftp, www, and domain links
 */
export const linkifyText = (text: string, key: number = 0): JSX.Element => {
  // First check if the text contains a table
  const tableElement = detectAndRenderTable(text);
  if (tableElement) {
    return <div key={key}>{tableElement}</div>;
  }

  // URL regex pattern - matches http(s)://, ftp://, and common domains
  const urlRegex = /(https?:\/\/[^\s]+|ftp:\/\/[^\s]+|www\.[^\s]+\.[a-z]{2,}|[a-zA-Z0-9.-]+\.[a-z]{2,}\/[^\s]*)/gi;

  const parts = text.split(urlRegex);

  return (
    <span key={key}>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          // Ensure the URL has a proper protocol
          let href = part;
          if (!part.match(/^https?:\/\//i) && !part.match(/^ftp:\/\//i)) {
            href = `https://${part}`;
          }

          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-words transition-colors"
              onClick={(e) => e.stopPropagation()} // Prevent triggering parent click events
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </span>
  );
};

/**
 * Enhanced function to render rich content with automatic link detection
 * Handles both plain text strings and rich editor JSON content
 */
export const renderRichContent = (content: any): JSX.Element => {
  if (!content) return <span>No description provided</span>;

  // If it's already a string that doesn't look like JSON, render with link detection
  if (typeof content === 'string' && !content.trim().startsWith('{')) {
    return linkifyText(content);
  }

  // If it's a stringified JSON, try to parse it
  if (typeof content === 'string' && content.trim().startsWith('{')) {
    try {
      content = JSON.parse(content);
    } catch (e) {
      // If parsing fails, treat as plain text with link detection
      return linkifyText(content);
    }
  }

  // Function to recursively render nodes with formatting
  const renderNode = (node: any, key: number = 0): JSX.Element => {
    if (!node) return <span key={key}></span>;

    // If it's a text node, render the text with any marks (formatting) and link detection
    if (node.text) {
      // First handle link detection for plain text
      const textWithLinks = linkifyText(node.text, key);

      // Apply formatting marks if they exist
      if (node.marks) {
        let textElement = textWithLinks;
        node.marks.forEach((mark: any) => {
          switch (mark.type) {
            case 'bold':
              textElement = <strong key={key}>{textElement}</strong>;
              break;
            case 'italic':
              textElement = <em key={key}>{textElement}</em>;
              break;
            case 'underline':
              textElement = <u key={key}>{textElement}</u>;
              break;
            case 'link':
              // Handle explicit link marks from rich editor
              textElement = (
                <a
                  key={key}
                  href={mark.attrs?.href || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-words transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {node.text}
                </a>
              );
              break;
            // Add more formatting as needed
          }
        });
        return textElement;
      }
      return textWithLinks;
    }

    // Handle different node types
    switch (node.type) {
      case 'paragraph':
        return (
          <p key={key} className="mb-2 last:mb-0">
            {Array.isArray(node.content) ? node.content.map((child: any, index: number) => renderNode(child, index)) : ''}
          </p>
        );

      case 'heading':
        const level = node.attrs?.level || 1;
        const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag key={key} className="font-semibold mb-2">
            {Array.isArray(node.content) ? node.content.map((child: any, index: number) => renderNode(child, index)) : ''}
          </HeadingTag>
        );

      case 'bulletList':
        return (
          <ul key={key} className="list-disc ml-4 mb-2 space-y-1">
            {Array.isArray(node.content) ? node.content.map((child: any, index: number) => renderNode(child, index)) : ''}
          </ul>
        );

      case 'orderedList':
        return (
          <ol key={key} className="list-decimal ml-4 mb-2 space-y-1">
            {Array.isArray(node.content) ? node.content.map((child: any, index: number) => renderNode(child, index)) : ''}
          </ol>
        );

      case 'listItem':
        return (
          <li key={key}>
            {Array.isArray(node.content) ? node.content.map((child: any, index: number) => renderNode(child, index)) : ''}
          </li>
        );

      case 'hardBreak':
        return <br key={key} />;

      case 'link':
        // Handle standalone link nodes from rich editor
        return (
          <a
            key={key}
            href={node.attrs?.href || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-words transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {Array.isArray(node.content) ? node.content.map((child: any, index: number) => renderNode(child, index)) : node.attrs?.href || 'Link'}
          </a>
        );

      case 'table':
        return (
          <div key={key} className="my-4 overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm">
              {Array.isArray(node.content) ? node.content.map((child: any, index: number) => renderNode(child, index)) : ''}
            </table>
          </div>
        );

      case 'tableRow':
        return (
          <tr key={key} className="even:bg-gray-50 dark:even:bg-gray-800/50">
            {Array.isArray(node.content) ? node.content.map((child: any, index: number) => renderNode(child, index)) : ''}
          </tr>
        );

      case 'tableHeader':
        return (
          <th key={key} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800">
            {Array.isArray(node.content) ? node.content.map((child: any, index: number) => renderNode(child, index)) : ''}
          </th>
        );

      case 'tableCell':
        return (
          <td key={key} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">
            {Array.isArray(node.content) ? node.content.map((child: any, index: number) => renderNode(child, index)) : ''}
          </td>
        );

      default:
        // For unknown node types, try to render their content
        if (Array.isArray(node.content)) {
          return <span key={key}>{node.content.map((child: any, index: number) => renderNode(child, index))}</span>;
        }
        return <span key={key}></span>;
    }
  };

  // Handle rich editor content structure
  if (content && typeof content === 'object') {
    if (content.type === 'doc' && Array.isArray(content.content)) {
      return (
        <div className="prose prose-sm max-w-none">
          {content.content.map((node: any, index: number) => renderNode(node, index))}
        </div>
      );
    }
  }

  return <span>No description provided</span>;
};

/**
 * Enhanced function to render description with automatic link and table detection
 * Handles mixed content including tables, links, and formatted text
 */
export const renderDescription = (description: string | any): JSX.Element => {
  if (!description) return <span>No description provided</span>;

  if (typeof description === 'string') {
    // Check if the text contains mixed content (tables and regular text)
    const paragraphs = description.split(/\n\s*\n/);

    if (paragraphs.length > 1) {
      // Multiple paragraphs - process each separately
      return (
        <div className="space-y-3">
          {paragraphs.map((paragraph, index) => {
            const tableElement = detectAndRenderTable(paragraph.trim());
            if (tableElement) {
              return <div key={index}>{tableElement}</div>;
            }
            return (
              <div key={index}>
                {linkifyText(paragraph.trim(), index)}
              </div>
            );
          })}
        </div>
      );
    }

    // Single block of text - check for table or just linkify
    return linkifyText(description);
  }

  return renderRichContent(description);
};