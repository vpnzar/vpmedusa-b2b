"use client";

import { useState } from "react";
import { MeiliSearch, Hit } from "meilisearch";

const meili = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST || "http://localhost:7700",
  apiKey: process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY || "",
});

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Hit<Record<string, any>>[]>([]);

  async function handleSearch() {
    if (!query.trim()) return;

    try {
      const response = await meili
        .index("products")
        .search<Record<string, any>>(query, { limit: 10 });
      setResults(response.hits);
    } catch (error) {
      console.error("❌ Помилка пошуку:", error);
    }
  }

  return (
    <div className="relative w-80">
      <div className="flex items-center bg-white rounded shadow-md px-3 py-2">
        {/* Іконка лупи зліва */}
        <svg
          className="w-5 h-5 text-gray-500 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M15 11a6 6 0 1 1 6-6 6 6 0 0 1-6 6z"
          />
        </svg>

        {/* Поле введення */}
        <input
          type="text"
          placeholder="Search..."
          className="flex-grow outline-none text-gray-700 placeholder-gray-400"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />

        {/* Три крапки справа */}
        <svg
          className="w-5 h-5 text-gray-500 ml-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </div>

      {/* Випадаючий список результатів */}
      {results.length > 0 && (
        <ul className="absolute z-50 top-14 left-0 w-full bg-white border border-gray-300 rounded shadow-lg">
          {results.map((item) => (
            <li
              key={item.id}
              className="p-2 border-b hover:bg-gray-200 cursor-pointer text-black"
            >
              {item.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
