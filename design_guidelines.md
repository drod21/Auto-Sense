# Workout Tracker Design Guidelines

## Design Approach

**Selected Approach:** Design System with Linear-inspired aesthetics and Material Design information architecture

**Rationale:** This is a utility-focused productivity tool requiring clear data hierarchy, efficient workflows, and functional excellence. The application prioritizes usability and information density over visual storytelling.

**Key Design Principles:**
- Clarity above all: Every data point must be immediately scannable
- Progressive disclosure: Show essential info first, details on demand
- Action-oriented: Primary workflows (upload, track, complete) should be frictionless
- Data confidence: Visual feedback during LLM parsing builds trust

---

## Core Design Elements

### Typography System

**Font Families:**
- Primary: Inter (via Google Fonts) - clean, highly legible for data
- Monospace: JetBrains Mono - for numerical data (sets, reps, timers)

**Hierarchy:**
- H1: text-4xl font-bold - Page titles
- H2: text-2xl font-semibold - Section headers
- H3: text-xl font-medium - Card titles, exercise names
- Body: text-base - Default text
- Small: text-sm - Metadata, timestamps
- Micro: text-xs - Labels, helper text
- Numbers: Use monospace for all numerical data (sets, reps, RPE, timers)

---

### Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, and 16
- Tight spacing: p-2, gap-2 (within components)
- Standard spacing: p-4, gap-4 (between related elements)
- Section spacing: p-8, gap-8 (between major sections)
- Page margins: p-12 or p-16 (outer containers)

**Grid System:**
- Dashboard: 3-column grid (lg:grid-cols-3) for exercise cards
- Tablet: 2-column (md:grid-cols-2)
- Mobile: Single column (grid-cols-1)
- Active workout: Full-width single column for focus

**Container Widths:**
- Main content: max-w-7xl mx-auto
- Upload area: max-w-2xl mx-auto
- Active workout mode: max-w-4xl mx-auto

---

## Component Library

### Navigation
**Top Navigation Bar:**
- Fixed header with height h-16
- Left: Logo/brand (text-xl font-bold)
- Center: Navigation links (Dashboard, Upload, History, Settings)
- Right: User profile icon
- Border bottom with subtle separation

### File Upload Component
**Dropzone Area:**
- Large centered area (min-h-96)
- Dashed border (border-dashed border-2)
- Icon: Upload cloud (size-16)
- Text hierarchy: "Drop spreadsheet here" (text-xl) + supported formats (text-sm)
- File input with drag-and-drop support
- Progress bar during upload with percentage

**Parsing Feedback:**
- Loading state: Animated spinner + "Parsing with AI..." text
- Progress indicators showing extraction steps
- Success state: Checkmark + parsed data count

### Exercise Cards (Dashboard View)
**Card Structure:**
- Rounded corners (rounded-lg)
- Padding p-6
- Subtle border
- Hover state: slight elevation

**Card Content Layout:**
- Exercise name: text-xl font-semibold at top
- Alternate exercise: text-sm with "Alternative:" prefix
- Data grid below (2-column on desktop):
  - Sets: icon + number (monospace)
  - Warmup sets: icon + number
  - Rest timer: clock icon + time (monospace)
  - RPE: gauge icon + value
  - Rep ranges: "8-12" format (monospace)
- Action button at bottom: "Start Workout" (full-width)

### Active Workout Interface
**Timer Component:**
- Massive centered countdown (text-8xl monospace)
- Rest timer with visual progress ring
- Pause/Resume controls below
- Audio notification option

**Set Tracker:**
- Current set indicator (e.g., "Set 3 of 4")
- Rep target display: "Target: 8-12 reps"
- Rep counter with +/- buttons (large tap targets)
- RPE slider (1-10 scale) after each set
- "Complete Set" button (lg size)
- Set history list below showing completed sets

**Exercise Progress:**
- Linear progress bar showing overall workout completion
- Next exercise preview card
- "Skip Exercise" and "End Workout" secondary actions

### Data Display Tables
**Workout History:**
- Clean table layout with alternating row treatment
- Columns: Date, Exercise, Sets Completed, Total Volume, Duration
- Sortable headers
- Row click to expand details
- Sticky header on scroll

### Forms & Inputs
**Text Inputs:**
- Height h-12 for good touch targets
- Padding px-4
- Labels: text-sm font-medium above input
- Helper text: text-xs below input

**Buttons:**
- Primary: Large (h-12), full-width on mobile
- Secondary: Outlined style
- Icon buttons: Square (size-12) with centered icon

### Empty States
**No Workouts Uploaded:**
- Centered layout
- Illustration placeholder (size-48)
- Heading: "No workouts yet"
- Subtext: "Upload a spreadsheet to get started"
- CTA: "Upload Spreadsheet" button

---

## Page Layouts

### 1. Upload Page
- Centered layout with max-w-2xl
- Hero heading: "Import Your Workout Plan"
- Subtext explaining LLM parsing capabilities
- Large dropzone component
- Sample spreadsheet download link
- Tips section below (grid of 3 tips showing what can be parsed)

### 2. Dashboard
- Full-width header with workout stats (Total Exercises, This Week, Streak)
- Filter/search bar (sticky below header)
- Exercise cards in responsive grid
- Floating action button for quick upload

### 3. Active Workout View
- Full-screen takeover
- Exit button (top-left)
- Timer takes center stage
- Set tracker immediately below
- Progress bar at bottom
- Minimal distractions

### 4. Workout Detail/Edit
- Split layout:
  - Left: Exercise metadata (2/3 width)
  - Right: Quick stats panel (1/3 width)
- Editable fields for all parsed data
- Save/Cancel actions sticky at bottom

---

## Animations

**Minimal, Purposeful:**
- Card hover: subtle translateY(-2px) with shadow increase
- Button clicks: scale(0.98) feedback
- Timer countdown: smooth number transitions
- Loading states: gentle pulse on skeleton screens
- Success states: quick scale + checkmark animation
- No scroll-triggered or decorative animations

---

## Images

**No hero images required.** This is a functional application where imagery would distract from data and workflows.

**Icon Usage:**
- Use Heroicons (outline style) via CDN
- Exercise type icons in cards (dumbbell, running, etc.)
- Status icons (checkmark, clock, gauge for RPE)
- Navigation icons
- Size: size-5 for inline, size-6 for standalone

---

## Accessibility Notes

- All interactive elements minimum 44px tap target
- High contrast for all text on backgrounds
- Clear focus states with visible outlines
- Form labels properly associated with inputs
- Timer announces time remaining for screen readers
- Keyboard navigation throughout (Tab order logical)