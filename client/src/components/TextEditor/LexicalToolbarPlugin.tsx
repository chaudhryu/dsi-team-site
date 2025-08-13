// LexicalToolbarPlugin.tsx (Lexical 0.34.x)
import React, { useEffect, useState } from 'react'
import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  TextFormatType,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $insertNodes,
  $getRoot,
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list'

import {
  $createHeadingNode,
  $createQuoteNode,
} from '@lexical/rich-text'

import { TOGGLE_LINK_COMMAND } from '@lexical/link'
import { $setBlocksType } from '@lexical/selection'

import {
  $createTableNodeWithDimensions,
  $isTableCellNode,
  $isTableSelection,
  $insertTableRowAtSelection,
  $insertTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $deleteTableColumnAtSelection,
  $mergeCells,
  $unmergeCell,
  $findCellNode,
} from '@lexical/table'

import { $createCodeNode } from '@lexical/code'

const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => (
  <button
    {...props}
    type="button"
    className={`px-3 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-blue-100 ${props.className ?? ''}`}
  />
)

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const [inTable, setInTable] = useState(false)

  // Detect if selection is in a table cell
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const sel = $getSelection()
        if ($isRangeSelection(sel)) {
          let node = sel.anchor.getNode()
          let found = false
          while (node) {
            if ($isTableCellNode(node)) {
              found = true
              break
            }
            const parent = node.getParent()
            if (!parent) break
            node = parent
          }
          setInTable(found)
        } else {
          setInTable(false)
        }
      })
    })
  }, [editor])

  const applyFormat = (type: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, type)
  }

  const setHeading = (level: 0 | 1 | 2 | 3) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        if (level === 0) {
          $setBlocksType(selection, () => $createParagraphNode())
        } else {
          $setBlocksType(selection, () => $createHeadingNode(`h${level}`))
        }
      }
    })
  }

  const setBlockQuote = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode())
      }
    })
  }

  const setCodeBlock = () => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createCodeNode())
      }
    })
  }

  const insertTable = () => {
    editor.update(() => {
      const tableNode = $createTableNodeWithDimensions(3, 3)
      $insertNodes([tableNode])
      // drop a paragraph after so user can exit the table easily
      $getRoot().append($createParagraphNode())
    })
  }

  const insertLink = () => {
    const url = window.prompt('Enter URL (https://...)')
    if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
  }

  const removeLink = () => editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)

  const align = (v: 'left' | 'center' | 'right' | 'justify') =>
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, v)

  return (
    <div className="mb-3 flex flex-wrap gap-2 border-b pb-2">
      {/* Inline text */}
      <Btn onClick={() => applyFormat('bold')}>Bold</Btn>
      <Btn onClick={() => applyFormat('italic')}>Italic</Btn>
      <Btn onClick={() => applyFormat('underline')}>Underline</Btn>
      <Btn onClick={() => applyFormat('strikethrough')}>Strike</Btn>
      <Btn onClick={() => applyFormat('highlight')}>Highlight</Btn>

      {/* Headings */}
      <Btn onClick={() => setHeading(0)}>P</Btn>
      <Btn onClick={() => setHeading(1)}>H1</Btn>
      <Btn onClick={() => setHeading(2)}>H2</Btn>
      <Btn onClick={() => setHeading(3)}>H3</Btn>

      {/* Alignment */}
      <Btn onClick={() => align('left')}>Left</Btn>
      <Btn onClick={() => align('center')}>Center</Btn>
      <Btn onClick={() => align('right')}>Right</Btn>
      <Btn onClick={() => align('justify')}>Justify</Btn>

      {/* Lists */}
      <Btn onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}>• List</Btn>
      <Btn onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}>1. List</Btn>
      <Btn onClick={() => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)}>Clear List</Btn>

      {/* Links */}
      <Btn onClick={insertLink}>Link</Btn>
      <Btn onClick={removeLink}>Unlink</Btn>

      {/* Blocks */}
      <Btn onClick={setBlockQuote}>Quote</Btn>
      <Btn onClick={setCodeBlock}>Code</Btn>
      <Btn onClick={insertTable}>Insert Table 3×3</Btn>

      {/* Table editing (only when inside a table) */}
      {inTable && (
        <>
          <span className="mx-2 w-px bg-gray-300" />
          <span className="text-xs text-gray-600 self-center">Table:</span>

          {/* Rows */}
          <Btn onClick={() => editor.update(() => $insertTableRowAtSelection(false))}>
            + Row Above
          </Btn>
          <Btn onClick={() => editor.update(() => $insertTableRowAtSelection(true))}>
            + Row Below
          </Btn>
          <Btn onClick={() => editor.update(() => $deleteTableRowAtSelection())}>
            − Row
          </Btn>

          {/* Columns */}
          <Btn onClick={() => editor.update(() => $insertTableColumnAtSelection(false))}>
            + Col Left
          </Btn>
          <Btn onClick={() => editor.update(() => $insertTableColumnAtSelection(true))}>
            + Col Right
          </Btn>
          <Btn onClick={() => editor.update(() => $deleteTableColumnAtSelection())}>
            − Col
          </Btn>

          {/* Merge / Unmerge (works when a multi-cell table selection is active) */}
          <Btn
            onClick={() =>
              editor.update(() => {
                const sel = $getSelection()
                if ($isTableSelection(sel)) {
                  const cells = sel.getNodes()
                    .map((n) => $findCellNode(n))
                    .filter(Boolean) as any
                  if (cells.length > 1) $mergeCells(cells)
                }
              })
            }
          >
            Merge
          </Btn>
          <Btn onClick={() => editor.update(() => $unmergeCell())}>
            Unmerge
          </Btn>
        </>
      )}
    </div>
  )
}
