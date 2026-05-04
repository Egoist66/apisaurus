'use client';

import { useEffect, useRef } from 'react';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  callback: (e: KeyboardEvent) => void;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      for (const shortcut of shortcutsRef.current) {
        const matches =
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          (shortcut.ctrlKey === undefined || e.ctrlKey === shortcut.ctrlKey || e.metaKey === shortcut.metaKey) &&
          (shortcut.shiftKey === undefined || e.shiftKey === shortcut.shiftKey) &&
          (shortcut.altKey === undefined || e.altKey === shortcut.altKey);

        if (matches) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.callback(e);
          break;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
