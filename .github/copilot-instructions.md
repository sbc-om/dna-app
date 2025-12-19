# Copilot Instructions – DNA Web App

---

## 🎮 GAME-LIKE UI/UX DESIGN GUIDELINES

**The DNA application must feel like an engaging, interactive game experience, not a traditional admin panel.**

### 🌟 MASTER RULE: All Pages Must Be Game-Like and Animated

**Every page, component, and interaction in the DNA application MUST follow these game-like design principles:**

#### 1. **Framer Motion is MANDATORY**
   - Install: `npm install framer-motion`
   - Import in EVERY client component: `import { motion, AnimatePresence } from 'framer-motion'`
   - Wrap interactive elements in `<motion.div>` or `motion.button`
   - Use `<AnimatePresence>` for conditional rendering

#### 2. **Page Entry Animations (REQUIRED)**
   ```tsx
   <motion.div
     initial={{ opacity: 0, y: 20 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.6, type: 'spring' }}
   >
     {/* Page content */}
   </motion.div>
   ```

#### 3. **Interactive Elements (ALL BUTTONS & LINKS)**
   ```tsx
   <motion.button
     whileHover={{ scale: 1.05 }}
     whileTap={{ scale: 0.95 }}
     className="..."
   >
     Button Text
   </motion.button>
   ```

#### 4. **Card Components with 3D Effects**
   ```tsx
   <motion.div
     whileHover={{ 
       scale: 1.05,
       rotateY: 5,
       rotateX: 5,
     }}
     style={{ transformStyle: 'preserve-3d' }}
     className="relative group"
   >
     {/* Card with gradient glow */}
     <motion.div
       className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-50"
       animate={{ scale: [1, 1.1, 1] }}
       transition={{ duration: 2, repeat: Infinity }}
     />
     <div className="relative bg-white/10 backdrop-blur-xl p-6 rounded-2xl border-2 border-white/20">
       {/* Content */}
     </div>
   </motion.div>
   ```

#### 5. **Header/Navigation Animation Pattern**
   ```tsx
   <motion.header
     initial={{ y: -100, opacity: 0 }}
     animate={{ y: 0, opacity: 1 }}
     transition={{ type: 'spring', stiffness: 260, damping: 20 }}
     className="sticky top-0 z-40 bg-gradient-to-r from-white/95 via-blue-50/50 to-purple-50/50 backdrop-blur-xl"
   >
     {/* Animated background overlay */}
     <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5" />
     {/* Header content */}
   </motion.header>
   ```

#### 6. **List/Grid Items with Stagger Animation**
   ```tsx
   {items.map((item, index) => (
     <motion.div
       key={item.id}
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: index * 0.1 }}
     >
       {/* Item content */}
     </motion.div>
   ))}
   ```

#### 7. **Icon Animations (ALWAYS)**
   ```tsx
   <motion.div
     animate={{ rotate: [0, -5, 5, -5, 0] }}
     transition={{ duration: 0.5 }}
   >
     <Icon className="w-6 h-6" />
   </motion.div>
   ```

#### 8. **Badge/Notification Pulse**
   ```tsx
   <motion.span
     initial={{ scale: 0 }}
     animate={{ scale: 1 }}
     className="badge"
   >
     <motion.span
       animate={{ scale: [1, 1.2, 1] }}
       transition={{ duration: 2, repeat: Infinity }}
     >
       {count}
     </motion.span>
   </motion.span>
   ```

#### 9. **Modal/Dialog Entry**
   ```tsx
   <AnimatePresence>
     {isOpen && (
       <>
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="backdrop"
         />
         <motion.div
           initial={{ scale: 0.9, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           exit={{ scale: 0.9, opacity: 0 }}
           className="modal"
         >
           {/* Modal content */}
         </motion.div>
       </>
     )}
   </AnimatePresence>
   ```

#### 10. **Loading States**
   ```tsx
   <motion.div
     animate={{ rotate: 360 }}
     transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
   >
     <Loader className="w-6 h-6" />
   </motion.div>
   ```

---

### Core Principles:
1. **Smooth Animations Everywhere**
   - Use **Framer Motion** for all interactive elements
   - Apply entrance animations (fade, slide, scale) with stagger delays
   - Add hover effects: scale, rotate, glow, shadow changes
   - Include exit animations for dialogs and overlays

2. **Visual Feedback & Interactivity**
   - Every clickable element must have:
     * Hover state with scale transformation (1.02-1.1)
     * Active/pressed state with scale-down (0.95-0.98)
     * Color transitions and shadow effects
   - Use particle effects on special interactions
   - Add loading spinners with playful animations

3. **Color & Gradients**
   - Use vibrant gradient backgrounds: `bg-gradient-to-br from-blue-500 to-purple-600`
   - Apply animated gradients that shift colors over time
   - Add glow effects with `shadow-lg shadow-blue-500/50`
   - Use glassmorphism: `backdrop-blur-xl bg-white/10`

4. **3D Transforms & Depth**
   - Apply perspective transforms on hover: `rotateY(5deg) rotateX(5deg)`
   - Use `transform-style: preserve-3d` for card effects
   - Layer elements with z-index and shadows for depth
   - Add floating animations with Y-axis movement

5. **Iconography & Visual Elements**
   - Rotate icons on hover (360° spins)
   - Scale and bounce icons during interactions
   - Add sparkles, stars, and decorative elements
   - Use animated borders and progress indicators

6. **Sidebar & Navigation**
   - Dark gradient backgrounds: `from-[#1a1a2e] via-[#16213e] to-[#0f3460]`
   - Active menu items with glowing borders
   - Smooth expand/collapse animations
   - Backdrop blur and transparency effects
   - Menu items spacing: `space-y-3` with `py-4` padding

7. **Dashboard Cards & Stats**
   - Equal height cards with `h-full` and flexbox
   - Gradient backgrounds per card category
   - Hover animations: lift, tilt, glow
   - Particle effects appearing on hover
   - Animated counters and progress bars

8. **Headers & Typography**
   - Large, bold headings with animated gradients
   - Color-shifting text using `background-clip: text`
   - Badge elements with pulsing shadows
   - Decorative floating icons (Sparkles, Zap, Star)

9. **Spacing & Layout**
   - Generous spacing: `space-y-6` to `space-y-8`
   - Menu items: `space-y-3`, padding `py-4`
   - Cards: `p-6` to `p-8` with `rounded-2xl` to `rounded-3xl`
   - Consistent gap in grids: `gap-6`

10. **Background Layers**
    - Multi-layered backgrounds with gradients
    - Animated mesh patterns: `bg-[radial-gradient(...)]`
    - Floating particles with random positions
    - Blur overlays for depth: `blur-3xl`

### Implementation Checklist:
- ✅ Install `framer-motion` package
- ✅ Wrap interactive elements in `<motion.div>`
- ✅ Add `initial`, `animate`, `whileHover`, `whileTap` props
- ✅ Use `transition` with spring physics or duration
- ✅ Apply gradient backgrounds to cards and buttons
- ✅ Add icon animations with rotation and scale
- ✅ Create particle systems for special effects
- ✅ Implement glassmorphism with backdrop-blur
- ✅ Add shadow effects with glow colors
- ✅ Ensure all cards have equal heights with flexbox

### Code Example Pattern:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ scale: 1.05, rotate: 2 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: 'spring', stiffness: 300 }}
  className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/50"
>
  {/* Interactive content */}
</motion.div>
```

**Goal:** Every page should feel alive, responsive, and fun to use – like playing a game, not working in software.

---

You are helping build a **modular, bilingual web application** using **Next.js 16**, **LMDB** as the database, and **shadcn/ui** for the UI.

The project has:

* A **public landing area** (Home, About, Contact, etc.).
* An **authenticated panel/dashboard** area.
* A **dynamic access control system** where permissions can be assigned to users and groups for any resource created in the app.

**ALL code, comments, variable names, function names, and documentation MUST be in English.**

> Important: **Do not use Persian or Arabic text in the codebase.**
> All code (identifiers, comments, strings in code) must be in English.
> Localized content should live in translation files only.

---

## 1. Tech Stack & Core Requirements

**Framework**

* Use **Next.js 16** with the **App Router** (`app/` directory).
* Use **TypeScript** everywhere.

**UI**

* Use **shadcn/ui** as the main component library.
* Layout must be **responsive** and clean.

**Database**

* Use **LMDB** as the primary database (file-based, NoSQL-style).
* Design data models and repositories around LMDB access.

**Internationalization**

* The app must be **bilingual: English and Arabic**.
* Implement i18n with:

  * A common translation mechanism (e.g., JSON translation files per locale).
  * A **language switcher** (EN / AR) visible on:

    * Public pages.
    * Inside the dashboard.
  * Proper **RTL support** for Arabic (direction, alignment, etc.).

**Access Control**

* Build a **dynamic permission system**:

  * Any resource created in the system must automatically be registered in the access control system.
  * Permissions can be assigned to:

    * Individual users.
    * Groups/roles.
  * Access to any feature or resource must be checked based on the current user’s assigned permissions.
* Permissions must be **data-driven** and **modular**, not hard-coded per route.

---

## 2. High-Level Features

The app is split into two main areas:

### 2.1 Public (Landing) Area

Pages:

1. **Home / Landing**

   * Short marketing description of the program.
   * Call-to-action buttons: “Login” and “Sign Up”.

2. **About**

   * Simple editable content sections about the program.

3. **Contact**

   * Contact form (name, email, message).
   * Show basic contact info.

4. **Auth**

   * **Login** page (email/username + password).
   * **Sign Up** page (basic user registration).

### 2.2 Panel / Dashboard Area

* Authenticated users can log in and access a **panel**.
* Each user sees **only what their permissions allow**:

  * Some users may see more modules.
  * Some may see less, or specific resources only.
* The panel should use:

  * A **sidebar navigation** (using shadcn/ui components).
  * A **top bar** (language switcher, user menu, etc.).
* The system is **modular**, so new modules can be added with:

  * Their own pages.
  * Their own access control entries.
  * Their own LMDB collections or namespaces.

---

## 3. Project Structure

Copilot, follow this structure as a baseline (adapt as needed, but keep it clean and modular):

```text
src/
  app/
    (public)/
      layout.tsx
      page.tsx               # Landing / Home
      about/
        page.tsx
      contact/
        page.tsx
      auth/
        login/
          page.tsx
        register/
          page.tsx
    (dashboard)/
      layout.tsx             # Dashboard shell: sidebar + top bar
      page.tsx               # Dashboard home
      modules/
        ...                  # Feature modules live here
  lib/
    db/
      lmdb.ts                # LMDB connection and helpers
      repositories/          # Repositories per aggregate
        userRepository.ts
        roleRepository.ts
        permissionRepository.ts
        resourceRepository.ts
    auth/
      authProvider.ts        # Auth context/session helper
      requireAuth.ts         # Server-side protections
    access-control/
      permissions.ts         # Permission types and helpers
      accessRegistry.ts      # Dynamic resource registration
      checkAccess.ts         # Centralized access check logic
    i18n/
      i18nConfig.ts
      getDictionary.ts       # Load translations
    ui/
      layout/
      components/
  modules/
    users/
      ...                    # Module-specific logic (routes, services, hooks)
    roles/
      ...
    resources/
      ...
  config/
    accessControl.ts         # Default roles, built-in permissions
    i18n.ts                  # Supported languages, default locale
```

Guidelines for Copilot:

* Place **shared logic in `lib/`**.
* Place **feature-specific logic in `modules/`**.
* App routes live in `app/`, but route handlers can call into modules/lib.

---

## 4. Authentication & Membership

Implement a basic **sign-up / sign-in** flow:

* Users can **register** via the public “Register” page.
* After registration, users can **log in** and are redirected to the dashboard.
* Store users and credentials in LMDB.
* Use a simple sessions mechanism (JWT-based or session tokens) compatible with Next.js 16.

Copilot, when generating auth code:

* Keep password handling secure (hashing, never storing plain text).
* Store the user’s **id**, **email/username**, and **role/group info**.
* Expose helper functions like:

  * `getCurrentUser()`
  * `getUserPermissions(userId)`
  * `requireAuth()` (for server components/routes).

---

## 5. Dynamic Access Control System

This is one of the **most important parts**.

We need:

### 5.1 Permission Model

Use a generic model, for example:

* `User`
* `Group` (or `Role`)
* `Permission`:

  * `resourceType` (e.g. `"module"`, `"page"`, `"entity"`)
  * `resourceKey` (e.g. `"dashboard.users"`, `"module.reports"`, `"entity.student.123"`)
  * `action` (e.g. `"read"`, `"write"`, `"manage"`)

Relationships:

* A user can:

  * Belong to one or more **groups**.
  * Have **direct permissions**.
* A group can:

  * Have multiple permissions.
* Effective permissions for a user = direct + inherited from groups.

### 5.2 Automatic Resource Registration

Requirement:

* **Whenever we create a new resource/module/feature**, it must be automatically registered in the system so that it appears in the access control configuration.

Implementation idea for Copilot:

* Define a **central registry** in `lib/access-control/accessRegistry.ts`:

  * Expose functions to:

    * `registerResource(resource: RegisteredResource)`
    * `listResources()`
  * A `RegisteredResource` might include:

    * `key`
    * `type`
    * `defaultActions`
    * `displayName` (English only in code; localization via keys)
* When a module is initialized (or on first use), call `registerResource` for its features.
* Store registered resources in LMDB so that the Admin UI can list them.

Example shape:

```ts
type RegisteredResource = {
  key: string;          // "dashboard.users", "module.reports"
  type: "page" | "module" | "entity";
  defaultActions: string[]; // e.g. ["read", "write", "manage"]
};
```

### 5.3 Role / Group Definition

* Provide a **Role management module** where Admin can:

  * Create/update roles/groups.
  * Assign permissions to roles.
  * Assign roles to users.

### 5.4 Permission Checking

Create centralized helpers:

* `canUserPerformAction(params: { userId, resourceKey, action })`
* `withAccessCheck(component, requiredPermissions)`
* Route-level checks for the dashboard.

In the dashboard:

* Only render a menu item if the user has permission.
* Only allow access to a page if the user has permission.

Copilot, always **reuse the centralized check** instead of re-implementing permission logic.

---

## 6. Internationalization & RTL

Implement i18n with these rules:

* Supported locales: **`en`** and **`ar`**.

* Use translation dictionaries, e.g.:

  ```ts
  // lib/i18n/getDictionary.ts
  export async function getDictionary(locale: "en" | "ar") { ... }
  ```

* For each text shown in the UI:

  * Use a translation key.
  * Do not hard-code long text strings in components.

Layout behavior:

* If locale is `en` → `dir="ltr"`, left-aligned.
* If locale is `ar` → `dir="rtl"`, right-aligned, invert layout where needed.

Add a **language switcher**:

* In the public layout.
* In the dashboard top bar.

The switcher should:

* Change locale segment in the URL (if using localized routes), or
* Change locale in a cookie / context, then refresh.

---

## 7. UI & Layout with shadcn/ui

Use shadcn/ui to build:

* **Public layout**: header, footer, main content.
* **Dashboard layout**:

  * Left **sidebar** (navigation).
  * Top bar (user menu, language switcher).
  * Main content area.

Guidelines:

* Use consistent components for:

  * Buttons
  * Inputs
  * Forms
  * Tables
  * Cards
* Keep design **minimal and clean**.

---

## 8. Coding Rules & Conventions

Copilot must follow these rules:

1. **Language in code**

   * No Persian or Arabic text in:

     * Variable names
     * Function names
     * Comments
     * Hard-coded strings
   * Only use English in code.
   * Use translation keys for user-facing text.

2. **TypeScript**

   * Use strict typing.
   * Define shared types in `lib/` or `modules/` as needed.

3. **Modularity**

   * Each feature/module should have:

     * Its own routes under `app/(dashboard)/modules/...` or similar.
     * Services/repositories in `modules/<feature>/`.
   * Shared building blocks go into `lib/` or `src/components/`.

4. **Reuse access control**

   * Never hard-code “isAdmin” checks inside components.
   * Always use centralized permission helpers.

5. **Clean, predictable structure**

   * Organize files by feature and responsibility.
   * Prefer small, focused components and functions.

---

## 9. Example Prompts for This Project

These are examples of how you (Copilot) will be asked to generate code:

* “Create a LMDB repository for users with functions to create, update, find by id, and find by email.”
* “Add a dynamic sidebar in the dashboard that shows menu items based on the current user permissions.”
* “Generate a role management page where Admin can create roles and assign resources and actions to each role using shadcn/ui components.”
* “Implement a language switcher component that toggles between English and Arabic and updates the layout direction.”
* “Create a helper function `canUserPerformAction` that loads user roles and permissions from LMDB and checks if the user can perform a specific action on a given resource key.”

 # Discover Natural Ability (DNA)
## Talent Intelligence Platform for Youth Sports

---

## 1. Product Definition

**Discover Natural Ability (DNA)** is a Talent Intelligence Platform designed to:
- Measure children's natural physical abilities
- Transform raw assessments into structured development stages
- Provide clear data, motivation, and long-term engagement
- Operate **above** academies and schools (not replacing training)

> DNA does NOT provide training programs, drills, or curricula.  
> It provides **assessment, stages, insights, and motivation**.

---

## 2. Core Philosophy

- Every child is on a **journey**, not a competition
- Data must be **objective**, but communication must be **positive**
- The child sees **progress and motivation**
- The coach sees **analysis and decision support**
- Parents see **clarity and reassurance**
- Stages are earned through **time + attendance + improvement**

---

## 3. User Roles

### 3.1 Discover Admin
- Create academies / schools
- Set organization type (Academy / School)
- Set training intensity (High / Low)
- Assign technicians
- Monitor data quality
- Audit badges and stage upgrades

### 3.2 Discover Technician
- Login with technician account
- Select assigned academy/school
- Select players
- Run assessment sessions
- Enter numeric test results only
- Close and lock assessment sessions

### 3.3 Academy / School Admin
- Create player profiles
- Manage age groups / training groups
- View reports
- Supervise coaches

### 3.4 Coach
- Record attendance (Present / Absent)
- View player dashboards
- Grant badges manually
- Approve stage upgrades

### 3.5 Player / Parent
- View Player Profile
- Track stage, progress, badges, medals
- Receive positive updates

---

## 4. Player Profile (Core of the System)

### 4.1 Player Profile Purpose
The Player Profile is the **digital identity** of the athlete inside DNA.

It must:
- Be understandable to a child
- Be trustworthy to a parent
- Be actionable for a coach
- Be consistent across years

---

## 5. Player Profile Structure

### 5.1 Basic Information
- Player ID (UUID)
- Full Name
- Profile Photo
- Date of Birth
- Age (calculated)
- Gender (optional)
- Academy / School
- Training Group (e.g. U10, U12+U14)
- Sport Preference (icon-based: ⚽ 🏀 🏊‍♂️ etc.)

---

### 5.2 Player Status
- Current Stage
- Stage Start Date
- Days in Current Stage
- Assessment Status:
  - New
  - First Assessment Completed
  - Reassessment
  - Stage Evaluation
  - Due for Reassessment

---

### 5.3 Natural Ability Score (NA Score)
- Single composite score
- Derived from 7 physical tests
- Used ONLY for:
  - Tracking personal progress
  - Stage eligibility
- NOT used for ranking players publicly

---

### 5.4 Physical Assessment Results (7 Tests)

Each test is numeric input only:

1. Speed (seconds)
2. Agility (seconds)
3. Balance (seconds)
4. Power (cm)
5. Reaction (ms or score)
6. Coordination (reps / time)
7. Flexibility (cm)

> No explanations, videos, or instructions in the app  
> Test protocols are internal to Discover

---

### 5.5 Strengths & Development Areas

#### Strengths
- Top 2–3 abilities
- Positive language only
- Example:
  - "Excellent balance and body control"

#### Development Areas
- Positive framing
- No word "weakness"
- Example:
  - "Great opportunity to improve flexibility"

---

### 5.6 Player Identity
- Assigned manually by Discover (not automatic)
- Examples:
  - Agile Player
  - Power Player
  - Balanced Athlete
- Displayed with icon and short description

---

### 5.7 Stage Progress
- Progress Bar (%)
- Based on:
  - Time in stage
  - Attendance
  - NA improvement
- Child never sees failure reasons

---

### 5.8 XP (Experience Points)
- Motivation only
- Example logic:
  - First assessment: +50 XP
  - Reassessment: +20 XP
  - Badge granted: +10 XP
  - Monthly cap: 100 XP

---

### 5.9 Badges (15 in MVP)

- Educational / behavioral / effort-based
- Examples:
  - Consistency Star
  - Focus Champion
  - Attendance Hero
- Granted manually by Coach
- Two states:
  - Unlocked (colored)
  - Locked (grey + 🔒 + general description)

---

### 5.10 Medals
- Tied to stages and organization type

**Academies (High Intensity):**
- Medal every 3 months
- Physical medal + certificate + photo

**Schools (Low Intensity):**
- Annual medal
- Progress reports during the year

Medals UI:
- PlayStation-style row
- Unlocked = colored
- Upcoming = grey locked

---

## 6. Stages System

### 6.1 Stage List
1. Explorer – Discovery stage
2. Foundation – Building base
3. Active Player – Consistent & engaged
4. Competitor – Performance-driven
5. Champion – High consistency & growth

---

### 6.2 Entry Rule
- Every player enters **Explorer** after first assessment

---

### 6.3 Stage Upgrade Conditions

To move from one stage to the next, ALL conditions must be met:

#### 1. Time in Stage
- Academy: ≥ 90 days
- School: ≥ 365 days

#### 2. Attendance Rate
- Explorer → Foundation: ≥ 50%
- Foundation → Active: ≥ 60%
- Active → Competitor: ≥ 70%
- Competitor → Champion: ≥ 75%

#### 3. NA Score Improvement
- ≥ 10% improvement compared to NA at stage entry

---

### 6.4 Upgrade Flow
- System evaluates conditions
- If met → status becomes "Ready for Stage Upgrade"
- Coach reviews and approves
- Stage History is updated
- Medal eligibility is triggered

> System suggests, Coach decides

---

## 7. Assessment Session Workflow

1. Player profile exists
2. Technician logs in
3. Select academy/school
4. Select player
5. Warm-up (12–15 min) – offline
6. Run 7 physical tests
7. Enter numeric results
8. System calculates NA, progress, stage status
9. Results sent to:
   - Player Profile
   - Coach Dashboard
10. Session is locked (no edits)

Session duration:
- ~30 minutes per player

---

## 8. Coach Dashboard (Private View)

Coach sees:
- Current & previous NA Score
- Age group benchmark
- Performance trend (↑ ↓ →)
- Explicit weak points
- Attendance %
- Assessment timeline
- Badge history
- Stage upgrade proposals

Coach does NOT see:
- Parent contact details
- Player app UI styling

---

## 9. Privacy & Psychology Rules

- Child never sees:
  - Negative labels
  - Weakness terminology
  - Comparisons with other players
  - Attendance failure reasons

- All critical actions are audited:
  - Who assessed
  - Who granted badge
  - Who upgraded stage

---

## 10. Language & Accessibility

- Full bilingual support:
  - Arabic (RTL)
  - English (LTR)
- Same logic, different UI direction
- Localization-ready for future languages

---

## 11. MVP Boundaries

Included:
- Manual input only
- No sensors or cameras
- No training content
- No AI recommendations

Future extensions:
- Device integrations
- PDF reports
- Advanced analytics
- National benchmarks

---

## 12. Summary for Developers

- DNA is not a training app
- Everything revolves around:
  - Player Profile
  - Assessments
  - Stages
  - Motivation
- Simple input, strong logic
- Positive UI, deep analytics behind the scenes

---

End of document.
