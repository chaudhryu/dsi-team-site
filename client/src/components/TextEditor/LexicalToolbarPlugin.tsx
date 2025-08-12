import { FORMAT_TEXT_COMMAND, TextFormatType } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()

  const applyFormat = (type: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, type)
  }

  return (
    <div className="mb-3 flex gap-2 border-b pb-2">
      <button
        className="px-3 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-blue-100"
        onClick={() => applyFormat('bold')}
      >
        Bold
      </button>
      <button
        className="px-3 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-blue-100"
        onClick={() => applyFormat('italic')}
      >
        Italic
      </button>
      <button
        className="px-3 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-blue-100"
        onClick={() => applyFormat('underline')}
      >
        Underline
      </button>
    </div>
  )
}
