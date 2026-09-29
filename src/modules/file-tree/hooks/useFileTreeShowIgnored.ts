import { useCallback, useState } from 'react';

const FILE_TREE_SHOW_IGNORED_STORAGE_KEY = 'file-tree-show-ignored';

type UseFileTreeShowIgnoredResult = {
  showIgnored: boolean;
  toggleShowIgnored: () => void;
};

function readStoredShowIgnored(): boolean {
  try {
    return localStorage.getItem(FILE_TREE_SHOW_IGNORED_STORAGE_KEY) === 'true';
  } catch {
    // Hide ignored files by default when storage is unavailable.
    return false;
  }
}

/** Whether the file tree also lists git-ignored entries; persisted like the view mode. */
export function useFileTreeShowIgnored(): UseFileTreeShowIgnoredResult {
  // Drives the listing request and the header toggle; read once during
  // initialization so the first fetch already uses the persisted choice.
  const [showIgnored, setShowIgnored] = useState<boolean>(readStoredShowIgnored);

  const toggleShowIgnored = useCallback(() => {
    setShowIgnored((current) => {
      const next = !current;
      try {
        localStorage.setItem(FILE_TREE_SHOW_IGNORED_STORAGE_KEY, String(next));
      } catch {
        // Keep runtime state even when persistence fails.
      }
      return next;
    });
  }, []);

  return {
    showIgnored,
    toggleShowIgnored,
  };
}
