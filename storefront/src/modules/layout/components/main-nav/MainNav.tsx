"use client";

import SearchBar from "../search/SearchBar";

export default function MainNav() {
  return (
    <nav className="flex items-center justify-between bg-neutral-900 text-neutral-50 p-4">
      <div className="flex gap-4 text-sm">
        <a href="/catalog">Каталог</a>
        <a href="/store">Магазин</a>
        <a href="/brands">Бренди</a>
        <a href="/variants">Варіанти</a>
        <a href="/news">Новини</a>
      </div>
      <SearchBar />
    </nav>
  );
}

