"use client";

import { ReactNode, useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import {
  Link1,
  Menu,
  MenuBoard,
  TextBold,
  TextItalic,
  TextUnderline,
  TextalignCenter,
  TextalignLeft,
  TextalignRight,
  TextBlock,
} from "iconsax-react";

type CommunicationRichEditorProps = {
  value: string;
  onChange: (html: string) => void;
  className?: string;
};

type ToolbarButtonProps = {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
};

function ToolbarButton({ label, icon, active = false, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`inline-flex h-6 min-w-6 items-center justify-center rounded px-1 text-xs ${
        active ? "bg-zinc-200 text-primary-text" : "text-zinc-600 hover:bg-zinc-100"
      }`}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

export function CommunicationRichEditor({
  value,
  onChange,
  className = "",
}: CommunicationRichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "h-full min-h-75 w-full rounded-t-md px-3 py-2 text-sm text-primary-text outline-none prose prose-sm max-w-none",
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      onChange(nextEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className={`flex min-h-90 flex-col ${className}`.trim()}>
        <div className="min-h-75 flex-1 rounded-t-md px-3 py-2 text-sm text-zinc-400">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-90 flex-col ${className}`.trim()}>
      <div className="min-h-0 flex-1">
        <EditorContent editor={editor} />
      </div>
      <div className="flex h-10 items-center gap-1 border-t border-zinc-200 px-2">
        <ToolbarButton
          label="Bold"
          icon={<TextBold size={14} variant="Outline" color="currentColor" />}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="Italic"
          icon={<TextItalic size={14} variant="Outline" color="currentColor" />}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="Underline"
          icon={<TextUnderline size={14} variant="Outline" color="currentColor" />}
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          label="Strike"
          icon={<TextBlock size={14} variant="Outline" color="currentColor" />}
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <ToolbarButton
          label="Align Left"
          icon={<TextalignLeft size={14} variant="Outline" color="currentColor" />}
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        />
        <ToolbarButton
          label="Align Center"
          icon={<TextalignCenter size={14} variant="Outline" color="currentColor" />}
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        />
        <ToolbarButton
          label="Align Right"
          icon={<TextalignRight size={14} variant="Outline" color="currentColor" />}
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        />
        <ToolbarButton
          label="Bulleted List"
          icon={<Menu size={14} variant="Outline" color="currentColor" />}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="Ordered List"
          icon={<MenuBoard size={14} variant="Outline" color="currentColor" />}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="Link"
          icon={<Link1 size={14} variant="Outline" color="currentColor" />}
          active={editor.isActive("link")}
          onClick={() => {
            const previousUrl = editor.getAttributes("link").href as string | undefined;
            const url = window.prompt("Enter URL", previousUrl ?? "");
            if (url === null) return;
            if (url.trim() === "") {
              editor.chain().focus().unsetLink().run();
              return;
            }
            editor.chain().focus().setLink({ href: url.trim() }).run();
          }}
        />
      </div>
    </div>
  );
}
