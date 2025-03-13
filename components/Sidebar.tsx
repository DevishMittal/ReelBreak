"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiSettings, FiClock, FiMenu, FiX, FiMoon, FiSun } from "react-icons/fi";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const pathname = usePathname();

  // Persist sidebar and dark mode state in localStorage
  useEffect(() => {
    const savedSidebarState = localStorage.getItem("sidebarOpen");
    if (savedSidebarState) {
      setIsOpen(JSON.parse(savedSidebarState));
    }
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
      document.body.classList.toggle("dark", JSON.parse(savedDarkMode));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isOpen));
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    document.body.classList.toggle("dark", darkMode);
  }, [isOpen, darkMode]);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleDarkMode = () => setDarkMode(!darkMode);

  const navItems = [
    { href: "/", label: "Dashboard", icon: <FiHome /> },
    { href: "/sessions", label: "Sessions", icon: <FiClock /> },
    { href: "/settings", label: "Settings", icon: <FiSettings /> },
  ];

  return (
    <aside
      className={`${
        isOpen ? "w-64" : "w-16"
      } bg-gradient-to-b from-purple-800 to-purple-900 text-white min-h-screen p-4 flex flex-col transition-all duration-300 ease-in-out shadow-lg`}
    >
      {/* Toggle Button and Dark Mode Toggle */}
      <div className="flex justify-between items-center mb-6">
        {isOpen && <h1 className="text-2xl font-bold">ReelBreak</h1>}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleDarkMode}
            className="text-white hover:text-purple-300 focus:outline-none"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <FiSun size={24} /> : <FiMoon size={24} />}
          </button>
          <button onClick={toggleSidebar} className="text-white hover:text-purple-300 focus:outline-none">
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
                  pathname === item.href
                    ? "bg-purple-700 text-white"
                    : "text-gray-200 hover:bg-purple-700 hover:text-white"
                } ${!isOpen && "justify-center"}`}
              >
                <span className="text-xl">{item.icon}</span>
                {isOpen && <span className="text-lg font-medium">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="mt-auto pt-4 border-t border-purple-600">
        <div className={`flex items-center ${isOpen ? "space-x-3" : "justify-center"}`}>
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold">
            JD
          </div>
          {isOpen && (
            <div>
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">john.doe@example.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}