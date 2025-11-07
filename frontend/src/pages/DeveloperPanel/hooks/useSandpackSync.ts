// frontend/src/pages/DeveloperPanel/hooks/useSandpackSync.ts

import { useEffect, useState } from 'react';

export const useSandpackSync = (initialCode: string) => {
  const [code, setCode] = useState(initialCode);

  const updateCode = (newCode: string) => {
    setCode(newCode);
    // Убираем console.log
    // console.log('📝 Sandpack code updated:', newCode.slice(0, 100));
  };

  const getCurrentCode = () => code;

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  return {
    updateCode,
    getCurrentCode
  };
};
