// BulletEditorRQ3.tsx
import { useMemo, useRef, type ComponentProps } from "react";
import ReactQuill from "react-quill-new";
import "quill/dist/quill.snow.css";

// Get the library's prop types from the component itself
type RQProps = ComponentProps<typeof ReactQuill>;

export type ReactQuillProps = {
  value: string;
  onChange: (html: string) => void;
} & Omit<RQProps, "value" | "onChange">;

export default function ReactQuillEditor({ value, onChange, ...rest }: ReactQuillProps) {
  const quillRef = useRef<ReactQuill | null>(null);

  const quillModules: RQProps["modules"] = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["bold", "italic", "underline", "strike", "blockquote", "code-block", "link"],
        ["clean"],
      ],
      keyboard: {
        bindings: {
          // Keep the list when pressing Enter on an empty list item
          keepListOnEmptyEnter: {
            key: "Enter",
            format: ["list"],
            empty: true,
            handler(this: any, range: any, context: any) {
              const q = this.quill as any;
              q.insertText(range.index, "\n", "user");
              q.setSelection(range.index + 1, 0, "silent");
              // preserve current list type (bullet/ordered)
              q.formatLine(range.index + 1, 1, { list: context?.format?.list || "bullet" });
              return false;
            },
          },
          // Indent with Tab when inside a list
          tabIndent: {
            key: "Tab",
            format: ["list"],
            handler(this: any) {
              this.quill.format("indent", "+1");
              return false;
            },
          },
          // Outdent with Shift+Tab when inside a list
          shiftTabOutdent: {
            key: "Tab",
            shiftKey: true,
            format: ["list"],
            handler(this: any) {
              this.quill.format("indent", "-1");
              return false;
            },
          },
        },
      },
    }),
    []
  );

  const quillFormats: RQProps["formats"] = [
    "header",
    "list",
    "indent",
    "bold",
    "italic",
    "underline",
    "clean",
    "strike",
    "blockquote",
    "code-block",
    "link",
  ];

  const handleChange: RQProps["onChange"] = (html) => onChange(html);

  return (
    <ReactQuill
      ref={quillRef}
      theme="snow"
      value={value}
      onChange={handleChange}
      modules={quillModules}
      formats={quillFormats}
      style={{ height: 240 }}
      {...rest}
    />
  );
}
