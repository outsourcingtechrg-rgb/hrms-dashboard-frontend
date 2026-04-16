import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/rig.png";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Sidebar({
  isOpen,
  setIsOpen,
  sidebarItems = [],
  collapsed = false,
  setCollapsed = () => {},
}) {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const mainItems = sidebarItems.filter((item) => !item.my);
  const myItems = sidebarItems.filter((item) => item.my);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

        .hrms-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(2px);
          z-index: 40;
        }

        .hrms-sidebar {
          font-family: 'DM Sans', sans-serif;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 50;
          height: 100vh;
          background: #ffffff;
          border-right: 1px solid #f0ebe8;
          display: flex;
          flex-direction: column;
          transition: width 0.25s cubic-bezier(0.4,0,0.2,1),
                      transform 0.25s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden;
        }

        .hrms-sidebar.collapsed {
          width: 72px;
        }

        .hrms-sidebar.expanded {
          width: 240px;
        }

        .hrms-sidebar.hidden {
          transform: translateX(-100%);
        }

        @media (max-width: 768px) {
          .hrms-sidebar {
            box-shadow: 4px 0 24px rgba(0,0,0,0.12);
          }
        }

        /* Logo row */
        .hrms-sidebar-logo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 14px 16px;
          border-bottom: 1px solid #f5f0ee;
          flex-shrink: 0;
          min-height: 64px;
        }

        .hrms-logo-img {
          width: 80px;
          object-fit: contain;
          flex-shrink: 0;
        }

        .hrms-collapse-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid #f0ebe8;
          background: #fafafa;
          cursor: pointer;
          color: #6b6b6b;
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .hrms-collapse-btn:hover {
          background: #fff1ee;
          border-color: #f5c4b0;
          color: #e8502a;
        }

        /* Scrollable nav area */
        .hrms-sidebar-nav {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px 10px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          scrollbar-width: none;
        }

        .hrms-sidebar-nav::-webkit-scrollbar { display: none; }

        /* Section */
        .hrms-section-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #c0b8b4;
          padding: 0 8px;
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
        }

        .hrms-section-items {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        /* Nav item */
        .hrms-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 10px;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s;
          position: relative;
          text-decoration: none;
          min-height: 42px;
        }

        .hrms-nav-item:hover {
          background: #fff3ef;
          border-color: #fde0d4;
        }

        .hrms-nav-item:hover .hrms-nav-icon-wrap {
          background: #e8502a;
          border-color: #e8502a;
        }

        .hrms-nav-item:hover .hrms-nav-icon-wrap svg {
          color: #ffffff;
        }

        .hrms-nav-item:hover .hrms-nav-label {
          color: #c94a1f;
        }

        .hrms-nav-item:hover .hrms-nav-arrow {
          opacity: 1;
          color: #e8502a;
        }

        /* Active state */
        .hrms-nav-item.active {
          background: #fff3ef;
          border-color: #fde0d4;
        }

        .hrms-nav-item.active .hrms-nav-icon-wrap {
          background: #e8502a;
          border-color: #e8502a;
        }

        .hrms-nav-item.active .hrms-nav-icon-wrap svg {
          color: #ffffff;
        }

        .hrms-nav-item.active .hrms-nav-label {
          color: #c94a1f;
          font-weight: 600;
        }

        .hrms-nav-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #ede8e5;
          background: #fafafa;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s;
          color: #6b6b6b;
        }

        .hrms-nav-icon-wrap svg {
          transition: color 0.15s;
        }

        .hrms-nav-label {
          font-size: 13.5px;
          font-weight: 500;
          color: #3d3d3d;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.15s;
        }

        .hrms-nav-arrow {
          opacity: 0;
          flex-shrink: 0;
          transition: opacity 0.15s;
          color: #e8502a;
        }

        /* Tooltip (collapsed mode) */
        .hrms-tooltip {
          position: absolute;
          left: 56px;
          background: #1a1a1a;
          color: #ffffff;
          font-size: 12px;
          font-weight: 500;
          padding: 5px 10px;
          border-radius: 7px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.15s, transform 0.15s;
          z-index: 100;
          font-family: 'DM Sans', sans-serif;
        }

        .hrms-nav-item:hover .hrms-tooltip {
          opacity: 1;
          transform: translateX(0);
        }

        /* Sidebar footer */
        .hrms-sidebar-footer {
          padding: 12px 10px;
          border-top: 1px solid #f5f0ee;
          flex-shrink: 0;
        }

        .hrms-footer-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 10px;
          background: #fff8f5;
          border: 1px solid #fde8df;
          overflow: hidden;
        }

        .hrms-footer-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #4caf50;
          flex-shrink: 0;
          box-shadow: 0 0 0 2px rgba(76,175,80,0.2);
        }

        .hrms-footer-text {
          font-size: 12px;
          color: #b07060;
          font-weight: 500;
          white-space: nowrap;
        }
      `}</style>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="hrms-overlay md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside
        className={[
          "hrms-sidebar",
          collapsed ? "collapsed" : "expanded",
          !isOpen ? "hidden md:flex" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ transform: isOpen || window.innerWidth >= 768 ? "translateX(0)" : undefined }}
      >
        {/* Logo + collapse toggle */}
        <div className="hrms-sidebar-logo">
          {!collapsed && (
            <img src={logo} alt="Company Logo" className="hrms-logo-img" />
          )}
          {collapsed && <div style={{ flex: 1 }} />}
          <button className="hrms-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="hrms-sidebar-nav">
          <NavSection title="Main" collapsed={collapsed}>
            {mainItems.map((item) => (
              <NavItem
                key={item.label}
                item={item}
                collapsed={collapsed}
                onClick={handleNavigate}
              />
            ))}
          </NavSection>

          {myItems.length > 0 && (
            <NavSection title="My" collapsed={collapsed}>
              {myItems.map((item) => (
                <NavItem
                  key={item.label}
                  item={item}
                  collapsed={collapsed}
                  onClick={handleNavigate}
                />
              ))}
            </NavSection>
          )}
        </nav>

        {/* Footer status */}
        <div className="hrms-sidebar-footer">
          <div className="hrms-footer-badge">
            <div className="hrms-footer-dot" />
            {!collapsed && <span className="hrms-footer-text">System online</span>}
          </div>
        </div>
      </aside>
    </>
  );
}

function NavSection({ title, children, collapsed }) {
  return (
    <div>
      {!collapsed && <div className="hrms-section-label">{title}</div>}
      <ul className="hrms-section-items" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {children}
      </ul>
    </div>
  );
}

function NavItem({ item, onClick, collapsed }) {
  const Icon = item.icon;

  return (
    <li>
      <div className="hrms-nav-item" onClick={() => onClick(item.path)}>
        <div className="hrms-nav-icon-wrap">
          <Icon size={15} />
        </div>

        {!collapsed && (
          <>
            <span className="hrms-nav-label">{item.label}</span>
            <svg className="hrms-nav-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </>
        )}

        {collapsed && <span className="hrms-tooltip">{item.label}</span>}
      </div>
    </li>
  );
}