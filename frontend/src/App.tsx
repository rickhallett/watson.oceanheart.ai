import React from 'react';
import { SimpleEditor } from './components/tiptap-templates/simple/simple-editor';
import { SparklesPreview } from './components/ui/sparkles-preview';

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <main className="w-full">
        <SparklesPreview />
      </main>
    </div>
  );
}

export default App;