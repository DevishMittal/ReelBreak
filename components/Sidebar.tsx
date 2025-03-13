"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiSettings, FiClock, FiMenu, FiX } from "react-icons/fi";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  // Persist sidebar state in localStorage (optional)
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarOpen");
    if (savedState) {
      setIsOpen(JSON.parse(savedState));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarOpen", JSON.stringify(isOpen));
  }, [isOpen]);

  const toggleSidebar = () => setIsOpen(!isOpen);

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
      {/* Toggle Button */}
      <div className="flex justify-between items-center mb-6">
        {isOpen && <h1 className="text-2xl font-bold">ReelBreak</h1>}
        <button onClick={toggleSidebar} className="text-white hover:text-purple-300 focus:outline-none">
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
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
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold">
            JD
          </div>
          {isOpen && (
            <div>
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-gray-400">john.doe@example.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}