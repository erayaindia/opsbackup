import React, { useState } from 'react';
import { RichEditor } from "@/components/RichEditor";

const Notion = () => {
  const [editorContent, setEditorContent] = useState<any>({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: []
      }
    ]
  });

  const handleEditorChange = (json: any) => {
    setEditorContent(json);
  };

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