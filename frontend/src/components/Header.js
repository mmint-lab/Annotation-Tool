import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { FileText, LogOut, Sun, Moon, Shield } from "lucide-react";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <header className="bg-card border-b border-border shadow-sm" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button type="button" onClick={() => navigate("/home")} className="flex items-center space-x-3 hover:opacity-80">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-semibold text-foreground hidden sm:block">SDOH Annotation Tool</h1>
          </button>
          {user && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle dark mode" title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <div className="hidden sm:flex items-center space-x-2">
                {user.role === "admin" && <Shield className="h-4 w-4 text-purple-600" title="Administrator" />}
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline" onClick={() => navigate("/account")}>
                  {user.full_name}
                </button>
                <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} aria-label="Logout">
                <LogOut className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
