// components/LexicalEditor.tsx
import React from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'
import { $generateHtmlFromNodes } from '@lexical/html'

import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { TableNode, TableRowNode, TableCellNode } from '@lexical/table'
import { CodeNode } from '@lexical/code'
import { LinkNode } from '@lexical/link'
import type { EditorState } from 'lexical'
import { ToolbarPlugin } from './LexicalToolbarPlugin'

const theme = {
  paragraph: 'mb-2',
  heading: { h1: 'text-3xl font-bold', h2: 'text-2xl font-bold', h3: 'text-xl font-semibold' },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    highlight: 'bg-yellow-200',
    code: 'font-mono text-sm px-1 rounded',
  },
  quote: 'border-l-4 pl-3 italic text-gray-600',
}

export default function LexicalEditor({
  initialJSON,
  onChange,
}: {
  initialJSON?: any
  onChange?: (v: { json: any; html: string; text: string }) => void
}) {
  const initialConfig = {
    theme,
    namespace: 'WeeklyAccompEditor',
    onError: (e: Error) => console.error(e),
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, TableNode, TableRowNode, TableCellNode, CodeNode, LinkNode],
    editorState: initialJSON
      ? (editor: any) => editor.setEditorState(editor.parseEditorState(initialJSON))
      : undefined,
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="border rounded-md p-4 bg-white">
        <ToolbarPlugin />
        <RichTextPlugin
          contentEditable={<ContentEditable className="lexical-editor p-2" />}
          placeholder={<div className="text-gray-400">Describe your accomplishments…</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <AutoFocusPlugin />
        <ListPlugin />
        <LinkPlugin />
        <TablePlugin hasCellMerge />

        <OnChangePlugin
          onChange={(editorState: EditorState, editor) => {
            const json = editorState.toJSON()
            let html = ''
            let text = ''
            editorState.read(() => {
              html = $generateHtmlFromNodes(editor)
              text = editor.getRootElement()?.innerText ?? ''
            })
            console.log('Editor state changed:', { json, html, text })
            onChange?.({ json, html, text })
          }}
        />
      </div>
    </LexicalComposer>
  )
}
