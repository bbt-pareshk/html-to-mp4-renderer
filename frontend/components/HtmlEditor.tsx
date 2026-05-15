'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import type * as Monaco from 'monaco-editor';

// Monaco must be loaded client-side only
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function HtmlEditor({ value, onChange }: Props) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  function handleMount(editor: Monaco.editor.IStandaloneCodeEditor) {
    editorRef.current = editor;

    // Format on mount if content exists
    if (value.trim()) {
      setTimeout(() => editor.getAction('editor.action.formatDocument')?.run(), 200);
    }
  }

  return (
    <MonacoEditor
      height="100%"
      language="html"
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v ?? '')}
      onMount={handleMount}
      options={{
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontLigatures: true,
        lineNumbers: 'on',
        minimap: { enabled: false },
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        formatOnPaste: true,
        formatOnType: false,
        renderWhitespace: 'boundary',
        bracketPairColorization: { enabled: true },
        padding: { top: 12, bottom: 12 },
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
      }}
    />
  );
}
