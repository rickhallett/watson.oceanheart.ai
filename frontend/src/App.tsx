import React from 'react';
import { SimpleEditor } from './components/tiptap-templates/simple/simple-editor';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Watson - Clinical LLM Review Tool</h1>
        <p>Review and curate LLM outputs for clinical applications</p>
      </header>

      <main className="app-main">
        <SimpleEditor />
      </main>
    </div>
  );
}

export default App;