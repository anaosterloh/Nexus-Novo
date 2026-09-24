// src/modules/documents/components/JoditWrapper.tsx
import React, { useRef, useMemo, forwardRef, useImperativeHandle, useEffect } from 'react';
import JoditEditor from 'jodit-react';

export interface JoditWrapperRef {
  insertText: (text: string) => void;
  getContent: () => string;
}

interface JoditWrapperProps {
  content: string;
  onChange: (content: string) => void;
}

export const JoditWrapper = forwardRef<JoditWrapperRef, JoditWrapperProps>(({ content, onChange }, ref) => {
  const editor = useRef<any>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      if (editor.current) {
         editor.current.selection.insertHTML(text);
         // Force sync on insert
         setTimeout(() => {
           if (editor.current) onChange(editor.current.value);
         }, 50);
      }
    },
    getContent: () => {
      return editor.current ? editor.current.value : content;
    }
  }));

  const config = useMemo(() => ({
    readonly: false,
    theme: 'default',
    enableDragAndDropFileToEditor: true,
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    // Remover completamente fullsize e botões perigosos
    disablePlugins: ['fullsize', 'video', 'print', 'about', 'file', 'source', 'stat'],
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'ul', 'ol', '|',
      'outdent', 'indent', 'align', '|',
      'font', 'fontsize', 'paragraph', '|', // removed table, link, image, brush temporarily per user instruction if they cause popups behind
      'hr', 'eraser', 'undo', 'redo'
    ],
    height: '100%', // Usa a altura do flex pai
    minHeight: 250,
    iframe: false,
    popupZIndex: 999999, // Garantir z-index alto
  }), []);

  const handleChange = (newContent: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (typeof onChange === 'function') {
        onChange(newContent);
      }
    }, 400); // debounce leve
  };

  return (
    <div className="w-full h-full flex-1 jodit-wrapper-container relative z-10 flex flex-col">
      <style>{`
        /* Crucial CSS fixes */
        .jodit-ui-popup, .jodit-popup {
           z-index: 999999 !important;
        }
        .jodit-wrapper-container .jodit-container {
           border: 1px solid #e4e4e7 !important;
           border-radius: 6px;
           background: transparent !important;
           display: flex;
           flex-direction: column;
           height: 100% !important;
        }
        .jodit-wrapper-container .jodit-workplace {
           background: #ffffff !important;
           flex: 1 !important; /* Grow exactly to fill */
           min-height: 250px !important;
           overflow-y: auto !important;
        }
        .dark .jodit-wrapper-container .jodit-workplace {
           background: #18181b !important;
        }
        .jodit-wrapper-container .jodit-wysiwyg {
           padding: 16px !important;
           outline: none !important;
           height: 100% !important;
        }
        .jodit-wrapper-container .jodit-toolbar__box {
           background: #f8fafc !important;
           border-bottom: 1px solid #e4e4e7 !important;
           border-radius: 6px 6px 0 0 !important;
        }
        .dark .jodit-wrapper-container .jodit-toolbar__box {
           background: #27272a !important;
           border-bottom: 1px solid #3f3f46 !important;
        }
      `}</style>
      <JoditEditor
        ref={editor}
        value={content}
        config={config}
        onBlur={newContent => onChange(newContent)}
        onChange={handleChange}
      />
    </div>
  );
});
