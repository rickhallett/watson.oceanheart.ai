import { GlobalWindow } from "happy-dom";

// Setup DOM environment for React component tests
const window = new GlobalWindow({
  url: 'http://localhost:3001',
  width: 1024,
  height: 768,
});

global.window = window as any;
global.document = window.document as any;
global.navigator = window.navigator as any;
global.HTMLElement = window.HTMLElement as any;
global.Element = window.Element as any;
global.Node = window.Node as any;
global.DocumentFragment = window.DocumentFragment as any;
global.Text = window.Text as any;
