// LexicalEditor.tsx
import React from 'react'
import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'

import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { ToolbarPlugin } from './LexicalToolbarPlugin'
import { EditorState } from 'lexical'
const theme = {
  paragraph: 'mb-2',
  heading: {
    h1: 'text-3xl font-bold',
    h2: 'text-2xl font-bold',
    h3: 'text-xl font-semibold',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
}

const editorConfig = {
  theme,
  namespace: 'LexicalEditor',
  onError: (error: Error) => {
    console.error('Lexical error:', error)
  },
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
}

export default function LexicalEditor() {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="border rounded-md p-4 bg-white">
        <ToolbarPlugin />
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="min-h-[300px] p-2 outline-none prose max-w-none" />
          }
          placeholder={<div className="text-gray-400">Start typing...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
       <OnChangePlugin
  onChange={(editorState: EditorState) => {
    editorState.read(() => {
      const json = editorState.toJSON()
      console.log('Editor content as JSON:', json)
    })
  }}
/>
      </div>
    </LexicalComposer>
  )
}
