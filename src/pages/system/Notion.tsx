import React, { useState, useCallback } from 'react';
import { RichEditor } from "@/components/RichEditor";

const Notion = () => {
  const [editorContent, setEditorContent] = useState<Record<string, unknown>>({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: []
      }
    ]
  });

  const handleEditorChange = useCallback((json: Record<string, unknown>) => {
    setEditorContent(json);
  }, []);

  return (
    <div className="h-screen bg-[#191919] text-white">
      <div className="h-full max-w-4xl mx-auto">
        <RichEditor
          value={editorContent}
          onChange={handleEditorChange}
        />
      </div>
    </div>
  );
};

export default Notion;