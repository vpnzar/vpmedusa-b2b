import React from "react";

import Footer from "@/modules/layout/templates/footer";
import { NavigationHeader } from "@/modules/layout/templates/nav";
import MainNav from "@/modules/layout/components/main-nav/MainNav"; // ✅ Додаємо MainNav

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div>
      <NavigationHeader />
      <MainNav /> {/* ✅ Тепер меню є частиною Layout */}
      <main className="relative">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;