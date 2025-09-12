import React from 'react';
import TipTapEditor from './components/TipTapEditor';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Watson - Clinical LLM Review Tool</h1>
        <p>Review and curate LLM outputs for clinical applications</p>
      </header>
      
      <main className="app-main">
        <div className="editor-container">
          <h2>Rich Text Editor</h2>
          <TipTapEditor />
        </div>
      </main>
    </div>
  );
}

export default App;