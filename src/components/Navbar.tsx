"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion"
import { Menu, X, ChevronDown, User, LogOut, ShieldAlert } from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ThemeToggle } from "./ThemeToggle"
import { cn } from "@/lib/utils"

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50)
  })

  const location = useLocation()
  const navigate = useNavigate()

  const userString = localStorage.getItem('user')
  const user = userString ? JSON.parse(userString) : null
  const isAdmin = user?.role === 'admin'

  const toggleMenu = () => setIsOpen(!isOpen)

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsOpen(false);
    setIsDropdownOpen(false);
    navigate('/');
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const mainLinks = [
    { name: "Events", path: "/events" },
    { name: "Blog", path: "/blog" },
    { name: "Suggestions", path: "/suggestions" },
    { name: "Membership", path: "/membership" },
  ]

  return (
    <motion.div 
      className={cn(
        "fixed top-0 left-0 w-full flex justify-center z-50 pointer-events-none transition-all duration-500 ease-in-out",
        isScrolled ? "py-4 px-4 md:px-8" : "py-6 px-4"
      )}
    >
      <motion.div 
        className={cn(
          "flex items-center justify-between relative z-10 pointer-events-auto transition-all duration-500 ease-in-out",
          isScrolled 
            ? "w-full max-w-none px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border shadow-sm" 
            : "w-full max-w-5xl px-6 py-3 bg-background/80 backdrop-blur-md rounded-full shadow-lg border border-border mt-4"
        )}
      >
        <div className="flex items-center z-20">
          <Link to="/">
            <motion.div
              className="mr-6 flex items-center justify-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <img 
                src="/logos/LUMS - Banner Logo_Transparent.png" 
                alt="LUMS Logo" 
                className="h-8 object-contain hidden dark:block transition-all duration-500"
              />
              <img 
                src="/logos/LUMS - Banner Logo_Transparent.png" 
                alt="LUMS Logo" 
                className="h-8 object-contain dark:hidden transition-all duration-500"
              />
            </motion.div>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-6 absolute left-1/2 -translate-x-1/2 z-20">
          {mainLinks.map((item) => (
            <motion.div
              key={item.name}
              whileHover={{ y: -2 }}
            >
              <Link 
                to={item.path} 
                className={`text-sm font-semibold transition-colors ${
                  location.pathname === item.path ? 'text-primary' : 'text-foreground/70 hover:text-primary'
                }`}
              >
                {item.name}
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Desktop Right Side Actions */}
        <div className="hidden md:flex items-center space-x-4 z-20">
          <ThemeToggle />
          
          <div className="relative" ref={dropdownRef}>
            {user ? (
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <span className="text-sm font-medium">🌟 {user.first_name}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-[#004aac] transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-5 py-2 text-sm font-semibold text-white bg-primary rounded-full hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
                >
                  Join Us!
                </Link>
              </div>
            )}

            {/* Dropdown Menu for Logged in Users */}
            <AnimatePresence>
              {user && isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-48 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50"
                >
                  <div className="p-2 space-y-1">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-600 dark:text-amber-500 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-3 z-20">
          <ThemeToggle />
          <motion.button 
            className="flex items-center text-[#004aac] dark:text-[#5fa2ff] p-1" 
            onClick={toggleMenu} 
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="h-6 w-6" />
          </motion.button>
        </div>
      </motion.div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-white dark:bg-zinc-950 z-50 pt-24 px-6 lg:hidden pointer-events-auto overflow-y-auto"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <motion.button
              className="absolute top-6 right-6 p-2 text-[#004aac] dark:text-[#5fa2ff]"
              onClick={toggleMenu}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <X className="h-8 w-8" />
            </motion.button>

            {user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 pb-6 border-b border-gray-100 dark:border-zinc-800"
              >
                <p className="text-xl font-medium text-gray-500 dark:text-gray-400">Welcome back,</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">🌟 {user.first_name}</p>
              </motion.div>
            )}

            <div className="flex flex-col space-y-6">
              {mainLinks.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 + 0.1 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Link 
                    to={item.path} 
                    className={`text-2xl font-bold ${
                      location.pathname === item.path ? 'text-[#004aac] dark:text-[#5fa2ff]' : 'text-gray-900 dark:text-gray-100'
                    }`}
                    onClick={toggleMenu}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="pt-6 mt-4 border-t border-gray-100 dark:border-zinc-800 flex flex-col gap-4"
              >
                {!user ? (
                  <>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center w-full px-5 py-4 text-lg font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-zinc-800 rounded-2xl hover:bg-gray-200 transition-colors"
                      onClick={toggleMenu}
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="inline-flex items-center justify-center w-full px-5 py-4 text-lg font-bold text-white bg-primary rounded-2xl hover:bg-primary/90 transition-colors shadow-md"
                      onClick={toggleMenu}
                    >
                      Become a Member
                    </Link>
                  </>
                ) : (
                  <>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="inline-flex items-center justify-center w-full gap-2 px-5 py-4 text-lg font-bold text-amber-700 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400 rounded-2xl transition-colors"
                        onClick={toggleMenu}
                      >
                        <ShieldAlert className="w-5 h-5" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="inline-flex items-center justify-center w-full gap-2 px-5 py-4 text-lg font-bold text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-2xl transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
