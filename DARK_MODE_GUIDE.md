# 🌙 Dark Mode Implementation Guide

## Overview

Dark mode has been successfully implemented in the HRMS Dashboard using **next-themes** and **Tailwind CSS**. The implementation includes:

- ✅ Light/Dark theme toggle button
- ✅ System preference detection
- ✅ Persistent theme preference storage
- ✅ Smooth transitions between themes
- ✅ Dark mode styling for all major components

## What Was Changed

### 1. **main.jsx** - Theme Provider Setup

- Added `ThemeProvider` wrapper from `next-themes`
- Configured with `attribute="class"` for class-based dark mode
- Set `defaultTheme="light"`
- Enabled `enableSystem` to respect system preferences

```jsx
<ThemeProvider attribute="class" defaultTheme="light" enableSystem>
  <App />
</ThemeProvider>
```

### 2. **index.html** - Hydration Support

- Added `suppressHydrationWarning` to html element to prevent hydration mismatches

### 3. **App.jsx** - Cleaned Up Imports

- Removed unused `ThemeProvider` import (now imported in main.jsx)

### 4. **Components/ThemeToggle.jsx** - NEW COMPONENT

- Created a new theme toggle button component
- Displays Sun icon in dark mode, Moon icon in light mode
- Uses `useTheme()` hook to manage theme switching
- Includes hydration safety check with `useEffect`

### 5. **Components/Navbar.jsx** - Integrated Theme Toggle

- Imported and added `ThemeToggle` component to navbar
- Added comprehensive dark mode CSS styles for navbar elements
- Dark mode styling includes:
  - Navbar background and borders
  - Text colors for readability
  - Dropdown menu styles
  - Profile section styling
  - Button hover states

### 6. **Components/Sidebar.jsx** - Dark Mode Support

- Added extensive dark mode CSS styles
- Dark mode includes:
  - Sidebar background and borders
  - Navigation item hover and active states
  - Icon wrapper styling
  - Section labels
  - Footer styling

### 7. **Pages/PageRender.jsx** - Layout Dark Mode

- Updated main container with dark mode background: `dark:bg-gray-950`
- Added smooth color transitions

### 8. **index.css** - Global Dark Mode Styles

- Added comprehensive dark mode CSS variables and classes
- Includes styling for:
  - Body and background colors
  - Text colors
  - Cards and containers
  - Form inputs and textareas
  - Tables
  - Buttons
  - Scrollbars

## How to Use

### For Users

1. Click the **theme toggle button** in the top-right of the navbar (sun/moon icon)
2. The app will instantly switch between light and dark modes
3. Your preference is **automatically saved** to localStorage
4. The app respects your system preference on first visit

### For Developers

To ensure dark mode compatibility when adding new components:

1. **Use Tailwind's `dark:` prefix** for color classes:

   ```jsx
   <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
     Content
   </div>
   ```

2. **For custom CSS**, use the `html.dark` selector:

   ```css
   .my-component {
     background: #ffffff;
   }

   html.dark .my-component {
     background: #111827;
   }
   ```

3. **Color Palette for Dark Mode**:
   - Background: `#111827` (gray-950)
   - Card/Container: `#1f2937` (gray-900)
   - Border: `#374151` (gray-700)
   - Text: `#e5e7eb` (gray-200)
   - Accent: `#ef4444` (red-500)

## Theme Detection & Storage

- **Local Storage Key**: `theme`
- **System Preference**: Automatically detected via `prefers-color-scheme` media query
- **Class Application**: Dark mode applies `.dark` class to `<html>` element
- **Cookie Support**: Optional (can be configured in ThemeProvider)

## Browser Support

Dark mode works in all modern browsers:

- Chrome/Edge 76+
- Firefox 67+
- Safari 12.1+
- All other modern browsers

## Testing Dark Mode

1. Open the app and click the theme toggle in the navbar
2. Refresh the page - your preference should persist
3. Change your system theme preference - the app should respect it on fresh load
4. Check different pages to ensure all components render correctly

## File References

- **ThemeProvider Logic**: [src/main.jsx](src/main.jsx)
- **Theme Toggle Button**: [src/Components/ThemeToggle.jsx](src/Components/ThemeToggle.jsx)
- **Global Styles**: [src/index.css](src/index.css)
- **Navbar Dark Styles**: [src/Components/Navbar.jsx](src/Components/Navbar.jsx) (lines ~559-615)
- **Sidebar Dark Styles**: [src/Components/Sidebar.jsx](src/Components/Sidebar.jsx) (lines ~291-362)
- **Layout Dark Styles**: [src/Pages/PageRender.jsx](src/Pages/PageRender.jsx)
