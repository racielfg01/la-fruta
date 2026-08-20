'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useSettingsStore } from '@/lib/settings-store';

export function SettingsApplicator() {
  const init = useSettingsStore((s) => s.init);
  const settings = useSettingsStore((s) => s.settings);
  const { setTheme } = useTheme();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!settings.font) return;
    // El usuario puede haber elegido tema manualmente (next-themes lo persiste)
    const storedTheme = (() => {
      try {
        return localStorage.getItem('theme');
      } catch {
        return null;
      }
    })();
    if (!storedTheme && settings.theme) {
      setTheme(settings.theme);
    }
  }, [settings.theme, setTheme]);

  useEffect(() => {
    const root = document.documentElement;
    const headingFont =
      settings.font === 'poppins' ? "'Poppins', sans-serif" : "'Playfair Display', Georgia, serif";
    const bodyFont = settings.font === 'playfair' ? "'Playfair Display', Georgia, serif" : "'Poppins', sans-serif";
    root.style.setProperty('--font-playfair', headingFont);
    root.style.setProperty('--font-sans', bodyFont);
  }, [settings.font]);

  return null;
}