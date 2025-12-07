'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-logo" onClick={closeMenu}>
          <span className="logo-icon">☯</span> Yoga Session
        </Link>
        
        <button 
          className={`hamburger ${isOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <li className="nav-item">
            <Link href="/" className="nav-link" onClick={closeMenu}>
              <span className="nav-icon">⌂</span> Home
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/cards" className="nav-link" onClick={closeMenu}>
              <span className="nav-icon">◈</span> Cards
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/sets" className="nav-link" onClick={closeMenu}>
              <span className="nav-icon">📚</span> Sets
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/sessions" className="nav-link" onClick={closeMenu}>
              <span className="nav-icon">☰</span> Sessions
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
