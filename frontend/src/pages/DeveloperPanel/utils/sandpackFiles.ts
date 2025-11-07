// src/pages/DeveloperPanel/utils/sandpackFiles.ts

import { QueryResult } from '../types';

export const generateSandpackFiles = (code: string, queryResult: QueryResult | null) => {
  const rows = queryResult?.data ?? [];
  const cols = queryResult?.columns ?? [];

  return {
    '/index.html': '<div id="root"></div>',
    '/index.js': `
      import React from "react";
      import { createRoot } from "react-dom/client";
      import App from "./App";
      const root = createRoot(document.getElementById("root"));
      root.render(React.createElement(App));
    `,
    '/data.js': `export const data = ${JSON.stringify(rows)};\nexport const columns = ${JSON.stringify(cols)};`,
    '/App.jsx': code,
  };
};
