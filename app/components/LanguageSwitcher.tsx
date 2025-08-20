"use client";

import { Globe } from "lucide-react";
import { useI18n } from "../i18n/provider";
import { locales, localeNames, Locale } from "../i18n/config";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{localeNames[locale]}</span>
      </button>
      
      <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
        {locales.map((lang) => (
          <button
            key={lang}
            onClick={() => setLocale(lang as Locale)}
            className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
              locale === lang ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
            }`}
          >
            {localeNames[lang as Locale]}
          </button>
        ))}
      </div>
    </div>
  );
}