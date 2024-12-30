import React, { useState, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Code,
  Hash,
  Quote,
  List,
  ListOrdered,
  TextQuote,
  Minus,
  Link,
  Image
} from 'lucide-react';

// Define types for our formats
interface Format {
  pattern?: RegExp;
  marker: string;
  type: 'inline' | 'line' | 'block' | 'special';
  label?: string;
  endMarker?: string;
  handler?: (selectedText: string) => string;
}

interface Formats {
  [key: string]: Format;
}

export const TextEditor: React.FC = () => {
  const [text, setText] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Define all available formats with their patterns and insertion logic
  const formats: Formats = {
    // Inline formats
    bold: { pattern: /\*\*(.*?)\*\*/g, marker: '**', type: 'inline' },
    italic: { pattern: /\*(.*?)\*/g, marker: '*', type: 'inline' },
    code: { pattern: /`(.*?)`/g, marker: '`', type: 'inline' },
    strikethrough: { pattern: /~~(.*?)~~/g, marker: '~~', type: 'inline' },
    
    // Block formats (headers)
    h1: { marker: '# ', type: 'line', label: 'Heading 1' },
    h2: { marker: '## ', type: 'line', label: 'Heading 2' },
    h3: { marker: '### ', type: 'line', label: 'Heading 3' },
    
    // Block formats (lists and quotes)
    bulletList: { marker: '- ', type: 'line', label: 'Bullet List' },
    numberList: { marker: '1. ', type: 'line', label: 'Numbered List' },
    blockquote: { marker: '> ', type: 'line', label: 'Blockquote' },
    
    // Special formats
    horizontalRule: { marker: '\n---\n', type: 'special', label: 'Horizontal Rule' },
    codeBlock: { 
      marker: '\n```\n',
      endMarker: '\n```',
      type: 'block',
      label: 'Code Block'
    },
    link: {
      type: 'special',
      marker: '',
      label: 'Link',
      handler: (selectedText) => `[${selectedText}](url)`
    },
    image: {
      type: 'special',
      marker: '',
      label: 'Image',
      handler: (selectedText) => `![${selectedText}](image-url)`
    }
  };

  const formatText = (formatType: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);
    const format = formats[formatType];
    
    let newText = text;
    let newCursorPosition = start;

    switch (format.type) {
      case 'inline': {
        // Toggle inline formatting
        const hasFormat = format.pattern?.test(selectedText);
        const newContent = hasFormat
          ? selectedText.replace(format.pattern, '$1')
          : `${format.marker}${selectedText}${format.marker}`;
        
        newText = text.substring(0, start) + newContent + text.substring(end);
        newCursorPosition = start + newContent.length;
        break;
      }
      
      case 'line': {
        // Handle line-based formatting (headers, lists, quotes)
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = text.indexOf('\n', end);
        const currentLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);
        const hasFormat = currentLine.startsWith(format.marker);
        
        if (hasFormat) {
          newText = text.substring(0, lineStart) + 
                   currentLine.substring(format.marker.length) + 
                   text.substring(lineEnd === -1 ? text.length : lineEnd);
        } else {
          newText = text.substring(0, lineStart) + 
                   format.marker + 
                   currentLine + 
                   text.substring(lineEnd === -1 ? text.length : lineEnd);
        }
        break;
      }
      
      case 'block': {
        // Handle block formatting (code blocks)
        newText = text.substring(0, start) + 
                 format.marker +
                 selectedText +
                 (format.endMarker || '') +
                 text.substring(end);
        break;
      }
      
      case 'special': {
        // Handle special cases (links, images, horizontal rules)
        if (format.handler) {
          const newContent = format.handler(selectedText);
          newText = text.substring(0, start) + newContent + text.substring(end);
          newCursorPosition = start + newContent.length;
        } else {
          newText = text.substring(0, start) + format.marker + text.substring(end);
          newCursorPosition = start + format.marker.length;
        }
        break;
      }
    }
    
    setText(newText);
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const convertToHTML = (text: string): string => {
    let html = text;
    
    // Convert in specific order to handle nesting
    const conversions = [
      // Block elements first
      { pattern: /```([\s\S]*?)```/g, replacement: '<pre><code>$1</code></pre>' },
      { pattern: /^### (.*$)/gm, replacement: '<h3>$1</h3>' },
      { pattern: /^## (.*$)/gm, replacement: '<h2>$1</h2>' },
      { pattern: /^# (.*$)/gm, replacement: '<h1>$1</h1>' },
      { pattern: /^> (.*$)/gm, replacement: '<blockquote>$1</blockquote>' },
      { pattern: /^\d+\. (.*$)/gm, replacement: '<ol><li>$1</li></ol>' },
      { pattern: /^- (.*$)/gm, replacement: '<ul><li>$1</li></ul>' },
      { pattern: /^---([\s\S])/gm, replacement: '<hr>$1' },
      
      // Inline elements
      { pattern: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' },
      { pattern: /\*(.*?)\*/g, replacement: '<em>$1</em>' },
      { pattern: /`(.*?)`/g, replacement: '<code>$1</code>' },
      { pattern: /~~(.*?)~~/g, replacement: '<del>$1</del>' },
      { pattern: /\[(.*?)\]\((.*?)\)/g, replacement: '<a href="$2">$1</a>' },
      { pattern: /!\[(.*?)\]\((.*?)\)/g, replacement: '<img src="$2" alt="$1">' },
    ];

    conversions.forEach(({ pattern, replacement }) => {
      html = html.replace(pattern, replacement);
    });

    // Handle consecutive list items
    html = html.replace(/<\/[ou]l>\s*<[ou]l>/g, '');
    
    // Convert newlines
    html = html.replace(/\n/g, '<br>');
    
    return html;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Formatting toolbar */}
      <div className="flex flex-wrap gap-2 bg-gray-100 p-2 rounded">
        {/* Text style buttons */}
        <div className="flex gap-2 p-1 border-r border-gray-300">
          <button 
            onClick={() => formatText('bold')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Bold (**text**)"
          >
            <Bold size={20} />
          </button>
          <button 
            onClick={() => formatText('italic')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Italic (*text*)"
          >
            <Italic size={20} />
          </button>
          <button 
            onClick={() => formatText('code')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Inline Code (`text`)"
          >
            <Code size={20} />
          </button>
        </div>

        {/* Headers */}
        <div className="flex gap-2 p-1 border-r border-gray-300">
          <button 
            onClick={() => formatText('h1')}
            className="p-2 hover:bg-gray-200 rounded flex items-center"
            title="Heading 1 (# )"
          >
            <Hash size={20} />
            <span className="text-sm ml-1">1</span>
          </button>
          <button 
            onClick={() => formatText('h2')}
            className="p-2 hover:bg-gray-200 rounded flex items-center"
            title="Heading 2 (## )"
          >
            <Hash size={20} />
            <span className="text-sm ml-1">2</span>
          </button>
          <button 
            onClick={() => formatText('h3')}
            className="p-2 hover:bg-gray-200 rounded flex items-center"
            title="Heading 3 (### )"
          >
            <Hash size={20} />
            <span className="text-sm ml-1">3</span>
          </button>
        </div>

        {/* Lists and quotes */}
        <div className="flex gap-2 p-1 border-r border-gray-300">
          <button 
            onClick={() => formatText('bulletList')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Bullet List (- )"
          >
            <List size={20} />
          </button>
          <button 
            onClick={() => formatText('numberList')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Numbered List (1. )"
          >
            <ListOrdered size={20} />
          </button>
          <button 
            onClick={() => formatText('blockquote')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Blockquote (> )"
          >
            <Quote size={20} />
          </button>
        </div>

        {/* Special formats */}
        <div className="flex gap-2 p-1">
          <button 
            onClick={() => formatText('codeBlock')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Code Block (```)"
          >
            <TextQuote size={20} />
          </button>
          <button 
            onClick={() => formatText('horizontalRule')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Horizontal Rule (---)"
          >
            <Minus size={20} />
          </button>
          <button 
            onClick={() => formatText('link')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Link [text](url)"
          >
            <Link size={20} />
          </button>
          <button 
            onClick={() => formatText('image')}
            className="p-2 hover:bg-gray-200 rounded"
            title="Image ![alt](url)"
          >
            <Image size={20} />
          </button>
        </div>
      </div>

      {/* Text input area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Editor</h2>