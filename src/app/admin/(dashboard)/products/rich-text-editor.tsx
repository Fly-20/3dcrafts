"use client";

import { useEffect, useRef } from "react";
import { $getRoot, $insertNodes, FORMAT_TEXT_COMMAND, type EditorState, type LexicalEditor } from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListNode, ListItemNode, INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from "@lexical/list";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";

function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const buttonClass = "border border-black/20 px-2.5 py-1 text-xs hover:border-black";

  return (
    <div className="flex gap-1 border border-b-0 border-black/20 bg-black/[.03] p-1.5">
      <button type="button" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")} className={`${buttonClass} font-bold`}>
        B
      </button>
      <button type="button" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")} className={`${buttonClass} italic`}>
        I
      </button>
      <button type="button" onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)} className={buttonClass}>
        • List
      </button>
      <button type="button" onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)} className={buttonClass}>
        1. List
      </button>
    </div>
  );
}

/** Hydrates the editor from a stored HTML string once on mount — the description column stores Lexical's HTML export, not markdown/JSON. */
function InitialContentPlugin({ html }: { html: string }) {
  const [editor] = useLexicalComposerContext();
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current || !html) return;
    hydrated.current = true;
    editor.update(() => {
      const dom = new DOMParser().parseFromString(html, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      $getRoot().clear();
      $getRoot().select();
      $insertNodes(nodes);
    });
  }, [editor, html]);

  return null;
}

/** Rich text editor for the product description — writes its HTML export into a hidden input so the existing form action (formData.get("description")) needs no changes. */
export function RichTextEditor({ name, initialHtml }: { name: string; initialHtml: string }) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  function handleChange(editorState: EditorState, editor: LexicalEditor) {
    editorState.read(() => {
      const isEmpty = $getRoot().getTextContent().trim() === "";
      const html = isEmpty ? "" : $generateHtmlFromNodes(editor, null);
      if (hiddenInputRef.current) hiddenInputRef.current.value = html;
    });
  }

  return (
    <LexicalComposer
      initialConfig={{
        namespace: "product-description",
        nodes: [ListNode, ListItemNode],
        onError: (error) => console.error(error),
        theme: {
          text: { bold: "font-semibold", italic: "italic" },
          list: { ul: "list-disc pl-5", ol: "list-decimal pl-5", listitem: "pl-1" },
        },
      }}
    >
      <input ref={hiddenInputRef} type="hidden" name={name} defaultValue={initialHtml} />
      <Toolbar />
      <div className="relative">
        <RichTextPlugin
          contentEditable={<ContentEditable className="min-h-[140px] border border-black/20 px-3 py-2 text-sm leading-relaxed outline-none focus:border-black" />}
          placeholder={<div className="pointer-events-none absolute top-2 left-3 text-sm text-black/40">Product description…</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
      <HistoryPlugin />
      <ListPlugin />
      <OnChangePlugin onChange={handleChange} />
      <InitialContentPlugin html={initialHtml} />
    </LexicalComposer>
  );
}
