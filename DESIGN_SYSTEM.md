# 🎨 HRMS Design System Guide

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Forms & Inputs](#forms--inputs)
7. [Status & Badges](#status--badges)
8. [Cards & Containers](#cards--containers)
9. [Modals & Dialogs](#modals--dialogs)
10. [Animations](#animations)
11. [Icons & Visual Language](#icons--visual-language)
12. [Responsive Design](#responsive-design)
13. [Accessibility](#accessibility)

---

## Design Principles

### 1. **Clarity First**

- Clear hierarchy of information
- Obvious call-to-action buttons
- Unambiguous status indicators
- Zero confusion about next steps

### 2. **Context-Aware Colors**

- Status colors mean something (red = action needed, green = success)
- Context matters: balance cards use gradient colors
- Consistent color usage across all modules

### 3. **Smooth Interactions**

- Fade-in/slide-up animations on load
- Smooth transitions on hover/active states
- Spinners for loading states
- Toast notifications for feedback

### 4. **Responsive First**

- Mobile-first approach
- Touch-friendly buttons (min 44px)
- Flexible layouts that adapt to screen size
- Readable text on all devices

### 5. **Accessibility**

- Contrast ratios meet WCAG AA
- Icons paired with text labels
- Focus states clearly visible
- Semantic HTML for screen readers

---

## Color Palette

### Primary Colors

```
Blue (Primary Action)
  └─ #3B82F6 - Main blue, buttons, active states
  └─ #1E40AF - Dark blue, hover state
  └─ #EFF6FF - Light blue bg
  └─ #BFE4FF - Blue border

Indigo (Secondary)
  └─ #6366F1 - Secondary accent
  └─ #4F46E5 - Dark indigo
  └─ #E0E7FF - Light indigo bg

Gray (Neutral)
  └─ #F9FAFB - Very light bg (page background)
  └─ #F3F4F6 - Lighter gray
  └─ #E5E7EB - Light gray
  └─ #6B7280 - Medium gray (text)
  └─ #374151 - Dark gray
  └─ #111827 - Very dark (headers)
```

### Status Colors

```
Success (Green)
  └─ #10B981 - Approved, success actions
  └─ #059669 - Dark green, hover
  └─ #ECFDF5 - Light green bg
  └─ #A7F3D0 - Green accent

Warning (Amber)
  └─ #F59E0B - Pending, attention needed
  └─ #D97706 - Dark amber
  └─ #FFFBEB - Light amber bg
  └─ #FCD34D - Light amber accent

Error (Red)
  └─ #EF4444 - Rejected, errors, delete
  └─ #DC2626 - Dark red
  └─ #FEE2E2 - Light red bg
  └─ #FECACA - Red accent

Info (Cyan/Blue)
  └─ #06B6D4 - Info, helpful hints
  └─ #0891B2 - Dark cyan
  └─ #ECFDF5 - Light cyan bg
```

### Gradient Balances (Leave Cards)

```
Blue Gradient:        from-blue-500 to-blue-700
Violet Gradient:      from-violet-500 to-violet-700
Emerald Gradient:     from-emerald-500 to-emerald-700
Orange Gradient:      from-orange-500 to-orange-600
Rose Gradient:        from-rose-500 to-rose-700
Cyan Gradient:        from-cyan-500 to-cyan-700
Amber Gradient:       from-amber-500 to-amber-600
Indigo Gradient:      from-indigo-500 to-indigo-700
```

### Color Usage Map

| Element             | Color         | Usage                           |
| ------------------- | ------------- | ------------------------------- |
| **Primary Button**  | Blue #3B82F6  | Main actions (Submit, Approve)  |
| **Danger Button**   | Red #EF4444   | Delete, reject, cancel actions  |
| **Success Badge**   | Green #10B981 | Approved status, success states |
| **Pending Badge**   | Amber #F59E0B | Pending, waiting approval       |
| **Error Badge**     | Red #EF4444   | Rejected, error status          |
| **Info Banner**     | Blue #06B6D4  | Helpful information, tips       |
| **Warning Banner**  | Amber #F59E0B | Caution, attention needed       |
| **Page Background** | Gray #F9FAFB  | Overall page bg                 |
| **Card Background** | White #FFFFFF | Cards, modals, containers       |
| **Text Primary**    | Gray #111827  | Main text, headers              |
| **Text Secondary**  | Gray #6B7280  | Secondary text, labels          |
| **Borders**         | Gray #E5E7EB  | Dividers, card borders          |

---

## Typography

### Font Family

```css
'DM Sans', sans-serif /* Primary font */
```

### Font Sizes & Weights

```
Super Large (Hero)
  └─ 32px, font-weight: 700 (bold)
  └─ Usage: Page titles, modal headers

Large
  └─ 24px, font-weight: 700 (bold)
  └─ 20px, font-weight: 600 (semibold)
  └─ Usage: Card titles, section headers

Base
  └─ 16px, font-weight: 400 (normal) — Body text
  └─ 16px, font-weight: 600 (semibold) — Emphasized text
  └─ 16px, font-weight: 700 (bold) — Strong emphasis

Small
  └─ 14px, font-weight: 400 (normal) — Secondary text
  └─ 14px, font-weight: 500 (medium) — Labels
  └─ 14px, font-weight: 600 (semibold) — Badge text

Extra Small
  └─ 12px, font-weight: 400 (normal) — Hints, timestamps
  └─ 12px, font-weight: 600 (semibold) — Small badges
  └─ 12px, font-weight: 700 (bold) — Small important labels

Tiny
  └─ 11px, font-weight: 700 (bold) — Input labels
  └─ 10px, font-weight: 600 (semibold) — Category tags
  └─ 10px, font-weight: 700 (bold) — Uppercase labels
```

### Text Examples

```jsx
// Page Title
<h1 className="text-2xl font-bold text-gray-900">My Applications</h1>

// Section Header
<h2 className="text-lg font-semibold text-gray-900">Recent Requests</h2>

// Card Title
<h3 className="text-base font-bold text-gray-900">Annual Leave Balance</h3>

// Body Text
<p className="text-sm text-gray-600">This is regular body text</p>

// Secondary Text
<span className="text-xs text-gray-400">Helper text or timestamp</span>

// Label
<label className="text-xs uppercase tracking-widest font-bold text-gray-400">
  Leave Type
</label>
```

### Line Heights

```
Headings:   line-height: 1.2 (tight)
Body Text:  line-height: 1.5 (relaxed)
Small Text: line-height: 1.4 (normal)
```

---

## Spacing & Layout

### Base Unit: 4px

```
Spacing scale follows Tailwind defaults:
  1  = 4px
  1.5 = 6px
  2  = 8px
  3  = 12px
  4  = 16px
  5  = 20px
  6  = 24px
  8  = 32px
  10 = 40px
  12 = 48px
```

### Common Spacing Patterns

```jsx
// Page/Section Container
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  /* Responsive padding: 4px on mobile, 6px on sm, 8px on lg */
</div>

// Card Padding
<div className="p-5">  <!-- 20px padding all sides -->
<div className="px-6 py-4">  <!-- 24px horizontal, 16px vertical -->

// Gap between items
<div className="space-y-4">  <!-- 16px vertical gap -->
<div className="flex gap-3">  <!-- 12px gap -->

// Modal/Dialog Padding
<div className="px-6 py-5">  <!-- 24px left/right, 20px top/bottom -->
```

### Layout Grid

```
Desktop:  12 columns, max-width: 1280px
Tablet:   Flexible, 6-8 columns
Mobile:   1 column, full width with padding

Grid Gaps: 12-16px (gap-3 to gap-4)
```

---

## Components

### Section Wrapper

```jsx
<section className="min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Content */}
  </div>
</section>
```

### Page Header

```jsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Page Title</h1>
    <p className="text-sm text-gray-500 mt-1">Subtitle or description</p>
  </div>
  <button className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold">
    Primary Action
  </button>
</div>
```

### Stats Row

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <div className="bg-white rounded-xl p-4 border border-gray-100">
    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
      Metric Label
    </span>
    <p className="text-2xl font-bold text-gray-900 mt-2">42</p>
    <span className="text-xs text-green-600 mt-1">+5 from last month</span>
  </div>
</div>
```

### Empty State

```jsx
<div className="text-center py-12">
  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
    <FileText size={24} className="text-gray-400" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
  <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
</div>
```

---

## Forms & Inputs

### Input Field

```jsx
<div>
  <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
    Field Label *
  </label>
  <input
    type="text"
    placeholder="Enter value…"
    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
  />
</div>
```

### Select Dropdown

```jsx
<select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition">
  <option value="">Select an option…</option>
  <option value="1">Option 1</option>
</select>
```

### Date Input

```jsx
<input
  type="date"
  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition"
/>
```

### Textarea

```jsx
<textarea
  rows={4}
  placeholder="Enter your message…"
  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 resize-none transition"
/>
```

### Error State

```jsx
{
  errors.fieldName && (
    <p className="text-xs text-red-500 mt-1.5">{errors.fieldName}</p>
  );
}

/* Input with error */
<input className="border-red-300 focus:border-red-400 focus:ring-red-100" />;
```

### Form Grid

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Two columns on desktop, one on mobile */}
</div>
```

---

## Status & Badges

### Status Badge

```jsx
const STATUS_CFG = {
  PENDING: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
    label: "Pending",
    icon: Clock,
  },
  APPROVED: {
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    label: "Approved",
    icon: CheckCircle2,
  },
  REJECTED: {
    badge: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
    label: "Rejected",
    icon: Ban,
  },
};

<span
  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_CFG[status].badge}`}
>
  <Icon size={11} />
  {STATUS_CFG[status].label}
</span>;
```

### Priority Badge

```jsx
<span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
  Urgent
</span>
```

### Category Tag

```jsx
<span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 border border-violet-200">
  HR
</span>
```

### Badge Variants

| Type              | Classes                                                                                                 | Usage             |
| ----------------- | ------------------------------------------------------------------------------------------------------- | ----------------- |
| **Small Success** | `bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-lg` | Inline success    |
| **Small Pending** | `bg-amber-50 border border-amber-200 text-amber-600 text-xs font-semibold px-2 py-0.5 rounded-lg`       | Inline pending    |
| **Dot Status**    | `inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border`                | Full status badge |
| **Icon + Label**  | With icon prefix                                                                                        | Actions needed    |

---

## Cards & Containers

### Standard Card

```jsx
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
  <h3 className="font-bold text-gray-900 mb-3">Card Title</h3>
  {/* Content */}
</div>
```

### Card with Accent Border

```jsx
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-blue-600 p-5">
  ;{/* Content */}
</div>
```

### Hover Card

```jsx
<div className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
  {/* Content */}
</div>
```

### Card Sections

```jsx
<div className="bg-white rounded-2xl overflow-hidden">
  {/* Header */}
  <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
    <h2 className="font-bold text-gray-900">Header</h2>
  </div>

  {/* Body */}
  <div className="px-6 py-5 space-y-4">{/* Content */}</div>

  {/* Footer */}
  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
    <button>Action</button>
  </div>
</div>
```

### Balance Card (Gradient)

```jsx
const BALANCE_COLORS = [
  {
    grad: "from-blue-500 to-blue-700",
    light: "bg-blue-50 border-blue-200 text-blue-700",
  },
  {
    grad: "from-violet-500 to-violet-700",
    light: "bg-violet-50 border-violet-200 text-violet-700",
  },
];

<div className={`bg-gradient-to-br ${clr.grad} rounded-2xl p-6 text-white`}>
  <p className="text-sm opacity-90 mb-1">Annual Leave</p>
  <p className="text-4xl font-bold">15 days</p>
  <div className="mt-4 flex gap-3 text-sm opacity-80">
    <span>5 used</span> · <span>2 pending</span>
  </div>
</div>;
```

---

## Modals & Dialogs

### Modal Structure

```jsx
<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">
    {/* Header */}
    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
          <Icon size={16} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-sm">Modal Title</h2>
          <p className="text-xs text-gray-400">Subtitle</p>
        </div>
      </div>
      <button className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition">
        <X size={15} />
      </button>
    </div>

    {/* Body */}
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
      {/* Form fields or content */}
    </div>

    {/* Footer */}
    <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50">
      <button className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
        Confirm
      </button>
      <button className="py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-white font-medium rounded-xl">
        Cancel
      </button>
    </div>
  </div>
</div>
```

### Overlay Properties

```
Background:  bg-black/50 (50% black opacity)
Blur:        backdrop-blur-sm (small blur effect)
Z-index:     z-[100] (above all other content)
Animation:   fade-in (0.18s ease-out)
```

---

## Animations

### Keyframes Registry

```css
@keyframes mlFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes mlUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes mlSpin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes mlPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.04);
  }
}

@keyframes attFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes attSlideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes attSpin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes nbeFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes nbeSlideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes nbeSpin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes nbeGlow {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
}
@keyframes nbePulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
```

### Animation Classes

| Animation    | Duration | Easing                  | Class       | Usage            |
| ------------ | -------- | ----------------------- | ----------- | ---------------- |
| **Fade In**  | 180ms    | ease-out                | `.ml-fade`  | Modals, overlays |
| **Slide Up** | 240ms    | cubic-bezier(.4,0,.2,1) | `.ml-up`    | Cards on load    |
| **Spin**     | 850ms    | linear infinite         | `.ml-spin`  | Loading spinners |
| **Pulse**    | 2s       | ease-in-out infinite    | `.ml-pulse` | Pulsing badges   |
| **Glow**     | 2s       | ease-in-out infinite    | `.nbe-glow` | Urgent notices   |

### Applying Animations

```jsx
// Fade in modal
<div className="fixed inset-0 ml-fade">

// Slide up card on load
<div className="ml-up">Card content</div>

// Spinning loader
<Loader2 size={18} className="ml-spin text-blue-400" />

// Pulsing urgent badge
<span className="nbe-pulse text-red-600">Urgent</span>
```

---

## Icons & Visual Language

### Icon Library

```
lucide-react
  └─ 24 size for large (header, hero)
  └─ 18 size for medium (card titles)
  └─ 16 size for normal (buttons, labels)
  └─ 14 size for small (badges, hints)
  └─ 12 size for tiny (inline badges)
```

### Icon Assignments

| Icon               | Meaning                 | Usage                            |
| ------------------ | ----------------------- | -------------------------------- |
| **Calendar**       | Dates, leave, schedule  | Date fields, date displays       |
| **Clock**          | Time, pending, waiting  | Time displays, pending badge     |
| **CheckCircle2**   | Approved, success       | Success status, approved badge   |
| **Ban**            | Rejected, blocked       | Rejected status                  |
| **X**              | Close, cancel, remove   | Close buttons, delete            |
| **AlertCircle**    | Error, warning          | Error messages, alerts           |
| **Info**           | Helpful information     | Tips, notes                      |
| **Loader2**        | Loading, processing     | Spinners during async operations |
| **ChevronDown/Up** | Expand/collapse         | Expandable sections              |
| **Users**          | People, team, audience  | Audience indicators              |
| **FileText**       | Documents, notices      | Notice cards, documents          |
| **Heart**          | Health, care, attention | Health & safety category         |
| **DollarSign**     | Finance, money          | Finance category                 |
| **Sun/Moon**       | Day/night shift         | Shift period indicators          |

### Icon Color Map

```jsx
// Primary action icons
<Icon size={16} className="text-blue-600" />

// Success icons
<Icon size={16} className="text-emerald-600" />

// Error/warning icons
<Icon size={16} className="text-red-500" />

// Neutral/secondary icons
<Icon size={16} className="text-gray-400" />

// Category icons
<Icon size={18} className={`text-${category}-600`} />
```

---

## Responsive Design

### Breakpoints (Tailwind)

```
Mobile:    < 640px   (default)
Small:     640px     (sm:)
Medium:    768px     (md:)
Large:     1024px    (lg:)
XL:        1280px    (xl:)
2XL:       1536px    (2xl:)
```

### Responsive Patterns

#### Stack to Row Layout

```jsx
// Mobile: single column, Tablet: two columns, Desktop: 4 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// Mobile: single column, Desktop: two columns
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
```

#### Font Size Responsiveness

```jsx
// Mobile text, scaling up
<h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Heading</h1>

// Small text stays small
<p className="text-sm text-gray-600">Small text</p>
```

#### Padding Responsiveness

```jsx
// Mobile: 4px, Tablet: 6px, Desktop: 8px horizontal
<section className="px-4 sm:px-6 lg:px-8">

// Different padding by breakpoint
<div className="p-4 md:p-6 lg:p-8">
```

#### Hidden on Mobile

```jsx
// Hide on mobile, show on desktop
<div className="hidden lg:block">Desktop only</div>

// Show on mobile, hide on desktop
<button className="md:hidden">Mobile menu</button>
```

### Container Sizes

```jsp
// Narrow (modals, sidebars)
max-w-sm (384px)
max-w-md (448px)

// Standard (cards, sections)
max-w-lg (512px)
max-w-xl (576px)

// Wide (page content)
max-w-4xl (896px)
max-w-5xl (1024px)

// Full width with margin
max-w-7xl (1280px) ← Used for main page content
```

---

## Accessibility

### Color Not Alone

```jsx
// ❌ Bad: only color indicates status
<div className="bg-red-500" />

// ✅ Good: color + icon + text
<span className="flex items-center gap-2 text-red-600">
  <AlertCircle size={16} />
  Error
</span>
```

### Focus States

```jsx
// All interactive elements need focus states
<button className="outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
  Button
</button>

<input className="outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
```

### Text Contrast

```
WCAG AA Minimum:
  └─ 4.5:1 ratio for normal text
  └─ 3:1 ratio for large text (18px+)

Our colors meet WCAG AAA (7:1) for:
  └─ Blue text on white
  └─ Dark gray text on white
  └─ White text on colored backgrounds
```

### Semantic HTML

```jsx
// ❌ Bad
<div onClick={handleClick} className="cursor-pointer">
  Click me
</div>

// ✅ Good
<button onClick={handleClick}>
  Click me
</button>
```

### ARIA Labels

```jsx
// Loader without text
<Loader2 size={18} className="animate-spin" aria-label="Loading..." />

// Icon-only button
<button aria-label="Close dialog">
  <X size={20} />
</button>

// Form hint
<input aria-describedby="hint" />
<span id="hint" className="text-xs text-gray-500">Hint text</span>
```

---

## Implementation Checklist

When building new pages/features, follow this checklist:

- [ ] **Colors**: Use status colors consistently (red=error, green=success, amber=pending)
- [ ] **Typography**: Use correct font sizes and weights from type scale
- [ ] **Spacing**: Follow 4px base unit (2, 3, 4, 5, 6 gaps)
- [ ] **Cards**: Use rounded-2xl with shadow-sm and border
- [ ] **Buttons**: Primary (blue-600), Secondary (border gray-200)
- [ ] **Modals**: Gradient header, space-y-4 body, flex footer
- [ ] **Status**: Use badges with icon + dot + text
- [ ] **Animations**: Fade in modals, slide up cards, spin loaders
- [ ] **Icons**: Use lucide-react, size 16 normal, paired with labels
- [ ] **Responsive**: Test mobile, tablet, desktop breakpoints
- [ ] **Focus States**: All buttons/inputs have focus rings
- [ ] **Contrast**: Text meets WCAG AA (4.5:1 minimum)
- [ ] **Semantics**: Use proper HTML tags (button, input, select, etc.)
- [ ] **Aria Labels**: Icon-only buttons and loaders have aria-label
- [ ] **Toast Notifications**: Success (green), Error (red)
- [ ] **Empty States**: Icon + heading + description + action

---

## Code Examples

### Complete Form Modal

```jsx
<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm ml-fade">
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden ml-up">
    {/* Header */}
    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
          <CalendarDays size={16} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900 text-sm">Request Time Off</h2>
          <p className="text-xs text-gray-400">Submit a new leave request</p>
        </div>
      </div>
      <button className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition">
        <X size={15} />
      </button>
    </div>

    {/* Body */}
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
      {/* Leave Type */}
      <div>
        <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
          Leave Type *
        </label>
        <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition">
          <option>Select leave type…</option>
          <option>Annual Leave</option>
          <option>Sick Leave</option>
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
            Start Date *
          </label>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
            End Date *
          </label>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 transition"
          />
        </div>
      </div>

      {/* Reason */}
      <div>
        <label className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1.5 block">
          Reason *
        </label>
        <textarea
          rows={3}
          placeholder="Enter reason…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 outline-none focus:border-blue-400 resize-none transition"
        />
      </div>

      {/* Info */}
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <Info size={13} className="text-blue-500 mt-0.5" />
        <p className="text-xs text-blue-700">
          Your HR team will review your request. You'll be notified once a
          decision is made.
        </p>
      </div>
    </div>

    {/* Footer */}
    <div className="px-6 py-4 border-t border-gray-100 flex gap-3 bg-gray-50">
      <button className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2">
        <CalendarDays size={13} />
        Submit Request
      </button>
      <button className="py-2.5 px-5 border border-gray-200 text-gray-600 hover:bg-white text-sm font-medium rounded-xl transition">
        Cancel
      </button>
    </div>
  </div>
</div>
```

---

## Version History

| Version | Date         | Changes                                                                |
| ------- | ------------ | ---------------------------------------------------------------------- |
| 1.0     | Apr 23, 2026 | Initial design system based on myApplications, MyAttendance, MyNotices |

---

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [lucide-react Icons](https://lucide.dev/)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
