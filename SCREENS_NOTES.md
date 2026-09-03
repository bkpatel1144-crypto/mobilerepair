# App Screen-by-Screen Notes (for 1:1 rebuild)

Source: C:\Users\Admin\Downloads\NEWMAKDE\example\*.webp (78 images)
App name (top-left logo): "aim"
Goal: capture every visible detail per screen so the app can be rebuilt identically later.

---

## preview.webp — Settings > Backup & Restore

**Top bar:**

- Left: hamburger/menu icon, app logo "aim"
- Breadcrumb: Dashboard > Settings > Backup
- Right: Search box "Search..." with "Ctrl K" shortcut hint, expand icon, gear/settings icon, moon (dark mode) icon, a language/translate-looking icon, bell (notifications) icon, user avatar circle "S" (purple/violet), name "Shrey Ghadge" with role "Owner" beneath it.

**Left sidebar (nav), icons + labels, in order:**

1. Dashboard
2. Sales (with submenu chevron)
3. Service (with submenu chevron)
4. Finance (with submenu chevron)
5. Masters (with submenu chevron)
6. Second Hand Device
7. Reports
8. Administration
9. Settings (expanded/active, chevron pointing down), sub-items visible:
   - Branch Management
   - Workflow Designer
   - Company Settings
   - Financial Years
   - Billing & Subscription
   - Print Formats
   - WhatsApp
   - Backup & Restore (currently selected — highlighted teal/green background, bullet dot before label)

- Bottom of sidebar: "© 2025 ERP Pro"

**Main content header:**

- Icon (blue database/disk icon) + Title "Backup & Restore" (bold, large)
- Subtitle: "Download backups, schedule daily backups, and restore data safely"
- Right side: "Refresh" button (outlined, with refresh icon)

**Alert banner (yellow/warning style, full width):**

- Icon: cloud-off icon
- Bold text: "Google Drive not connected"
- Sub text: "Backups are stored safely in your own Google Drive (15GB free). Connect to enable backups."
- Right: blue filled button "Connect Google Drive" with google-drive-like icon

**Two-column card row:**

- Left card "Current Database" (database icon header):
  - 3 stat boxes side by side, each bordered:
    - "57" bold big number / "Data Sets" label
    - "317" bold big number / "Records" label
    - "273 KB" bold big number / "Data Size" label
- Right card "Create Backup" (icon header):
  - Text: "A backup contains your complete company data as an encrypted, compressed file."
  - Yellow inline notice: "Connect Google Drive above to enable stored & automatic backups. Direct download works without it."
  - Two buttons: teal/green filled "Backup Now" (with icon) and outlined "Download Backup" (with download icon)
  - Checkbox row (unchecked): "Daily automatic backup" with clock icon
  - Two greyed-out (disabled) inputs below it: "Time" field showing "02:00", "Keep for (days)" field showing "7", and a "Save" button (all disabled/greyed since checkbox unchecked)

**Backup History card:**

- Header: clock icon + "Backup History" + count badge "0"
- Empty state, centered text: "No backups yet. Create your first backup above."

**Restore from File card (bottom left, dashed/orange border style):**

- Icon (warning/alert triangle, orange) + "Restore from File"
- Text: "Upload a previously downloaded backup file (.erpbk or legacy .json.gz). You can restore it as a separate read-only archive (safe) or replace your live data (dangerous)." (cut off at bottom of screenshot)

**Archives card (bottom right):**

- Icon + "Archives" + count badge "0"
- Empty state text: "No archives. Restoring a backup as an archive creates a separate read-only copy of your data — useful for viewing old financial year..." (cut off)

**Color scheme observed:** White/light background, teal-green accent for primary actions & active nav, yellow/amber for warnings, blue for informational buttons, purple avatar circle, dark navy/black text.

---

## preview (2).webp — Settings > Print Formats — "Bill & Label Designer" (base state)

**Breadcrumb:** Dashboard > Settings > Print Formats
**Header:** printer icon + "Bill & Label Designer", subtitle "Design and manage print templates for bills, receipts and labels"
**Top-right buttons:** Refresh, "Add Missing Defaults" (sparkle icon), "Import Template" (upload icon), "Print Devices" (monitor icon), teal filled "+ New Template"
**Search bar:** "Search document types or templates..."

**List of document-type sections (each collapsible, chevron on right, shows "N formats" badge and "Default: <name>"):**

1. **Job Card** — 2 formats — Default: Default Job Card (58mm) — EXPANDED, showing 2 template cards:
   - "Default Job Card (80mm)" — "80×120mm · v1" — kebab menu (⋮)
   - "Default Job Card (58mm)" — "58×120mm · v1" — orange "★ Default" badge — kebab menu
2. **Job Card Bill** — 3 formats — Default: Default Job Card Bill (58mm) — collapsed
3. **Payment Receipt** — 2 formats — Default: Default Payment Receipt (58mm) — collapsed
4. **Purchase Receipt** — 2 formats — Default: Default Purchase Receipt (58mm) — EXPANDED:
   - "Default Purchase Receipt (80mm)" — "80×130mm · v1"
   - "Default Purchase Receipt (58mm)" — "58×130mm · v1" — "★ Default" badge
5. **Second Hand Device Purchase Receipt** — 2 formats — Default: Default Second Hand Device Pur... — collapsed
6. **Second Hand Device Sale Invoice** — 3 formats — Default: Default Second Hand Device Sale Invoi... — collapsed
7. **Second Hand Device Label** — 1 format — Default: Default Second Hand Device Label — collapsed
8. **Device Tag Label** — 1 format — Default: Default Device Tag Label — collapsed
9. **Product Label** — 1 format — Default: Default Product Label — collapsed
10. **Barcode Label** — 1 format — Default: Default Barcode Label — collapsed
11. **Customer Label** — 1 format — Default: Default Customer Label — collapsed

Sidebar active item: Print Formats (under Settings).

---

## preview (1).webp — same screen as (2) but with "New Print Template" MODAL open

**Modal title:** "New Print Template" with X close button
**Field: Name** — text input placeholder "e.g. Standard Job Card Bill"
**Field: Document Type** — dropdown OPEN showing list (Job Card highlighted/selected in light blue):

- Job Card (highlighted)
- Job Card Bill
- Payment Receipt
- Purchase Receipt
- Second Hand Device Purchase Receipt
- Second Hand Device Sale Invoice
- Second Hand Device Label
- Device Tag Label
- Product Label
- Barcode Label
- Customer Label
  **Buttons (partially covered by dropdown):** "Cancel" and teal "Create & Design"
  Background dimmed/greyed (modal overlay).

---

## preview (3).webp — Settings > Financial Years — "Create Financial Year" MODAL open

**Breadcrumb:** Dashboard > Settings > Financial Years
**Header:** "Financial Years", subtitle "Manage financial year periods and transitions"
**Top-right:** Refresh, teal "+ Create FY"
**Stat cards row:** "Total 1", "Active 1" (green check icon), "Locked 0" (lock icon), "Inactive 0" (orange icon)
**Below:** "Create Next FY" button (calendar icon), search box "Search financial years...", text "Activate a financial year first" (right-aligned, greyed)
**Table columns (dimmed behind modal):** Name, Start(Date), ..., tatus(Status), Created, Actions
**Table row visible:** star icon + "FY 2026-27" + orange "Current" badge | 01 A(pr)... | ...tatus col shows green "Active" badge | Created 01 Sep 2...

**Modal: "Create Financial Year"** (X close):

- Subtitle: "Add a new financial year for your organization"
- Field "Name *" — text input, focused (teal border), placeholder "e.g., FY 2025-26", helper text "0/20 characters"
- Fields side by side: "Start Date *" (dd-mm-yyyy, with calendar icon) and "End Date *" (dd-mm-yyyy, calendar icon)
- Info note box (blue bg, info icon): "Note: Use "Create Next FY" button for sequential years. This form is for manual creation only."
- Buttons: "Cancel" (outline) and teal filled "Create Financial Year"

Sidebar active: Financial Years.

---

## preview (4).webp — Settings > Financial Years — "Financial Year Details" SLIDE-OVER PANEL (right side)

Same base list page as (3) but without modal; instead a right-side drawer panel is open.
**Table now fully visible:**

- Columns: Name | Start Date | End Date | Status | Created | (Actions, cut off by drawer)
- Row: ★ FY 2026-27 [Current] | 01 Apr 2026 | 31 Mar 2027 | ⊙ Active (green) | 01 Sep 2...

**Right Drawer "Financial Year Details"** (X close top-right):

- Green calendar icon + "FY 2026-27" title, "Apr 01, 2026 – Mar 31, 2027", green "Active" badge
- Section "✓ Status Information" (green check icon):
  - Green box: "CURRENT STATUS: Active" — "This is the currently active financial year for all transactions"
- Section "📅 Period Details":
  - FINANCIAL YEAR NAME: FY 2026-27
  - START DATE: Apr 01, 2026
  - END DATE: Mar 31, 2027
  - DURATION: 12 months, 4 days
- Section "🏳 State Flags" (flag icon):
  - ACTIVE STATUS: Yes (green check icon, right-aligned)
  - LOCKED STATUS: No (green check icon, right-aligned)
- Blue info box "ⓘ Active Financial Year": "This is the currently active financial year. All new transactions will be recorded under this period. Only one financial year can be active at a time."
- Section "🕐 Timeline":
  - CREATED: Sep 01, 2026 · 09:46 AM (cut off at bottom)

---

## preview (5).webp — Settings > Company > Create — "Create Company" form

**Breadcrumb:** Dashboard > Settings > Company > Create
**Header:** "← Create Company" (back arrow), subtitle "Add a new company to your organization"
**Form card, fields (row 1, 3 cols):**

- Company Name * — text, value "Sunrise Enterprises"
- Company Code * — text, value "SUNRISE"
- Legal Name * — text, value "Sunrise Enterprises Pvt Ltd"
  **Row 2 (4 cols):**
- GST Registration * — dropdown, value "Regular" (teal border/focused)
- GSTIN * — text, value "29PQRSX6789L1Z2"
- PAN * — text, value "PQRSX6789L"
- Email * — text, value "contact@sunriseenterpr..." (truncated)
  **Row 3 (3 cols):**
- Phone * — text, placeholder "10-digit mobile"
- Currency * — dropdown, value "INR - Indian Rupee (₹)", green check "Currency selected" below
- Timezone * — dropdown, value "Asia/Kolkata (IST)", green check "Timezone selected" below
  **Note box (blue bg, info icon):** "Note: All fields marked with * are required. GSTIN is only required for registered companies (Regular/Composition) — pick "Unregistered" if this company isn't GST-registered. Ensure GSTIN and PAN match correctly."
  **Bottom buttons:** "✕ Cancel" (outline) and teal "🖫 Create Company"
  Sidebar active: Company Settings.

---

## preview (6).webp — Settings > Company — "Company Management" list + Company Details drawer

**Breadcrumb:** Dashboard > Settings > Company
**Header:** "Company Management", subtitle "Manage company information and settings"
**Stat pills:** "✓ Active 1" (highlighted/selected, green bg), "⊗ Inactive 0", "🗑 Deleted 0"
**Search:** "Search by name, code, or email..." + "Filters" button (funnel icon) + "⋮ More Actions"
**Viewing tag:** "Active Companies (1)"
**Table columns:** Company Name ↕ | Code ↕ | GSTIN ↕ | Contact ↕ (more columns cut off by drawer)
**Row:** 🏆(crown/shop icon, orange bg) "aim" + "Default" badge, sub "aim" | Code: "aim-MAIN" | GSTIN: "Unregistered" | Contact: "shrey@aavrti.co..." / "9865329865"
**Pagination:** "1–1 of 1 record", "Rows per page: 10 ▾"

**Right Drawer "Company Details" (X close):**

- Orange circle avatar "A" + "🛍 aim" bold + orange "★ Default" badge, sub "aim", green "● Active" badge
- "✎ Edit" button
- Yellow notice: "Default company — cannot be disabled or deleted."
- Section "🏢 Company Information": DISPLAY NAME "aim", LEGAL NAME "aim", COMPANY CODE "aim-MAIN"
- Section "✉ Contact Details" (green bg rows): EMAIL "shrey@aavrti.com", PHONE "9865329865"
- Section "📄 Tax & Registration" (purple bg): GST REGISTRATION "Unregistered (No GST)"
- Section "💲 Financial Settings" (green bg): CURRENCY "INR", TIMEZONE "Asia/Kolkata"
- Section "🕐 Timeline" (cut off)

---

## preview (7).webp — Admin > Workflow Designer — "Role Permissions" tab (base state)

**Breadcrumb:** Dashboard > Admin > Workflow Designer
**Header:** icon + "Workflow Designer", subtitle "Control exactly what each role can see and do at every job status."
**Tabs:** "Role Permissions" (active, teal filled), "Job Card Form", "Lead Form"
**Dropdown:** "Select a role to configure... ▾"
**Section "HOW IT WORKS" (3 numbered steps, cards):**

1. "Select a role" — "Pick a configured role from the dropdown above, or choose an unconfigured one to set it up fresh."
2. "Set visibility & actions" — "Control which job statuses this role can see and exactly which actions they're allowed to take at each step."
3. "Save & go live" — "Hit Save Config — changes apply instantly for every user with that role. No restart needed."
   **Section "CONFIGURED ROLES" (card grid):**

- Accountant — 👁 10 · ⚡ 7 (teal dot bullet)
- Manager — 👁 10 · ⚡ 32 (teal dot)
- Owner — 👁 10 · ⚡ 117 — "OWNER" yellow badge top-right (teal dot)
- Salesman — 👁 10 · ⚡ 18 (teal dot)
- Technician — 👁 5 · ⚡ 13 (teal dot)
  Sidebar active: Workflow Designer.

---

## preview (8).webp — Admin > Workflow Designer — "Lead Form" tab, Layout dropdown open

**Tabs:** Role Permissions, Job Card Form, "Lead Form" (active/teal)
**Row: Template** dropdown "Select a template... ▾" | **Layout** dropdown OPEN showing options:

- Standard (one field per row) ✓ (checked/selected)
- Compact (paired fields)
- Two Column
- Large Desktop
- Auto (adapts to screen size)
  **Top-right action buttons:** Import (upload icon), Export (download icon), "Save as template" (bookmark icon), "Discard changes" (undo icon), "Saved" label (grey), teal "Save" button (highlighted/focused)
  **Checkbox row:** "Use the icons on each field below to cor[figure]..." ☑ Contact Information ☑ Location (text cut off: "...ow-up" likely "Follow-up")

**Form fields (Lead Form builder), each field shows small icon controls (👁 eye/visibility, * required toggle, 🔒 lock, 📱 mobile-only) top-right of box:**

- Customer * — search box "Search customer by name or mobile..." with dropdown arrow and add-person icon
- Source (Optional) — dropdown "Cold Call"
- Assign To (Optional) — search box "Search user..."
- Name — hidden (greyed, eye-slash icon), Phone Number — hidden (greyed)
- Tags (Optional) — "Add tags..." input
- Next Follow-up Date (Optional) — date input "dd-mm-yyyy" + time input "--:--", quick buttons "Tomorrow", "In 3 days", "In a week"
- Alternative Mobile (Optional) — "Alternate number (optional)"
- Business Name (Optional) — "Shop / farm name (optional)"
- Follow-up Note (Optional) — textarea "What to discuss next time..."
- District — hidden, Taluka — hidden
- Village — hidden, City — hidden
- Address — hidden
- Notes (Optional) — textarea "Any additional note about this lead..."

Each field row has 4 tiny toggle icons top right (appears to be: visibility eye / required asterisk / lock / device-mobile) with colors: green circle = enabled/visible, grey/red = disabled per field.

---

## preview (10).webp — Admin > Workflow Designer — "Job Card Form" tab (top, scrolled to top)

**Tabs:** Role Permissions, "Job Card Form" (active/teal), Lead Form
**Row: Template** "Select a template... ▾" | **Layout** "Standard (one field per row) ▾"
**Top-right buttons:** Import, Export, "Save as template", "Discard changes", "Saved", teal "Save"
**Checkbox row (section toggles):** ☑ Customer Information, ☑ Device Information, ☑ Repair Information, ☑ Financial, ☐ Accessories (unchecked), ☑ Internal Details, ☑ Images

**Form fields:**

- Customer * (🔒 Locked badge) — "Search customer by name or mobile..." + add-person icon
- Alternative Mobile — hidden (greyed)
- Device Type * (🔒 Locked) — "Search device type..." + "+" button | Brand * (green eye, red *, lock icons) — "Select brand..." + "+" button
- Model * (icons) — "Enter model name..." + "+" | IMEI (Optional) (icons) — "15-digit IMEI (optional)" + scan icon
- Serial No (Optional) (icons) — "Serial number (optional)" + scan icon | Device PIN / Pattern (Optional) — "e.g. 1234 or tap Draw" + orange "⊞ Draw" button
- Problems * (🔒 Locked) — "Select problems..." dropdown + "+"
- Service Items (Optional — adds to estimated cost) — "Add items from catalog" (continues below fold)
- Estimated Cost (Optional) — "₹ 0" + quick amount chips: ₹200 ₹500 ₹1,000 ₹1,500 ₹2,000 ₹3,000 ₹5,000
- Advance Received (Optional) — "₹ 0" + quick chips: ₹0(selected/teal) ₹100 ₹200 ₹500 ₹1,000
- Items received (Optional) — "Select items received with device..." + "+"
- Items returned (Optional) — "Select items returned to customer..." + "+"
- Received By * (🔒 Locked) — "Shrey Ghadge" dropdown
- Assign To (Optional) — "Shrey Ghadge" with clear (×) + dropdown
- Remark (Optional) — textarea "Any additional note about the device / job..."
- "Add device images now — they will be uploaded when you create the job card." + dashed box "🖼 Add Images"
  **Bottom info bar (blue text):** "This is a live preview of the real Create Job Card form — toggle fields above, changes apply once you click Save in the Form Builder panel. Nothing here can be submitted or saved from this preview."

_(Note: preview(9) shows the same Job Card Form tab scrolled down — same content as above list, confirms field icon legend: green circle=eye/visible toggle, red circle=required(_) toggle, grey lock=locked/non-editable, small device icon=mobile visibility.)*

---

## preview (11).webp — Admin > Workflow Designer — "Role Permissions" > Accountant role > "Behavior" tab

**Role selector bar:** ● "Accountant" dropdown, "↻ click to switch role", "👁 10 statuses · ⚡ 7 actions", right: "Active" with teal toggle ON, "‹ Back" button
**Sub-tabs:** "Permissions", "Users", "⚡ Behavior" (active, teal) — helper text "Popups, undo & prompts"

**Toggle list (each: bold title + description + toggle switch):**

- "Collect payment with Generate Bill" — "Collect Payment section shows in the Generate Bill popup (partial / split / outstanding)." — ON (teal)
- "Print prompt after job card creation" — "After creating a job card, a popup offers Print Label / Print Receipt / WhatsApp." — ON (teal)
- "Require description on Job Done" — "Description is optional when marking a job done." — OFF (grey)
- "Can view prices & payment data" — "Sees estimated cost, final amount, paid, due, receipts and parts cost." — ON (teal)
- "Allow undo last action" — "Undo disabled — status changes are permanent for this role." — OFF (grey)

**Section "Auto-Open Popups"** — subtitle "Which popup opens automatically after an action completes — no extra click. All OFF by default."
Two cards side by side:

- "After Job Done" — "Technician marks the repair complete" — sub-toggles: "Open Generate Bill" ("Bill popup opens automatically") OFF, "Open Handover" ("Handover popup opens automatically") OFF
- "After Generate Bill" — "Bill is generated for the job" — sub-toggle: "Open Handover" ("Handover popup opens automatically") OFF
  (cut off: "After Receive Payment" section starting at bottom)
  **Footer bar:** "✓ All changes saved · Editing "Accountant"" (left), teal "🖫 Save Config" button (right)

---

## preview (12).webp — Admin > Workflow Designer — "Role Permissions" > Accountant > "Users" tab

**Sub-tabs:** Permissions, "👥 Users" (active, teal, helper "Assignment & who-did-it dropdowns"), Behavior
**Section "Assignment & Handover"** — "Who can be assigned jobs and where they hand off"

- ASSIGN TO ROLES — dropdown "All users"
- HANDOVER ROLES — dropdown "All users"
- ⇄ DEFAULT HANDOVER — dropdown "None (manual select)"

**Section "Who Did It — Dropdowns"** — "When an action happens, should the user pick who did it? Off = the logged-in user is recorded automatically."

- "Received By" — "Logged-in user is recorded automatically" — toggle OFF
- "Delivered By" — same desc — OFF
- "Cancelled By" — same desc — OFF
- "Returned By" — same desc — OFF
- "Field Visit Technician" — "Who checked in on an on-site visit" — toggle ON (teal), with sub-dropdown "All users can be selected"
  **Footer:** "✓ All changes saved · Editing "Accountant"", teal "Save Config" button
  (Note: this screenshot is slightly scrolled — top bar/header cut off, shown at very top edge)

---

## preview (13).webp — Admin > Workflow Designer — Role Permissions > role dropdown OPEN + "Permissions" sub-tab (Accountant)

**Role dropdown OPEN** (below "Role Permissions" tab), header "CONFIGURED", list:

- ● Accountant — 👁 10 ⚡ 7 — ✓ (checkmark, currently selected)
- ● Manager — 👁 10 ⚡ 32
- ● Owner — [OWNER badge] — 👁 10 ⚡ 117
- ● Salesman — 👁 10 ⚡ 18
- ● Technician — 👁 5 ⚡ 13
  (each has teal dot bullet)

**Behind dropdown, partially visible:** "...tior" tab label (Behavior), "Which statuses & actions" helper text, "Active" toggle ON, "Back" button.

**Below (Permissions sub-tab content, partly covered by dropdown):**

- "JOB ACCESS:" pill row — ● "All Jobs" (selected/teal), "Assignee + Open", "Assigned Only"
- "STATUS FILTER" label, dropdown "10 selected"
- Chips row of statuses (all removable with ×): ● Pending, ● In Queue, ● In Progress, ● On Hold, ● Technician Completed, ● Ready for Delivery, ● Delivered, ● Closed, ● Cancelled, ● Cancelled - Pending Return (each colored dot matches status)
- "Allowed Actions per Status" heading, subtitle "Tick a box = this role can do that action while the job is in that status", right-aligned "7 enabled"
- **Table** with row headers = statuses (Pending, In Queue, In Progress, On Hold, Technician Completed, Ready for Delivery...) and column headers = actions: Take Job, Job Done, Hold, Resume, Generate Bill, Payment, Deliver, Close, Cancel, Return & Close, Add Image, Add Part, Field Visit, Handover
- Checkboxes mostly empty except: row "Technician Completed" → "Generate Bill" column checked (teal ✓); row "Ready for Delivery" (partially cut off) → "Payment" column checked
  **Footer:** "✓ All changes saved · Editing "Accountant"", teal "Save Config"

---

## preview (14).webp — Admin > Branches — "Branch Management" list + "Branch Details" drawer

**Breadcrumb:** Dashboard > Admin > Branches
**Header:** "Branch Management", subtitle "Manage organizational branches and locations"
**Stat pills:** "Total Branches 1", "✓ Active 1" (selected/highlighted), "⊘ Inactive 0" (cut by drawer)
**Search:** "Search branches by name or code..." + Filters + "⋮ More Actions"
**Viewing tag:** "Active Branches (1)"
**Table columns:** Branch Name ↕ | Status ↕ | Type ↕ | Created ↕ | (Actions cut off)
**Row:** 👑 crown icon (orange bg) "Main Branch" + "Main" badge, sub "MAIN" | ✓ Active (teal badge) | System | 01 Sept 2026
**Pagination:** "1–1 of 1 record", "Rows per page: 10 ▾"

**Right Drawer "Branch Details" (X close):**

- Orange crown icon avatar + "Main Branch" bold + "Main" badge
- "Code: MAIN"
- "◔ Active" (green), "◯ System" badges
- "✎ Edit" button (outlined, focused/highlighted blue ring)
- Section "🏢 Branch Information": NAME "Main Branch", BRANCH CODE "MAIN"
- Section "◔ Status & Type": CURRENT STATUS "✓ Active" (green), BRANCH TYPE "◯ System Branch" (purple text) + "Protected system branch — Cannot be deleted"
- Section "🕐 Timeline": CREATED "Sep 01, 2026 · 09:46 AM", LAST UPDATED "Sep 01, 2026 · 09:46 AM"

---

## preview (15).webp — Admin > Branches — "Create New Branch" MODAL

Same base list page as (14) but with "+ Create Branch" top-right teal button visible (no drawer), and stat pills fully visible: "Total Branches 1", "✓ Active 1", "⊘ Inactive 0", "🗑 Deleted 0"
**Modal "Create New Branch"** (X close):

- Subtitle: "Add a new branch to your organization"
- Field "Branch Name" — text input (focused, teal border), placeholder "Enter branch name"
- Helper text: "A unique branch code will be auto-generated from the name."
- Buttons: "Cancel" (outline), teal "Create Branch"
- Bottom hint row: "Enter submit · Esc cancel" (small grey keyboard-shortcut badges)
  Table row behind modal shows Main Branch row with columns Branch Name/...pe(Type)/Created/Actions (eye icon + kebab menu visible in Actions column), pagination "Page 1 of 1" with «‹›» controls.

---

## preview (16).webp — Administration > System Audit

**IMPORTANT sidebar structure change on this screen:** "Administration" section is now EXPANDED (was collapsed icon-only before) showing sub-items:

- User Management
- Role Management
- Active Sessions
- IP Whitelist
- Login Report
- System Audit (active/selected, teal highlight + bullet)
  Below Administration section sits a collapsed "Settings >" nav item (with gear icon).
  (This confirms sidebar sections collapse/expand independently: Dashboard, Sales>, Service>, Finance>, Masters>, Second Hand Device>, Reports>, then either Administration or Settings expands depending on where you are.)

**Breadcrumb:** Dashboard > Admin > Audit
**Header:** "System Audit", subtitle "Every action across the system — who did what, when, and from where"
**Top-right:** Refresh button
**Stat cards:** "Total Events 23" (doc icon), "⚠ Critical 5" (red), "🕐 Today 23" (green)
**Search:** "Search by user, action, entity, or IP..." + Filters + "⬇ Export CSV"
**Section header:** "📈 Audit Trail (23 events)"
**Table columns:** Time ↕ | Action ↕ | Entity ↕ | Performed By ↕ | Target ↕ | Result ↕ | IP Address ↕ | (Details col, no sort)
**Rows (sample of visible ones):**

1. 1 Sept 2026, 10:32 am (Just now) | "Job Costing Create" (teal pill) | Job Costing (yellow pill) | Shrey Ghadge [OWNER] / 9865329865 · Main Branch | Target: – | Result: ✓ Success | IP 103.84.198.249 | 👁 Details
2. 10:31 am | "Second Hand Device Sale Create" (teal pill) ⚠(red warning icon) | SecondHandDeviceUnit | Shrey Ghadge [OWNER] | – | ✓ Success | 103.84.198.249 | Details
3. 10:29 am | "Second Hand Device Purchase Create" ⚠ | SecondHandDeviceUnit | Shrey Ghadge [OWNER] | – | ✓ Success | 103.84.198.249 | Details
4. 10:20 am | "Payment Receipt Create" ⚠ | Payment (green pill) | Shrey Ghadge [OWNER] | – | ✓ Success | 103.84.198.249 | Details
5. 10:05 am | "Job Card Deliver" (blue pill) | Job Card (yellow pill) | Shrey Ghadge [OWNER] | – | ✓ Success | 103.84.198.249 | Details
6. 10:05 am | "Job Card Bill" ⚠ | Job Card | Shrey Ghadge [OWNER] | – | ✓ Success | 103.84.198.249 | Details
   7-9. 10:05 am ×3 | "Job Part Update" (blue pill) | Job Part (yellow pill) | Shrey Ghadge [OWNER] | – | ✓ Success | 103.84.198.249 | Details
   **Pagination:** "1–23 of 23 Rows: [dropdown]", page controls "‹ 1/1 ›"
   Sidebar bottom shows "Settings >" collapsed (with gear icon) below Administration list — no "© 2025 ERP Pro" footer visible in this screenshot (scrolled/cut differently, or footer only shows when sidebar list is short).

---

## preview (17).webp — Admin > System Audit — "Job Costing Create" event Details MODAL

Base page same as (16). Modal opened (X close, top right of modal):

- Title: 🟢 "Job Costing Create", subtitle "Job Costing Create action"
- Section "Entity Details": Entity Type = "Job Costing" (yellow pill), Entity ID = "6a965c795655009beacf4fc6" (monospace code)
- Section "👤 Performed By": grey box — "Shrey Ghadge" [OWNER badge] [Main Branch badge], "Mobile: 9865329865"
- Section "Additional Details": code/JSON block:
  ```
  {
    "purchaseEntries": [
      "JPU-2026-27-00001"
    ],
    "_companyId": "6a9651a95655009beacf31d0"
  }
  ```
- Section "Session Information":
  - 🌐 IP Address: 103.84.198.249 (monospace)
  - 🖥 Browser: Chrome
  - 📅 Timestamp: 1 Sept 2026, 10:32:49 am
  - Result: SUCCESS (green pill) — cut off at bottom, scrollbar visible on right of modal

---

## preview (18).webp — Admin > Login Report

**Breadcrumb:** Dashboard > Admin > Login Report
**Header:** "Login Report", subtitle "See who logged in, when, and from where — click a card to change the view"
**Stat cards (6, clickable, grid):**

1. "Online Right Now" — 1 (green) — pulse icon — "Users currently logged in"
2. "Logins Today" — 1 (blue) — sign-in icon — "Successful sign-ins today" — SELECTED (blue border highlight)
3. "Users Today" — 1 (purple icon) — "Different people who logged in"
4. "IP Addresses" — 1 (purple globe icon) — "Unique locations today"
5. "Failed Attempts" — 0 (icon, cut off by drawer) — "Wrong passwords t..."
6. "Unauthorized" — 0 (red icon) — "Unknown users tried"
7. "Blocked IPs" — 0 (purple/pink icon) — "IP not allowed"
   **Below stats:** "🕐 Busiest time today: 9 AM"
   **Filter row:** search "Search name/mobile...", RANGE segmented buttons: "Today" (selected/teal), "Yesterday", "Last 7 days", "Last 30 days", "This month", "📅 Custom"; right: "IP" label + input "192.168.1.5"
   **Section:** "→] Logins Today (1)" + "Today" badge
   **Table columns:** User | Signed In | Signed Out | Duration | From (IP) | Device (cut off)
   **Row:** "Shrey Ghadge" / "9865329865" | "2026-09-01 09:47" / "just now" | "still signed in" (green italic) | "52m 31s" | "103.84.198.249" | "Chrome on Wind..." (cut)

**Right Drawer "Session Details" (X close):**

- 👤 USER: "Shrey Ghadge", "9865329865", "○ OWNER" badge
- Section "🕐 ACTIVITY": Signed in "2026-09-01 09:47" (just now), Signed out "—", Total time "52m 31s"
- Section "📍 WHERE FROM": IP address "103.84.198.249", Device "🖥 Chrome on Windows"
- "▼ Technical details" (expanded): raw user agent string: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"

---

## preview (19).webp — Admin > IP Whitelist — "Add IP to Whitelist" MODAL

**Breadcrumb:** Dashboard > Admin > Ip Whitelist
**Header:** shield icon (purple) + "IP Whitelist", subtitle "Allowed IPs / CIDR ranges for IP-restricted users"
**Top-right:** Refresh, teal "+ Add IP"
**Info banner (blue, partly covered):** "How it wo[rks]" ... "Supports..." ... "...ge) are affected. OWNER role always bypasses this check."
**Stat cards (partly covered):** "0 Total Entr[ies]" (globe icon), "...tive" (cut), "0 CIDR Ranges" (purple icon)
**Search bar (covered):** "Search by lab[el]..."
**Below (covered by modal):** "...user IP restrictions." text, teal "+ Add First IP" button (empty state)

**Modal "🛡 Add IP to Whitelist"** (X close):

- Subtitle: "Add a single IP (203.0.113.45) or a CIDR range (203.0.113.0/24)."
- Field "Label *" — text, focused (teal border), placeholder "e.g. Shop Main, Office Router"
- Field "IP Address / CIDR *" — placeholder "203.0.113.45 or 203.0.113.0/24", right-aligned link "◎ Detect My Current IP" (purple text)
- Field "Notes (optional)" — textarea, placeholder "e.g. ISP: Jio 100Mbps — changed Feb 2026"
- Toggle "Active" (ON, teal) — "Inactive entries are saved but not enforced at login"
- Buttons: "Cancel" (outline), teal "Add to Whitelist"

---

## preview (20).webp — Admin > Active Sessions — Session Details drawer (own session)

**Breadcrumb:** Dashboard > Admin > Sessions
**Header:** "Active Sessions", subtitle "Users who are currently signed in right now"
**Stat cards:** "⚡ Currently Online 1", "👥 Unique Users 1", "🕐 Idle (30m+) 1" (cut off by drawer, more likely exist)
**Table columns:** User | Role | Signed In | Last Activity | From (IP) | Device (cut)
**Row:** "Shrey Ghadge" ("⊙ You" badge) / "9865329865" | Role: "Owner" | Signed In "2026-09-01 09:47" / "51m 56s ago" | Last Activity "just now" | From (IP) "103.84.198.249" | Device "Chro[me]" (cut)

**Right Drawer "Session Details" (X close):**

- 👤 USER: "Shrey Ghadge", "9865329865", "○ Owner" badge
- Section "🕐 ACTIVITY": Signed in "2026-09-01 09:47" (just now); Last activity "2026-09-01 09:47" (just now); Signed in for "51m 56s"; Auto-expires on "2026-09-02 09:47"; grey pill "Inactive for 51m 56s"
- Section "📍 WHERE FROM": IP address "103.84.198.249"; Device "🖥 Chrome on Windows"; "▶ Technical details" (collapsed, triangle pointing right)
- Bottom highlighted box (grey bg, arrow icon): "This is your current session."

Sidebar active: Active Sessions (under expanded Administration).

---

## preview (21).webp — Admin > Roles > OWNER > Configure — "Menus & Permissions" tab (Full Access state)

**Breadcrumb:** Dashboard > Admin > Roles > OWNER > Configure
**Header row:** "← Back" | "👑 Owner" ["OWNER" badge] ["System" badge] ..... right: "👤 Shrey Ghadge"
**Tabs:** "Menus & Permissions" (active), "Dashboard & Landing"
**Stat/summary bar:** "⊞ 52/57 MENUS" | "⚿ 185/185 PERMISSIONS" | orange pill "⚠ Full access (*)" ..... right: "⌃ Collapse", "⌄ Expand", "Clear", "Select All", "⧉ Inherit from role", teal "✓ Full Access Granted"
**Search:** "Search menus..." + filter toggle "All / Selected / Unselected"

**Tree list (accordion, module = checkbox + expand chevron + name; right shows "x/y" submenu count, permission badge, checkmark):**

- ✓ **Sales** (expanded) — 2/2 — "⚿ 11/11" badge — ✓
  - ☑ Sales Invoices (nested checkbox card)
  - **Permissions 11/11** section — orange "Granted via full access (*)" badge
    - Table header: ENTITY | CREATE | DELETE | UPDATE | VIEW
    - Row "Invoices" — all 4 checked (teal checkmarks) — "11/11" top right
    - Other permission chips (checked, teal icon): Approve Invoice, Cancel Invoice, Email Invoice, Export Data, Record Payment, Print Invoice, Access Sales Module
- ☐ **Purchase** (collapsed checkbox unchecked) — 0/2
  - General Purchase (Parts & Stock) — sub-item shown unchecked
- ☐ **Inventory** (partially visible at bottom, cut off) — 0/2

**Footer bar:** "⊞ 52/57 menus" | "⚿ 0/185 permissions" | "⊞ 26 widgets" ..... "Cancel" (outline) | teal "🖫 Save"

---

## preview (22).webp — Same Owner Configure screen, scrolled down, Full-Access toggled OFF (partial access / unsaved state)

**Stat bar now shows:** "⊞ 34/57 MENUS" | "⚿ 78/108 PERMISSIONS" | (no "Full access" pill now) ..... "Collapse","Expand","Clear","Select All","Inherit from role", teal outline-ish "⊘ Grant Full Access" button (changed from "Full Access Granted")
**Tree (scrolled to show):**

- ☐ Sales — 0/2 (now unchecked!) — Sales Invoices sub unchecked
- ☐ Purchase — 0/2 — General Purchase (Parts & Stock) unchecked
- ☐ Inventory — 0/2 — Stock unchecked
- ☑ Service (collapsed, chevron right ">") — 5/5 — "⚿ 20/23" — ✓
- ☑ Finance (collapsed) — 8/8 — "⚿ 14/17" — ✓
- ☑ Masters (collapsed) — 8/8 — "⚿ 17/38" — ✓
- ☑ Second Hand Device (collapsed, cut off at very bottom) — partial numbers cut off
  **Footer bar:** "⊞ 34/57 menus" | "⚿ 78/108 permissions" | "⊞ 26 widgets" | orange "● Unsaved changes" label ..... "Cancel" | teal "Save"
  (This shows unchecking "Full Access" reveals granular per-module checkboxes that were previously all auto-checked.)

---

## preview (23).webp — Admin > Roles — "Roles Management" list + "Role Details" drawer (Owner role)

**Breadcrumb:** Dashboard > Admin > Roles
**Header:** "Roles Management", subtitle "Manage user roles, permissions, and menu access"
**Stat pills:** "Total Roles 5", "✓ Active Roles 5" (selected/highlighted), "⊘ Disabled Roles 0" (cut by drawer)
**Search:** "Search by role name or code..." + Filters + "⋮ More Actions"
**Viewing tag:** "Active Roles (5)"
**Table columns:** ROLE NAME | CODE | TYPE | STATUS (cut off further cols by drawer)
**Rows:**

1. 👑 "Owner" (row highlighted orange/selected) | Code "OWNER" (pill) | Type "Owner" (orange pill) | Status "Active" (green, cut)
2. ○ "Manager" | "MANAGER" | "Custom" | "Active"
3. ○ "Salesman" | "SALESMAN" | "Custom" | "Active"
4. ○ "Technician" | "TECHNICIAN" | "Custom" | "Active"
5. ○ "Accountant" | "ACCOUNTANT" | "Custom" | "Active"
   **Pagination:** "1–5 of 5 records", "Rows per page: 10 ▾"

**Right Drawer "Role Details" (X close):**

- 👑 orange crown avatar + "Owner" bold + "Owner" grey badge; badges row: "OWNER" (yellow), "Owner" (dark teal)
- "◔ Active" badge (green)
- Teal "⚙ Configure" button
- Section "🟣 Role Information": ROLE NAME "Owner", ROLE CODE "OWNER", ROLE TYPE "👑 Owner Role"
- Yellow/orange warning box "Owner Role": "This is the Owner role. It has full access and can only be managed by another Owner."
- Section "🕐 Timeline": CREATED "Sep 01, 2026 · 09:46 AM", LAST UPDATED "Sep 01, 2026 · 09:46 AM"

---

## preview (24).webp — Admin > Roles — "Roles Management" list, no drawer, full table visible

Same as (23) base list but no drawer open, so all columns visible: ROLE NAME | CODE | TYPE | STATUS | ACTIONS (eye icon 👁 + kebab ⋮ per row)
Top-right button here reads "+ Add Role" (teal).
Row 1 "Owner" highlighted (orange-tinted row, left orange border accent) — Code "OWNER" pill, Type "Owner" (orange pill), Status "Active" (green pill), Actions: 👁 ⋮
Rows 2-5 Manager/Salesman/Technician/Accountant — Code pills grey, Type "Custom" (grey pill), Status "Active" (green), Actions 👁 ⋮ each.
**Pagination footer:** "1–5 of 5 records", "Rows per page: 10 ▾", page nav "«‹ Page 1 of 1 ›»"
**Browser status bar (bottom-left tooltip visible):** "https://aim.kiwikit.in/dashboard/admin/roles" — ⚠ CONFIRMS APP DOMAIN/URL STRUCTURE: hosted at aim.kiwikit.in, route pattern `/dashboard/admin/roles`, so overall route base is `/dashboard/...`.

---

## preview (25).webp — Admin > User Management — "Users Management" list (no drawer)

**Breadcrumb:** Dashboard > Admin > Users
**Header:** "Users Management", subtitle "Manage system users, roles, and permissions"
**Top-right:** Refresh, teal "+ Add New User"
**Stat pills:** "Total Users 1", "🚶 Active Users 1" (selected/highlighted), "🚫 Disabled Users 0", "🗑 Deleted Users 0"
**Search:** "Search by name, email, or mobile..." + Filters + "⋮ More Actions"
**Viewing tag:** "Active Users (1)"
**Table columns:** USER | ROLE | CONTACT | STATUS | CREATED | ACTIONS
**Row:** 🟠 avatar "SG" + "Shrey Ghadge" + "Protected" badge (orange), sub-email "shrey@aavrti.com" | Role: "👑 Owner" (orange pill) | Contact: "📞 9865329865" | Status: "◔ Active" (green) | Created: "📅 Sep 01, 2026" | Actions: 👁 eye icon
**Pagination:** "1–1 of 1 record", "Rows per page: 10 ▾", nav «‹ Page 1 of 1 ›»

---

## preview (26).webp — Admin > Users > Createuser — "Add New User" form

**Breadcrumb:** Dashboard > Admin > Users > Createuser
**Header:** "← Add New User", subtitle "Create a new user account with role and permissions"
**Top-right:** "✕ Clear Draft" (blue text button), "Status: Incomplete" (pill), "Auto-saved 5:40:08 AM" (small grey text)
**Form fields:**

- Full Name * — text, placeholder "Enter full name" | Mobile Number * — placeholder "10-digit mobile"
- Email Address * — placeholder "user@example.com" | Password * — placeholder "Strong password" with eye/show icon
- Role * — dropdown value "Technician (TECHNICIAN)" (focused, teal border), green check "Role selected" below
- Yellow note box: "Security Note: Communicate password securely to the user"
  **Buttons:** "✕ Cancel" (outline), teal "🖫 Create User"

---

## preview (27).webp — DUPLICATE of preview (22).webp

Verified identical (same file size 29866 bytes, same content): Admin > Roles > OWNER > Configure, Menus & Permissions tab scrolled, Full Access OFF, "34/57 MENUS · 78/108 PERMISSIONS", Sales/Purchase/Inventory unchecked, Service/Finance/Masters checked, footer "Unsaved changes". No new information.

---

## preview (28).webp — DUPLICATE of preview (23).webp

Verified identical (same file size 33442 bytes): Admin > Roles list + "Role Details" drawer for Owner role. No new information.

---

## preview (29).webp — DUPLICATE of preview (24).webp (verified identical, Roles Management full list, no drawer)

## preview (30).webp — DUPLICATE of preview (25).webp (verified identical, Users Management list)

## preview (31).webp — DUPLICATE of preview (26).webp (verified identical, Add New User form)

---

## preview (32).webp — Reports > Field Visit Report

**IMPORTANT sidebar reveal:** "Reports" section now EXPANDED with sub-items:

- Service Reports
- Profit & Loss (greyed out, 🔒 lock icon — locked/restricted feature)
- Job-wise Profit
- Supplier Report
- Technician Report
- Period Summary
- Field Visit Report (active/selected, teal)
  Below Reports: collapsed "Administration >" and "Settings >" nav items.

**Breadcrumb:** Dashboard > Service > Field Visit Report
**Header:** 📍 orange location-pin icon + "Field Visit Report", subtitle "On-field technician logbook — time spent & engineers per job"
**Top-right:** "▽ Filters" button
**Stat cards (4):**

1. "TOTAL VISITS" — 0 (clipboard icon)
2. "TOTAL TIME SPENT" — 0m (clock icon, purple)
3. "TECHNICIANS ON-FIELD" — 0 (people icon) — "Tap to see who" (orange link text)
4. "JOBS VISITED" — 0 (briefcase icon, green)
   **Filter bar:** Quick range buttons "Today", "Yesterday", "This Week", "This Month", "This Year"; date range "dd-mm-yyyy" to "dd-mm-yyyy"; dropdowns "Technician: All Technicians", "Device Type: All Types", "Job Status: All Statuses"
   **View toggle:** "👥 By Technician (0)", "📋 By Job Card (0)" (segmented buttons)
   **Right:** search "Search technician...", "⬇ Export CSV"
   **Empty state:** centered text "No field visits logged in this period"

---

## preview (33).webp — Reports > Period Summary

**Breadcrumb:** Dashboard > Service > Period Summary
**Header:** 📅 icon + "Period Summary", subtitle "Daily and monthly revenue, cost, and profit summary"
**Top-right:** "⬇ Export Excel"
**Stat cards (6):** JOBS "1" | REVENUE "₹245" | JOB COST "₹6,200" | GROSS PROFIT "₹-5,955" | SHOP EXPENSES "₹0" (yellow-highlighted card, small doc icon) | NET PROFIT "₹-5,955" ↘ (red) | NET MARGIN "-2,430.61%"
(7 cards actually: Jobs, Revenue, Job Cost, Gross Profit, Shop Expenses, Net Profit, Net Margin)
**Filter bar:** search "Search date...", toggle "Daily"(selected/teal)/"Monthly", quick buttons "Today","Yesterday","This Week","This Month","This Year", date range "From dd-mm-yyyy" "To dd-mm-yyyy"
**Table columns:** Date | Jobs | Revenue | Job Cost | Shop Expenses | Net Profit | Margin
**Row (expandable, chevron down = expanded):** "▾ 2026-09-01" | 1 | ₹245 | ₹6,200 | — | ₹-5,955 (red) | -2430.61% (red)

**Expanded sub-panel:** "1 jobs on 2026-09-01" "₹245 revenue" "↘₹-5,955 profit" ..... "⬇ Export Excel"
Sub-table columns: JOB CARD | CUSTOMER | ASSIGNED TO | DEVICE | STATUS | REVENUE | COST | PROFIT | MARGIN
Row: "JC-2026-27-00001" (link, teal) | Tesdt | Shrey Ghadge | Samsung Galaxy A15 | Closed (grey pill) | ₹245 | ₹6,200 | ₹-5,955 (red) | -2430.6% (red)
"Page Total" row: ₹245 | ₹6,200 | ₹-5,955
Yellow box: "📄 Shop expenses in this period" ..... "- ₹0" — "No shop expenses recorded in this period." — "Rent, electricity, wages — the shop's own costs. They belong to the period, not to any one repair."
"Net after shop expenses" row: "₹-5,955" (red, right-aligned)
**Footer:** "1 records Show [10 ▾] per page"

---

## preview (34).webp — Reports > Technician Report

**Breadcrumb:** Dashboard > Service > Technician Report
**Header:** 👥 purple icon + "Technician Report", subtitle "Technician-wise job performance and profitability"
**Top-right:** "⬇ Export Excel"
**Stat cards (5):** TECHNICIANS "1" | JOBS "1" | REVENUE "₹245" | COST "₹6,200" | PROFIT "₹-5,955" ↘ (red)
**Filter bar:** search "Search technician...", dropdown "All Technicians", quick range buttons Today/Yesterday/This Week/This Month/This Year, date range From/To
**Table columns:** Technician | Jobs | Revenue | Cost | Profit | Margin | Avg/Job | Performance
**Row (expanded, chevron down):** "▾ Shrey Ghadge" | 1 | ₹245 | ₹6,200 | ₹-5,955 (red) | -2430.61% (red) | ₹-5,955 | "↘ Loss" (red pill, "Performance" col)

**Expanded sub-panel:** "1 jobs - Shrey Ghadge" ..... "⬇ Export Excel"
Sub-stat cards (6): REVENUE "₹245" | COST "₹6,200" | PROFIT "₹-5,955" (red) | AVG MARGIN "-2430.6%" (red) | WIN RATE "0%" | AVG / JOB "₹-5,955"
Sub-table columns: JOB CARD | CUSTOMER | DEVICE | STATUS | REVENUE | COST | PROFIT | MARGIN | DATE
Row: "JC-2026-27-00001" (link) | Tesdt | Samsung Galaxy A15 | Closed | ₹245 | ₹6,200 | ₹-5,955 | -2430.6% | 2026-09-01
**Footer:** "1 records Show [10 ▾] per page"

---

## preview (35).webp — Reports > Supplier Report

**Breadcrumb:** Dashboard > Service > Supplier Report
**Header:** 📦 orange icon + "Supplier Report", subtitle "Supplier-wise parts purchase and cost analysis"
**Top-right:** "⬇ Export Excel"
**Stat cards (3):** SUPPLIERS "1" | TOTAL PURCHASE "₹6,200" | TOTAL QTY "3"
**Filter bar:** search "Search supplier...", dropdown "All Suppliers", quick range buttons, date range From/To
**Table columns:** Supplier | Total Purchase | Total Qty | Jobs | Avg Cost/Unit | Share %
**Row (expanded):** "▾ 11" (supplier name/id "11") | ₹6,200 | 3 | 1 | ₹2,066.67 | orange progress bar "100.0%"

**Expanded sub-panel:** "3 transactions · 11" ..... "⬇ Export Excel"
Sub-stat cards (4): TOTAL SPENT "₹6,200" | TOTAL QTY "3" | TRANSACTIONS "3" | AVG COST/UNIT "₹2,067"
Section "TOP PARTS BY SPEND" (chips): 🔧 "Battery Replacement ×2 — ₹5,000", 🔧 "Back Panel / Housing Replacement ×1 — ₹1,200"
Sub-table columns: JOB CARD | PART NAME | DEVICE NAME | PURCHASE PRICE | QTY | TOTAL COST | JOB REVENUE | DATE
Rows:

- JC-2026-27-00001 | Battery Replacement | Samsung Galaxy A15 | ₹2,500 | 1 | ₹2,500 | ₹245 ↘920.4% (loss %, red) | 2026-09-01
- JC-2026-27-00001 | Back Panel / Housing Replacement | Samsung Galaxy A15 | ₹1,200 | 1 | ₹1,200 | ₹245 ↘389.8% | 2026-09-01
- JC-2026-27-00001 | Battery Replacement | Samsung Galaxy A15 | ₹2,500 | 1 | ₹2,500 | ₹245 ↘920.4% | 2026-09-01
  **Footer:** "1 records Show [10 ▾] per page"

---

## preview (36).webp — Reports > Job-wise Profit (breadcrumb label "Pnl Report")

**Breadcrumb:** Dashboard > Service > Pnl Report
**Header:** 📊 icon + "Job-wise Profit", subtitle "Job-wise profit and loss analysis"
**Top-right:** "⬇ Export Excel"
**Stat cards (5):** JOBS "1" | REVENUE "₹245" | COST "₹6,200" | PROFIT "₹-5,955" ↘ (red) | AVG MARGIN "-2,430.61%"
**Filter bar:** search "Search job, customer, tech", quick buttons Today/Yesterday/This Week/This Month/This Year, date range From/To
**Table columns:** Job | Customer | Assigned To | Revenue | Cost | Profit | Margin | Status
Row: "JC-2026-27-00001" (teal link) | Tesdt | Shrey Ghadge | ₹245 | ₹6,200 | ₹-5,955 (red) | -2430.61% (red) | Closed (grey pill)
**Footer:** "1 records Show [10 ▾] per page"

_(Note: "Profit & Loss" sidebar item is greyed with a lock icon across all Reports screens — appears to be a locked/premium feature not accessible in this account tier.)_

---

## preview (37).webp — Service > Job Costing — "Record Actual Costing" MODAL

**Background (dimmed):** Breadcrumb Dashboard > Service; Header "🧮 Job Costing" subtitle "Closed jobs — record ac[tual costing]"; search "Search job, custome[r]..."; table "Job" column shows "JC-2026-27-00001" row; "1 records Show 10"; top-right stat pills "0 in pipeline", "1 pending", "0 done" (partially visible)
Sidebar (Service expanded): Job Cards, Service Options, Job Costing (active), Service Items

**Modal "🪙 Record Actual Costing"** (subtitle "Draft saved", X close):

- Left panel — yellow box "⚠ 3 Part(s) from Job (reference)" table: PART | SUPPLIER | RATE | QTY
  - Battery Replacement | 11 | ₹210 | 1
  - Back Panel / Housing Replacement | 11 | ₹23 | 1
  - Battery Replacement | 11 | ₹12 | 1
- Cost item rows (3, each a bordered card), each row has type-tabs: "🟢 Part" (selected/teal) / "Labor" / "Overhead" / "Other", right badge "🔒 Linked" or "⚠ Cost required":
  1. "Battery Replacement" — search "11" — rate "210" (locked), Cost input "2500" (focused, teal border, stepper arrows), Qty "1" — "= ₹2,500" — small green text "↑ +₹2,290" (over-cost delta)
  2. "Back Panel / Housing Replacement" — "⚠ Cost required" badge red — search "11" — rate "23" (locked), red-bordered "Cost ₹" input, Qty "1" — "= ₹0"
  3. "Battery Replacement" — "⚠ Cost required" — search "11" — rate "12" (locked), red-bordered "Cost ₹" input, Qty "1" — "= ₹0"
- "+ Add Cost Item" link/button (dashed)
- Right panel: Job Card info card — "Job Card: JC-2026-27-00001", "Technician: Shrey Ghadge", "Device: Samsung Galaxy A15"
- Financial box: "Bill Amount ₹245", "Total Cost ₹2,500", "Profit ₹-2,255 (-920%)" (red)
- Yellow warning: "⚠ Actual cost exceeds original rate on some parts."
- "Notes (Optional)" textarea placeholder "Any notes..."
- Buttons: purple/violet "🖫 Save Costing" (full width), "Cancel" (text link below)

---

## preview (38).webp — Service > Reports (Service Reports) — expanded row detail

**Breadcrumb:** Dashboard > Service > Reports
**Header:** 📊 icon + "Service Reports", subtitle "Complete job card report with advanced filters"
**Top-right:** "⬇ Export Excel", "▽ Filters"
**Stat cards (6):** TOTAL JOBS "1" | PENDING "0" (orange) | IN PROGRESS "0" | COMPLETED "1" (green) | REVENUE "₹245" | OUTSTANDING "₹0" (red label but value 0)
**Filter bar row 1:** quick buttons Today/Yesterday/This Week/This Month/This Year, date range From/To
**Filter bar row 2:** Search "Job no, customer, brand, model...", dropdowns: Status "All Statuses", Assigned To "All Users", Received By "All", Device Type "All Types", Delivered By "All", Cancelled By "All"
**Table columns:** Created | Job Card | Customer | Device | Received By | Assigned To | Est. Cost | Final Amt | Paid | Due | Status | Delivered/Returned By | Cancelled By
**Row (expanded, ▾ chevron):** 2026-09-01 | "JC-2026-27-00001" (link) | Tesdt / 9876542310 | Samsung Galaxy A15 (Mobile) | Shrey Ghadge | Shrey Ghadge | ₹233 | ₹245 | ₹250 (teal) | ₹0 | "Closed" (grey pill) | Shrey Ghadge (purple link) | —

**Expanded detail (3 columns):**

- "DETAILS" — IMEI: 987465132065432 — "Delivered By: Shrey Ghadge" (top right of this block)
  - "PAYMENT" box: Final Amount ₹245, Total Paid ₹250, Outstanding "✓ Fully Paid" (green)
- "📦 PARTS / ITEMS" table: PART | SUPPLIER | RATE | QTY | TOTAL
  - Battery Replacement | 11 | ₹12 | 1 | ₹12
  - Back Panel / Housing Replacement | 11 | ₹23 | 1 | ₹23
  - Battery Replacement | 11 | ₹210 | 1 | ₹210
  - Total Parts Cost: ₹245
- "ACTIVITY TIMELINE" (scrollable list, bullet dots):
  - "Part added: Back Panel / Housing Replacement x1" — by Shrey Ghadge 2026-09-01 09:57
  - "Technician took the job" — In Queue → In Progress — by Shrey Ghadge 2026-09-01 09:59
  - "SEF" — by Shrey Ghadge 2026-09-01 10:00
  - "Part added: Battery Replacement x1" — by Shrey Ghadge 2026-09-01 10:02
  - "Repair completed by technician" (cut off, no timestamp visible)
    **Footer:** "Showing 1–1 of 1", "10 / page ▾"

---

## preview (39).webp — Second Hand Device > Sale Register — list + "Sale Details" drawer

**Breadcrumb:** Dashboard > Second Hand Devices > Sale Register
**Header:** "Sale Register", subtitle "All device sales — profit, margin and export"
**Stat pills:** "Sales (₹) 2500", "Profit (₹) 400", "Sales 1" (cut off further stats by drawer)
**Search:** "Receipt/invoice #, brand, mo[del]..." + quick buttons Today/Yesterday/This Week/This Month/This Year + date range + dropdown "All Device Types"
**Below:** "↗ Average margin: 19.0%"
**Table columns:** Sale Invoice # | Device | Buyer | Invested (cut off more columns by drawer)
**Row:** "SHDS-2026-27-00001" / "1/9/2026" | "Samsung Galaxy S24 (Mobile)" | "Tesdt" | "₹2,100"
**Footer:** "1–1 of 1", "Rows: 20 ▾"

**Right Drawer (Sale/Device Details, no visible title bar shown — starts mid-content, X close):**

- Title: "SHDS-2026-27-00001" bold, "Samsung Galaxy S24 · Mobile", "Sold" badge (blue)
- Buttons: "🖶 Print Invoice", icon dropdown, "🖶 Print Label", icon dropdown
- Fields: Model "Galaxy S24", Purchased On "1/9/2026", IMEI / Serial "987654321098765", Condition "Grade B", PIN / Pattern (dot pattern graphic shown)
- Section "🪪 SELLER & ID VERIFICATION": Seller "👤 11"
- Section "🛒 PURCHASE": Purchase Price "₹2,100", Payment Mode "CASH", Purchased By "Shrey Ghadge"
- Section "💰 SALE": Sale Invoice # "SHDS-2026-27-00001", Buyer "Tesdt", Sale Price "₹2,500", Warranty "0 days", Profit "₹400" (teal/green)
- Section "🕐 TIMELINE":
  - "Purchased" — "₹2,100 · SHDP-2026-27-00001" — 👤 Shrey Ghadge — 01 Sept 2026
  - "Sold" — (cut off at bottom) — 01 Sept 2026

## preview (40).webp — DUPLICATE of preview (39).webp (verified identical, same Sale Register + drawer)

---

## preview (41).webp — Second Hand Device > Purchase Register — list + "Device Details" drawer

**Breadcrumb:** Dashboard > Second Hand Devices > Purchase Register
**Header:** "Purchase Register", subtitle "All device purchases — filter, search and export"
**Stat pills:** "Purchases (₹) 2100", "Purchases 1" (more cut off by drawer)
**Search/filter bar:** "Receipt/invoice #, brand, mo[del]...", quick range buttons Today/Yesterday/This Week/This Month/This Year, date range, "All Device Types", "All Status[es]" (cut)
**Table columns:** Purchase # | Device | Seller | Purcha[se Price] (cut by drawer)
**Row:** "SHDP-2026-27-00001" / "1/9/2026" | "Samsung Galaxy S24 (Mobile)" | "11" | "₹2,100"
**Footer:** "1–1 of 1", "Rows: 20 ▾"

**Right Drawer (Device Details, X close):**

- Title "SHDP-2026-27-00001" bold, "Samsung Galaxy S24 · Mobile", "In Stock" badge (green)
- Buttons: "🖶 Print Receipt", icon dropdown, "🖶 Print Label", icon dropdown
- Section "📱 DEVICE": Type "Mobile", Brand "Samsung", Model "Galaxy S24", Purchased On "1/9/2026", IMEI/Serial "987654321098765", Condition "Grade B", PIN/Pattern (dot graphic)
- Section "🪪 SELLER & ID VERIFICATION": Seller "👤 11"
- Section "🛒 PURCHASE": Purchase Price "₹2,100", Payment Mode "CASH", Purchased By "Shrey Ghadge"
- Section "🕐 TIMELINE": "Purchased" — "₹2,100 · SHDP-2026-27-00001" — 👤 Shrey Ghadge — 01 Sept 2026

---

## preview (42).webp — Second Hand Device > Purchase Register — full list (no drawer)

Same base page as (41), no drawer, full columns visible: Purchase # | Device | Seller | Purchase Price | Status
Row: SHDP-2026-27-00001 / 1/9/2026 | Samsung Galaxy S24 (Mobile) | 11 | ₹2,100 | "In Stock" (green pill)
Top-right buttons: "⬇ Export CSV", "↻ Refresh" (no "Add" button visible — purchases likely created from a different flow/module)
**Footer:** "1–1 of 1", "Rows: 20 ▾", pagination "‹ 1/1 ›"

---

## preview (43).webp — Second Hand Device > Device Stock — list + "Device Details" drawer

**Breadcrumb:** Dashboard > Second Hand Devices > Stock
**Header:** "Device Stock", subtitle "Second hand devices currently in stock — invested amount and aging"
**Stat pills:** "In Stock 1", "Total Invested (₹) 2100", "Aging > 30 days 0" (cut off)
**Search/filter:** "Search stock...", quick range buttons, date range, "All Device Types"
**Table columns:** Purchase # | Device | Status | Purchase Price | Refurb Cost | Invested (cut by drawer)
**Row:** "SHDP-2026-27-00001" | "Samsung Galaxy S24" / "Mobile · 987654321098765 · Grade B" | "In Stock" (green) | "₹2,100" | "—" | "₹2,100"
**Footer:** "1–1 of 1", "Rows: 20 ▾"

**Right Drawer:** identical structure/content to (41)'s drawer (SHDP-2026-27-00001, In Stock, same Device/Seller/Purchase/Timeline sections).

---

## preview (44).webp — Second Hand Device > Device Stock — full list (no drawer)

Same base page as (43), no drawer — full columns: Purchase # | Device | Status | Purchase Price | Refurb Cost | Invested | Expected Sale Price | Days in Stock
Row: SHDP-2026-27-00001 | Samsung Galaxy S24 / Mobile · Grade B | "In Stock" (green) | ₹2,100 | — | ₹2,100 | — | 0
Top-right: "⬇ Export CSV", "↻ Refresh"
**Footer:** "1–1 of 1", "Rows: 20 ▾", pagination "‹ 1/1 ›"

---

## preview (45).webp — Second Hand Device > Device Sale — list + Device Details drawer (before sale)

**Breadcrumb:** Dashboard > Second Hand Devices > Sale
**Header:** "Device Sale", subtitle "Sell devices from stock to a buyer"
**Stat pills:** "Available to Sell 1", "In Refurb 0", "Sold 0" (cut off)
**Search/filter:** "Search receipt # / IMEI / bran[d]...", quick range buttons, date range, "All Device Types"
**Table columns:** Purchase # | Device | Expected Sale Price (cut by drawer)
**Row:** "SHDP-2026-27-00001" | "Samsung Galaxy S24" / "Mobile · Grade B" | "—"
**Footer:** "1–1 of 1", "Rows: 20 ▾"

**Right Drawer:** Same device details pattern (SHDP-2026-27-00001, In Stock) but SALE section reduced to "PRICING" header with just "Purchased By: Shrey Ghadge" (since not yet sold) — no Sale Price/Buyer fields shown yet. Timeline: only "Purchased" entry.

---

## preview (46).webp — Second Hand Device > Device Sale — "Sell Samsung Galaxy S24" MODAL

Base page same as (45) but no drawer; stat pills now show 4: "Available to Sell 1", "In Refurb 0", "Sold 0", "Total Profit (₹) 0"; top-right buttons "⬇ Export CSV", "↻ Refresh" visible.

**Modal "Sell Samsung Galaxy S24"** (X close):

- Box "📱 DEVICE PURCHASED": Device "Samsung Galaxy S24 (Mobile)", Condition "Grade B", IMEI/Serial "987654321098765", Purchased With "—", Expected Sale Price "₹0"
- Field "Buyer *" — search combobox value "11" (with × clear) + add-person icon button | Field "Sale Price *" — number input "0"
- Field "Payment Mode" — dropdown "Cash" | Field "Warranty" — number "0" + unit dropdown "Days"
- Field "📎 Accessories Given to Buyer" — dropdown "Charger, box, cable..." | Field "Notes (Optional)" — textarea "e.g. Screen protector applied before handover"
- Helper text: "Defaults to what was purchased with the device — edit if you're keeping anything back or adding something new."
- Buttons: "Cancel" (outline), teal "Confirm Sale"

---

## preview (47).webp — Second Hand Device > Device Purchase — list + Device Details drawer (with action buttons)

**Breadcrumb:** Dashboard > Second Hand Devices > Purchase
**Header:** "Device Purchase", subtitle "Buy used mobiles, laptops & other devices from sellers"
**Stat pills:** "Total Purchased 1", "In Stock 1", "In Refurb 0", "Sold 0" (cut off)
**Table columns:** Purchase # | Device | Seller | Purchase Price (cut by drawer)
**Row:** SHDP-2026-27-00001 | Samsung Galaxy S24 / Mobile · 987654321098765 | 11 | ₹2,100

**Right Drawer:** SHDP-2026-27-00001, "In Stock" badge — action buttons row now includes 4: "✎ Edit", "↗ Send to Refurb", "↩ Return to Seller" (red/danger text), plus Print Receipt/Print Label row below.
Sections identical to earlier drawer: DEVICE, SELLER & ID VERIFICATION, PURCHASE (Purchase Price ₹2,100, Payment Mode CASH, Purchased By Shrey Ghadge), TIMELINE (Purchased entry).

---

## preview (48).webp — Second Hand Device > Device Purchase — full list (no drawer)

Same base page as (47), no drawer, full columns: Purchase # | Device | Seller | Purchase Price | Status
Row: SHDP-2026-27-00001 | Samsung Galaxy S24 / Mobile · 987654321098765 | 11 | ₹2,100 | "In Stock" (green)
Stat pills fully visible: "Total Purchased 1", "In Stock 1", "In Refurb 0", "Sold 0", "Returned 0"
Top-right: "⬇ Export CSV", "↻ Refresh", teal "+ New Purchase"
**Footer:** "1–1 of 1", "Rows: 20 ▾", pagination "‹ 1/1 ›"

---

## preview (50).webp — Second Hand Device > Purchase > Create — "Buy Second Hand Device" form (TOP)

**Breadcrumb:** Dashboard > Second Hand Devices > Purchase > Create
**Header:** "Buy Second Hand Device", subtitle "Record a second hand device purchase from a seller — added to stock immediately."
**Top-right:** "🕐 Draft saved at 05:31 AM", "🗑 Clear Draft", "← Back"

**Section "📋 Device Details":**

- Row: Device Type * — combobox "Mobile" (× clear) + "+" add button | Brand * — combobox "Samsung" (× clear) + "+" add button
- Row: Model * — combobox "Galaxy S24" (× clear) + "+" | IMEI (Optional) — "987654321098765" + scan icon
- Row: IMEI 2 (Optional) — "Second IMEI (dual SIM)" + scan icon | Device PIN / Pattern (Optional) — "Pattern drawn" (dot graphic) + "Clear" (red text) + orange "⊞ Draw" button
- Row: RAM (Optional) — "8 GB" | Storage / ROM (Optional) — "128 GB"
- Row: Colour (Optional) — empty | Battery Health % (Optional) — "—"
- Row: Network (Optional) — dropdown "—" | Original Invoice Date (Optional) — "dd-mm-yyyy"
- Row: Warranty Left (months) (Optional) — "—"
- Checkboxes: ☐ Dual SIM, ☐ Box, ☐ Bill
- Right column: Condition Grade — dropdown "B — Good" | Account Lock (iCloud / Google) — dropdown "Not checked"
- Accessories Included (Optional) — dropdown "Charger, box, cable..."
- Condition Notes (Optional) — textarea "e.g. Minor scratches on back panel"
- Device Photos (Optional) — dashed box "🖼 Add Photos"

**Bottom buttons (sticky):** "Cancel" (outline), teal "Save Purchase"

---

## preview (49).webp — same form, scrolled down to "Seller & ID Verification" + "Purchase Details" sections

**Section "✓ Seller & ID Verification":**

- Seller * — combobox "11" (× clear) + dropdown arrow + add-person icon
- ID Proof Type — dropdown "Not Captured" | ID Proof Number (Optional) — "9876543210"
- ID Proof Photo (Optional) — dashed box, camera icon, "Capture / Upload ID proof photo", helper text "On mobile this opens the camera directly. Saved against this seller for records."
- Checkboxes: ☐ "IMEI checked against CEIR / blocked-device list", ☐ "Seller declared the device is theirs to sell and not stolen"

**Section "₹ Purchase Details":**

- Purchase Price * — "2100" (focused, teal border, stepper arrows) | Date of Purchase — "01-09-2026"
- Payment Mode — dropdown "Cash" | Amount Paid (Optional) — "2100", helper text "Paid in full."
- Purchased By (Optional) — dropdown "Whoever is logged in"
- Expected Sale Price (Optional) — "0", helper "What you plan to sell this device for. Shows on the Sale screen."
- Notes (Optional) — textarea "Optional notes"
  **Bottom buttons:** "Cancel", teal "Save Purchase"
  (Top of page, partially visible/scrolled past: fields for Network/Original Invoice Date/Warranty Left/checkboxes Dual SIM/Box/Bill — matches bottom of (50)'s left column)

---

## preview (51).webp — Masters > Parties — list + "Party Details" drawer

**Breadcrumb:** Dashboard > Masters > Parties
**Header:** "Parties", subtitle "Manage customers and suppliers"
**Search/toolbar:** "Search by name, mobile, or party code...", "▽ Filters", "↕ Sort: Party Name" (ascending arrow), "⬇ Export Excel", "⬇ Export CSV"
**Filter pills row 1 "Party Type":** "All" (selected/teal), "👤 Customers", "🚚 Suppliers", "👥 Both"
**Filter pills row 2 "Category":** "All" (selected/teal), "General Supplier", "Regular Customer", "Wal[k-in Customer]" (cut by drawer)
**Table columns:** Party | Mobile | Category (cut off more by drawer)
**Rows:**

- ☆ "11" / "PTY-2026-27-00002" | "9876543210" | "General Supplier"
- ☆ "Tesdt" / "PTY-2026-27-00001" | "9876542310" | "Walk-in Customer"
  **Footer:** "1–2 of 2", "Rows: 10 ▾"

**Right Drawer "Party Details":**

- Green circle avatar icon + "11" bold, "PTY-2026-27-00002" + "Active" badge (green)
- "📞 9876543210"
- Buttons: "✎ Edit", red "🗑 Delete"
- Section "ℹ DETAILS": Category "General Supplier", Mobile "9876543210"
- Section "💳 CREDIT": Credit Limit "₹0", Credit Days "15"

---

## preview (52).webp — Masters > Parties — "Create Party" MODAL with Category dropdown open

**Modal "Create Party"** (top-right: "🕐 Saved 05:30 AM", "🗑 Clear", X close):

- Field "Party Name *" — placeholder "e.g. Rajesh Kumar" | Field "Mobile *" — placeholder "10-digit mobile number"
- Field "Category" — dropdown OPEN: "General Supplier", "Regular Customer", "Walk-in Customer" | Field "Party Type *" — checkboxes ☑ Customer (checked, teal), ☐ Supplier
- Section label (partially covered by dropdown): "All optional — add what you need"
- Field "Address" — textarea "Shop / house, area, city, pincode" | Field "Email" — "name@example.com"
- Field "GST number" — "27ABCDE1234F1Z5" | Field "PAN number" — "ABCDE1234F"
- Row: "Area" — "Locality / area" | "Village" — "Village" | "Taluka" — "Taluka" | "District" — "District"
- Field "Pincode" — "6-digit PIN"
- Buttons: "Cancel" (outline), teal "Create Party"
  Background list page: stat/filter row shows "...r Customer" "Walk-in Customer" filter pills, table header "Status" column visible, top-right "↻ Refresh", teal "+ Add Party", pagination "‹ 1/1 ›"

---

## preview (53).webp — Masters > Parties — "Create Party" MODAL, "Hide extra details" EXPANDED (Category not yet selected)

Same modal as (52) but Category dropdown closed showing placeholder "Select Category ▾", and a toggle link "⌃ Hide extra details" shown above the optional-fields section (implies fields can be collapsed/expanded via this link — confirms the extra address/GST/PAN block is collapsible). All other fields same as (52): Address, Email, GST number "27ABCDE1234F1Z5", PAN number "ABCDE1234F", Area/Village/Taluka/District, Pincode. Buttons Cancel/Create Party.

---

## preview (54).webp — Masters > Party Categories — list + "Category Details" drawer

**Breadcrumb:** Dashboard > Masters > Party Categories
**Header:** "Party Categories", subtitle "Manage all party categories"
**Stat:** "Total 3"
**Table columns:** Category | Default (Customer) | Default (Supplier) | Status | Created (cut off)
**Rows:**

- "General Supplier" + blue "★ Default Supplier" badge | ☆ (outline star) | ★ (filled blue star) | "◔ Active" | "Sep 01, 2..."
- "Regular Customer" | ☆ | ☆ | "◔ Active" | "Sep 01, 2..."
- "Walk-in Customer" + orange "★ Default Customer" badge | ★ (filled orange star) | ☆ | "◔ Active" | "Sep 01, 2..."
  **Footer:** "1–3 of 3", "Rows: 10 ▾"

**Right Drawer "Category Details":**

- Purple folder icon + "General Supplier" bold, "GENERAL_SUPPLIER" (code), "◔ Active" badge
- "✎ Edit", red "🗑 Delete" buttons
- Section "💳 CREDIT INFORMATION": "DEFAULT CREDIT DAYS: 15 Days"
- Section "🕐 TIMELINE": Created "01 Sep 2026, 09:46 AM", Updated "01 Sep 2026, 09:46 AM"

---

## preview (55).webp — Masters > Party Categories — "Create New Category" MODAL

Base list (no drawer) shows full columns + Actions ("Edit"/"Delete" text links per row); top-right "↻ Refresh", teal "+ Add Category"; pagination "‹ 1/1 ›"

**Modal "Create New Category"** (top-right "🕐 Saved 05:29 AM", "🗑 Clear", X close):

- Field (unlabeled, first) — placeholder "Enter category name (e.g. Retail Customer)" (focused, teal border), helper "This name will be visible in parties and reports."
- Field — placeholder "Auto-generated code", helper "Unique system identifier. Auto-generated but editable."
- Buttons: "Cancel" (outline), teal "Create Category"

---

## preview (56).webp — Masters > Payment Modes — "Add Payment Mode" MODAL

**Breadcrumb:** Dashboard > Masters > Payment Modes
**Header (background):** "Payment Modes", subtitle "Cash, UPI, card, bank transfer and other accepted payment methods"
**Stats:** "Total 3", "Active 3"
**Search:** "Search payment modes..."
**Table (background, partially covered):** columns Payment Mode | Type | Des[cription] (cut)
Rows: "Cash ★" /"CASH" | "Cash" (green pill) | — ; "UPI"/"UPI" | "UPI" (purple pill) | —; "Card"/"CARD" | "Card" (blue pill) | —
Row actions (visible at right edge, behind modal): "Edit"/"Deactivate" for Cash & UPI, "Edit"/"Deactivate"/"Delete" for Card
**Footer:** "1–3 of 3", "Rows: 10 ▾", pagination "‹ 1/1 ›"

**Modal "Add Payment Mode"** (top-right "🕐 Saved 05:27 AM", "🗑 Clear", X close):

- Field "Name *" — placeholder "e.g. Cash, PhonePe UPI" (focused)
- Field "Code *" — placeholder "AUTO-GENERATED"
- Field "Type *" — dropdown "Cash"
- Field "Description" — placeholder "Optional"
- Checkbox "Set as default" — "Auto-select this mode during billing"
- Buttons: "Cancel" (outline), teal "Create"

---

## preview (57).webp — Masters > Item Master — list + "Item Details" drawer

**Breadcrumb:** Dashboard > Masters > Items
**Header:** "Item Master", subtitle "Products, services, and spare parts catalog"
**Stat pills:** "Total 10", "Active 10", "Services 10" (cut off, likely more e.g. "Raw Materials 0")
**Search/toolbar:** "Search items...", "▽ Filters"
**Table columns:** Item | Category | Type | Nature | UOM (cut off more by drawer)
**Rows (10 shown, all "Repair Services" category, Type "Service" green pill, Nature "Service", UOM "nos"):**

1. Back Panel / Housing Replacement — SRV009
2. Battery Replacement — SRV003
3. Button / Key Repair — SRV008
4. Camera Repair / Replacement — SRV005
5. Charging Port Repair — SRV004
6. Data Backup / Transfer — SRV014
7. Diagnosis / Inspection — SRV001
8. General Service Charges — SRV016
9. Microphone Repair — SRV007
10. Motherboard / Chip Level Repair — SRV011
    **Footer:** "1–10 of 16", "Rows: 10 ▾"

**Right Drawer "Item Details" (for Back Panel / Housing Replacement):**

- Green wrench icon + "Back Panel / Housing Replacement" bold, "SRV009" + "Active" badge
- Buttons: "✎ Edit", "🚫 Deactivate", red "🗑 Delete"
- Section "◇ CLASSIFICATION": Type "SERVICE" (pill), Nature "Service", Category "Repair Services", Primary UOM "Numbers (nos)"
- Section "₹ PRICING": Tax "GST 18%", GST "CGST 0% + SGST 0%", Selling Price "—", Purchase Price "—", MRP "—"
- Section "📦 INVENTORY": Stock Tracked "No"
- Section "⇄ ENABLED IN": green pills "Sales", "Purchase" (greyed/off), "Production" (greyed/off), "Service / POS" (green/on) — (Sales & Service/POS enabled, Purchase & Production disabled)
- Section "# DESCRIPTION": "Back cover and housing replacement"

---

## preview (58).webp — Masters > Item Categories — list + "Category Details" drawer

**Breadcrumb:** Dashboard > Masters > Categories
**Header:** "Item Categories", subtitle "Organise items into categories and sub-categories"
**Stat:** "Total 27"
**Search:** "Search categories..."
**Table columns:** Category | Type | Level | Items (cut off by drawer)
**Rows (all Type "Raw Material" purple pill, Level "Root", Items "0"):**

1. Spare Parts — SPARE_PARTS
2. Screens & Displays — SPARE_SCREENS — "Under: Spare Parts"
3. Batteries — SPARE_BATTERIES — "Under: Spare Parts"
4. Charging Ports & Flex — SPARE_CHARGING — "Under: Spare Parts"
5. Camera Modules — SPARE_CAMERAS — "Under: Spare Parts"
6. Speakers & Mic — SPARE_SPEAKERS — "Under: Spare Parts"
7. Buttons & Keys — SPARE_BUTTONS — "Under: Spare Parts"
8. Back Panel & Housing — SPARE_BACK_PANEL — "Under: Spare Parts"
9. IC & Chips — SPARE_IC_CHIPS — "Under: Spare Parts"
   (Note: "Spare Parts" is the root/parent; others are children "Under: Spare Parts" — hierarchical category tree with 27 total)

**Right Drawer "Category Details" (for Spare Parts):**

- Orange folder icon + "Spare Parts" bold, "SPARE_PARTS" + "Active" + "System" badges
- "✎ Edit" button only (no delete — system category)
- Section "◇ DETAILS": Type "Raw Material", Level "Root", Path "SPARE_PARTS"
- Section "📊 STATISTICS": two stat boxes "0 Items", "0 Sub-Categories"
- Section "DESCRIPTION": "Mobile repair साठी लागणारे सर्व spare parts" (Marathi text: "all spare parts needed for mobile repair")

---

## preview (59).webp — Masters > Units of Measure — "Create Unit of Measure" MODAL

**Breadcrumb:** Dashboard > Masters > Uom
**Header (bg):** "Units of Measure", subtitle "Manage units used across items, stock, purchases and sales"
**Stats (bg):** "Total 15", "System 10" (cut off)
**Search (bg):** "Search UOMs...", dropdown "All Types"
**Table (bg, partially covered):** columns Unit | ... | ...tion(Description) | Status
Rows visible: Pieces (PCS/pcs) | Numbers (NOS/nos) | Set (SET/set) | Pair (PAIR/pair) | Box (BOX/box) | Pack (PACK/pack) | Roll (ROLL/roll) | Meter (M/m) | Centimeter (CM/cm) | Inch (INCH/in) — all "System" source, "Active" status; Inch row shows extra "LENGTH" purple pill + "1" + "Base unit" (conversion info)
**Footer:** "1–10 of 15", "Rows: 10 ▾", pagination "1/2"

**Modal "Create Unit of Measure"** (X close):

- Field "UOM Name *" — placeholder "e.g. Kilogram, Pieces" (focused) | Field "UOM Code *" — placeholder "AUTO-GENERATED"
- Field "Type *" — dropdown "Quantity (Pcs, Nos, Dozen, Box)", helper "e.g. Pcs, Nos, Dozen, Box" | Field "Symbol / Abbreviation" — placeholder "e.g. kg, L, pcs", helper "Shown in dropdowns and reports"
- Field "Decimal Places" — "2", helper "0 = whole numbers (Pcs), 3 = precise (Kg)" | Field "Display Order" — "0", helper "Lower number = shown first in dropdowns"
- Box "Conversion (Optional)" — "Set this only if this UOM converts to another. e.g. 1 Quintal = 100 Kg" — "Base UOM" dropdown "None"
- Field "Description" — textarea "Optional notes about this unit"
- Buttons: "Cancel" (outline), teal "Create UOM"

---

## preview (60).webp — Finance > Payables

**IMPORTANT sidebar reveal:** "Finance" section EXPANDED with sub-items:

- Receipts & Payments
- Party Ledger
- Cash Book
- Receivables
- Payables (active, teal)
- Supplier Payables (greyed, 🔒 lock icon)
- Expenses (greyed, 🔒 lock icon)
  Below: collapsed Masters >, Second Hand Device >, Reports >, Administration >, Settings >

**Breadcrumb:** Dashboard > Finance > Payables
**Header:** "Payables", subtitle "Amounts owed back to customers — refunds & unused advances"
**Top-right:** "⬇ Export", "↻ Refresh"
**Stat cards (4):** TOTAL PAYABLE "₹15,000" (red) — "1 parties" | REFUND DUE "₹0" (red) — "Cancelled job refunds" | UNUSED ADVANCE "₹15,000" (orange) — "Advance not yet billed" | ADVANCE CREDIT "₹0" (purple) — "Un-billed job advances"
**Filter tabs:** "All" (selected/teal), "Refund Due", "Unused Advance"
**Search:** "Search party name, mobile"
**Row (expandable, ▾ expanded):** "11" / "9876543210" / "PTY-2026-27-00002" ..... orange "Unused Advance" badge, "Advance ₹15,000" badge ..... "₹15,000 payable" (red, right)

**Expanded sub-panel (3 colored boxes):**

- "TOTAL RECEIVED" — ₹15,000 (grey bg)
- "REFUND DUE" — ₹0 (red bg)
- "ALREADY REFUNDED" — ₹0 (yellow bg)
- Below: centered text "No pending payable details found"
  **Footer:** "Showing 1–1 of 1", "Rows: 10 ▾"

---

## preview (61).webp — Finance > Receivables (empty state)

**Breadcrumb:** Dashboard > Finance > Receivables
**Header:** "Receivables", subtitle "Outstanding amounts to be collected from customers"
**Top-right:** "⬇ Export", "↻ Refresh"
**Stat cards row 1 (4):** TOTAL OUTSTANDING "₹0" (red) — "0 parties" | TOTAL BILLED "₹0" | TOTAL COLLECTED "₹0" (green) | COLLECTION % "—"
**Stat cards row 2 (4, aging buckets):** "0-30 DAYS ₹0" | "30-60 DAYS ₹0" | "60-90 DAYS ₹0" | "90+ DAYS ₹0"
**Filter bar:** search "Search party name, mobile", quick buttons Today/Yesterday/This Week ("This Month" appears selected/teal)/This Year
**Empty state:** large ₹ icon (grey), "No outstanding receivables", "All payments are up to date"
**Status bar tooltip (bottom-left):** "https://aim.kiwikit.in/dashboard/finance/receivables" — confirms route naming

---

## preview (62).webp — Finance > Cash Book

**Breadcrumb:** Dashboard > Finance > Cashbook
**Header:** 🟣 purple book icon + "Cash Book", subtitle "All receipts and payments register"
**Top-right:** "↻ Refresh", "⬇ Export"
**Stat cards (4):** OPENING BALANCE "₹0" | TOTAL CREDIT (IN) "₹250" (green bg) | TOTAL DEBIT (OUT) "₹0" (red bg) | CLOSING BALANCE "₹250"
**Filter bar:** search "Search...", quick buttons "Today" (selected/teal), Yesterday, This Week, This Month, Last Month, This Year, date range "01-09-2026" to "01-09-2026", "▽ Filters"
**Table columns:** Date ↓ | Receipt # ↕ | Party ↕ | Description | Mode ↕ | Debit ↕ | Credit ↕ | Balance ↕
**Row:** "2026-09-01 / 09:57" | "RCP-2609-00001" | "Tesdt" / "9876542310" | "↙ Advance — Advance received at intake" | "CASH" (pill) | — | "₹250" (green) | "₹250"
**Row "Closing Balance" (1 entry total):** Debit "—", Credit "₹250", Balance "₹250"
**Footer:** "Showing 1–1 of 1 entries", "Rows: 25 ▾", pagination «‹[1]›»

---

## preview (63).webp — Finance > Party Ledger > Ledger detail (Tesdt) — "Khata" view

**Breadcrumb:** Dashboard > Finance > Ledger
**Header:** "← Tesdt" bold, "9876542310 · PTY-2026-27-00001" + "Customer" badge (grey pill)
**Top-right:** "↻ Refresh", "⬇ Export"
**Stat cards (5):** TOTAL BILLED "₹245" | TOTAL PAID "₹250" (green bg) | BALANCE "₹5 Cr" | SETTLED "✓ 1" (green) | UNSETTLED "🕐 0" (orange)
**Table columns:** Date | Particulars | Debit (Dr) | Credit (Cr) | Balance
**Rows:**

1. 2026-09-01 09:57 | 📄 "Job Card Created — Samsung Galaxy A15" / "Est: ₹233" | — | — | —
2. 2026-09-01 09:57 | ↙ "Advance Received — JC-2026-27-00001" (link, teal) / "CASH · RCP-2609-00001" | — | ₹250 | ₹250 Cr
3. 2026-09-01 10:05 | ₹ "Bill Generated — Samsung Galaxy A15 (Parts: ₹245, Service: ₹0)" / "JC-2026-27-00001" (link) | ₹245 (red) | — | ₹5 Cr
   **Row "Closing Balance":** Debit "₹245" (red), Credit "₹250", Balance "₹5 Cr"

---

## preview (64).webp — Finance > Party Ledger — list (before drilling into a party)

**Breadcrumb:** Dashboard > Finance > Ledger
**Header:** 🟢 open-book icon + "Party Ledger", subtitle "Party-wise accounts · Click to view full khata"
**Top-right:** "↻ Refresh" (no Export here)
**Stat cards (4):** TOTAL PARTIES "1" — "With job card activity" | TOTAL BILLED "₹245" — "Active jobs only" | TOTAL COLLECTED "₹250" (green) — "Incl. advance on unbilled jobs" | TOTAL OUTSTANDING "₹0" (red) — "Pending collection"
**Filter bar:** search "Search party name, mobile, code...", dropdown "👥 Select Parties ▾", segmented "All" (selected/teal) / "Customers" / "Suppliers"
**Table columns:** Party ↑ | Type | Jobs | Billed | Paid | Balance
**Row:** "Tesdt" / "9876542310 · Walk-in Customer" | "Customer" (grey pill) | 1 | ₹245 | ₹250 | "Settled ✓" (green) with "›" chevron (row is clickable → drills into ledger detail seen in (63))
**Footer:** "Rows per page: 10 ▾", "1–1 of 1 parties", pagination «‹[1]›»

---

## preview (65).webp — Finance > Receipts & Payments — "New Entry" MODAL

**Breadcrumb:** Dashboard > Finance > Receipts
**Header (bg):** "Receipts & Payments", subtitle "All payment entries — Job Cards and manual"
**Stat cards (bg, partial):** "TODAY RECEIVED ₹250 / 1 receipts", "NET AMOUNT ₹250 / After money out" (more cut off)
**Table (bg):** row "RCP-2609-00001" with "Advance" orange badge | Party "Tesdt" / "98765..." | Mode/Amount/Date columns cut by modal

**Modal "New Entry"** (X close):

- Toggle tabs: "₹ Receipt (IN)" (selected/teal-outlined), "₹ Payment (OUT)"
- Field "Customer *" — search "Search customer..."
- "Against" toggle: "Job Card" (selected/teal), "Manual / Advance"
- Field "Amount ₹ *" — "0" (focused, stepper arrows)
- "Payment Mode" toggle buttons: "💳 Cash" (selected/teal outline), "📱 UPI", "🏧 Card"
- Field "Notes (optional)" — placeholder "Any note"
- Buttons: "Cancel" (outline), teal "₹ Record Receipt"

---

## preview (66).webp — Finance > Receipts & Payments — list (no modal) with "Void Receipt" context menu

**Breadcrumb:** Dashboard > Finance > Receipts
**Header:** "Receipts & Payments", subtitle "All payment entries — Job Cards and manual"
**Top-right:** "↻ Refresh", teal "+ New Entry"
**Stat cards (3):** "TODAY RECEIVED ₹250 / 1 receipts" | "NET AMOUNT ₹250 (blue) / After money out" | "CASH · NET ₹250"
**Filter bar:** search "Search receipt, party...", quick buttons "Today" (selected/teal), Yesterday, This Week, This Month, This Year, dropdown "All Modes"
**Table columns:** Receipt # | Party | Against | Mode | Amount | Date | (Actions kebab)
**Row:** "RCP-2609-00001" + "Advance" (orange badge) | "Tesdt" / "9876542310" | "JC-2026-27-00001" | "CASH" (green pill) | "₹250" | "01 Sep, 09:57 AM" | ⋮ kebab menu OPEN showing red "🚫 Void Receipt" option
**Footer:** "Showing 1–1 of 1", "Rows: 10 ▾"

---

## preview (67).webp — MAIN DASHBOARD (home page) — full detail, very important reference screen

**Breadcrumb:** Dashboard (only)
**Sidebar (default/collapsed state):** Dashboard (active/teal), Sales >, Service >, Finance >, Masters >, Second Hand Device >, Reports >, Administration >, Settings >
**Greeting banner (gradient light bg):** "👋 Good morning, Shrey Ghadge" (name in teal) — "Here's what's happening in your service center."
**Quick action buttons row (4, each icon + label + arrow):**

1. 🔄 "Scan Job Card →" (grey icon bg)
2. ➕ "New Job Card →" (teal icon bg)
3. 👥 "New Party →" (blue icon bg)
4. ⚙ "New Item →" (purple icon bg)
   **Date range filter row:** 📅 "All Time" (selected/teal), "Today", "Yesterday", "This Week", "This Month", "This Year", "📅 Custom"

**Stat grid (12 tiles, 6 per row × 2 rows):**
Row 1: TOTAL JOB CARDS "1" (doc icon) | TOTAL IN PIPELINE "0" (pulse icon) | ALL JOB CARDS "1" (wrench icon, purple) | REVENUE "₹245" (₹ icon, green) | OUTSTANDING "₹0" (warning triangle, orange) | IN PROGRESS "0" (pulse icon, blue)
Row 2: PENDING "0" (clock icon, orange) | AVG TURNAROUND "6m" (clock icon) | CANCELLED "0" (⊗ icon, red) | IN QUEUE "0" (list icon, orange) | ON HOLD "0" (pause bars icon, orange) | TECH DONE "0" (check icon, green)
Row 3 (4 tiles): READY "0" (box icon, green) | DELIVERED "0" (truck icon, purple) | CLOSED "1" (lock icon, grey) | PENDING RETURN "0" (undo icon, orange)

**Charts row (2):**

- "Job Cards by Status" — "1 total" — donut chart, appears 100% single grey/blue segment ("100%" label inside)
- "Revenue Trend" — "Total: ₹245" — line/scatter chart, Y-axis labels ₹260/₹195/₹130/₹65, single green dot data point visible (chart cut off at bottom of screenshot, likely more below)

Sidebar bottom: "© 2025 ERP Pro" (visible since nav fully collapsed)

---

## preview (68).webp — Sales > Sales Invoices

**Breadcrumb:** Dashboard > Sales > Invoices
**Header:** 📄 icon + "Sales Invoices", subtitle "All generated bills — view or edit bills that are ready for delivery, delivered, or closed."
**Top-right:** "↻ Refresh"
**Filter tabs:** "All 1" (selected/teal), "Ready 0", "Delivered 0", "Closed 1"
**Search/filter bar:** "Search job card, customer, mobile...", date range "dd-mm-yyyy" to "dd-mm-yyyy" with calendar icons
**Table columns:** Bill Date | Job Card | Customer | Device | Total | Paid | Outstanding | Status | Actions
**Row:** "01 Sept 2026" | "JC-2026-27-00001" | "Tesdt" / "9876542310" | "Samsung Galaxy A15" | "₹245" | "₹250" (teal) | "—" | "Closed" (grey pill) | Actions: 👁 (view, outlined) and ✎ (edit, filled dark) icon buttons
Sidebar: "Sales" expanded showing only sub-item "Sales Invoices" (active).

---

## preview (69).webp — Service > Job Cards — "Owner — Jobs" main list (no drawer)

**Breadcrumb:** Dashboard > Service > Job Cards
**Header:** "Owner — Jobs", subtitle "Click a status card to filter"
**Top-right:** "↻ Refresh", teal "+ Create Job Card"
**Status filter cards (10, horizontal row, each clickable pill w/ icon+label+count):** "📁 Total 1" (selected/teal outline), "🕐 Pending 0", "☰ In Queue 0", "🔧 In Progress 0", "⏸ On Hold 0", "✓ Tech Done 0", "📗 Ready 0", "🚚 Delivered 0", "🔒 Closed 1", "⊗ Cancelled 0", "↩ Pending Return 0"
**Filter/search bar:** search "Search job, customer, mob[ile]...", small icon-grid button (barcode/scan?), quick range buttons Today/Yesterday/This Week/This Month/This Year, "▤ Filters", "📋 My Completed Jobs (1)", "📥 My Received Jobs"
**Table columns:** Created | Job Card | Customer | Device | Received By | Assigned To | Est. Cost | Final Amt | Paid | Due | Status | Delivered / Returned By | Cancelled By
**Row:** "01 Sep 2026 / 09:57 AM" | "JC-2026-27-00001" (bold) | "Tesdt" / "9876542310" | "Samsung Galaxy A15" / "Mobile" | "Shrey Ghadge" | "Shrey Ghadge" | ₹233 | ₹245 | "₹250" (teal) | "—" | "✓ Paid" then "Closed" pill below? (Actually shows both "Paid" badge and "Closed" status pill) | "Shrey Ghadge" | "—"
**Footer:** "Showing 1–1 of 1", "Rows: 10 ▾"

---

## preview (70).webp — Same Job Cards page, tiny/low-res full-page capture with Job Detail drawer open

Extremely small/compressed screenshot (whole browser viewport at reduced scale) showing the same "Owner — Jobs" list plus a right-side Job Card detail drawer. Content matches the clearer captures in (71)/(72): drawer shows job header, device info, problem reported, parts used with prices, people (received/assigned/delivered by), payment breakdown (Estimated/Advance/Paid/Total/Outstanding), notes, and an activity timeline (Created/Assigned/Advance Received/Part Added ×2/Taken/Note/Part Added...). No new information beyond what's captured in (71) and (72) at readable resolution — kept only as confirmation this drawer/detail view exists at a narrower breakpoint too.

---

## preview (71).webp — Service > Job Cards — "JC-2026-27-00001" Job Details DRAWER (top half)

**Drawer header:** wrench icon + "# JC-2026-27-0001" bold, "○ Closed" badge, "01 Sep 2026"; below: "Tesdt" bold + "📞 9876542310"
**Expand icon (top right, before X)** — opens full-page view (seen in (72))
**Action buttons row 1:** red outline "⊗ Cancel Job", "↻ Repeat Job"
**Action buttons row 2:** "🖶 Print Label" + dropdown, "🖶 Print Job Card" + dropdown
**Action buttons row 3:** "🖶 Print Bill" + dropdown, teal "💬 WhatsApp"
**Section "📱 DEVICE":** Type "Mobile", Brand "Samsung", Model "Galaxy A15", IMEI "987465132065432", PIN/Pattern (dot graphic) "Pattern"
**Section "⚠ PROBLEM REPORTED":** yellow box "Dsdd"
**Section "REMARK":** "dAWD"
**Section "RECEIVED WITH DEVICE AT INTAKE":** orange chips "SIM Card", "Back Cover"
**Section "RETURNED TO CUSTOMER AT INTAKE":** green chip "Memory Card"
**Section "🔧 PARTS USED (3)":** cards: "Battery Replacement — ₹12", "Back Panel / Housing Replacement — ₹23", "Battery Replacement — ₹210" (each with small icon)
**Section "RECEIVED BY":** avatar "Shrey Ghadge"
**Section "ASSIGNMENT":** avatar "Shrey Ghadge"
**Section "DELIVERED BY":** avatar "Shrey Ghadge"
**Section "PAYMENT":** Estimated ₹233, Advance ₹250, Paid ₹245(? ), Total Received ₹250(?), Outstanding "Paid ✓" — teal (exact numbers slightly ambiguous at this res but match (72)'s clearer Payment box)
**Section "NOTES (1)":** "SEF"
**Yellow box:** "Undo Last Action" + "Update" button
**Section "TIMELINE"** (scrollable, starts): "Created", "Assigned", "Advance Received", "Part Added", "Part Added", "Taken" (In Queue → In Progress badges), "Note", "Part Added" (continues, cut off)

---

## preview (72).webp — Service > Job Cards — "JC-2026-27-00001" FULL-PAGE Job Card Detail view (expanded from drawer)

**Header bar:** wrench icon + "JC-2026-27-00001" bold, "○ Closed" badge, "01 Sep 2026" ..... "TE" avatar + "Tesdt" + "📞 9876542310"
**Top-right buttons:** "🖶 Label" + dropdown, "🖶 Job Card" + dropdown, "🖶 Bill" + dropdown, "💬 WhatsApp", expand/collapse icon, X close
**Action buttons (below header, left):** red outline "⊗ Cancel Job", "↻ Repeat Job"
**Yellow banner:** "↺ Undo Last Action · no time limit" ..... "↺ Undo" button (orange, right-aligned)

**3-column layout:**
LEFT column:

- "📋 ITEMS AT INTAKE": "RECEIVED AT INTAKE" — orange chips "SIM Card", "Back Cover"; "RETURNED AT INTAKE" — green chip "Memory Card"
- "📱 DEVICE": TYPE "Mobile", BRAND "Samsung", MODEL "Galaxy A15", IMEI "987465132065432", PIN/PATTERN (dot graphic)
- "⚠ PROBLEM REPORTED": yellow chip "Dsdd"
- "REMARK": "dAWD"
- "👤 ASSIGNMENT": avatar "SH" + "Shrey Ghadge" / "Technician"; "Received By: Shrey Ghadge", "Delivered By: Shrey Ghadge"

MIDDLE column:

- "₹ PAYMENT": ESTIMATED ₹233, ADVANCE ₹250, PAID ₹250, BALANCE "Paid ✓" (green); below: "Parts Cost ₹245", "Final Amount ₹245"; "RECEIPTS": chip "RCP-2609-00001 ₹250 Cash Adv"
- "🔧 PARTS USED (3)": Battery Replacement "₹12 · 11", Back Panel / Housing Replacement "₹23 · 11", Battery Replacement "₹210 · 11"
- "🖼 IMAGES": "No images uploaded"
- "📝 NOTES (1)" (collapsible, chevron): "SEF"

RIGHT column:

- "🕐 TIMELINE" (full list visible):
  1. "Created" — "Job card JC-2026-27-00001 created" — Shrey Ghadge, 01 Sep 2026, 09:57 AM
  2. "Assigned" — "Technician assigned at creation — added to queue" — Shrey Ghadge, 01 Sep 2026, 09:57 AM
  3. "Advance Received" — "Advance ₹250 received" — Shrey Ghadge, 01 Sep 2026, 09:57 AM
  4. "Part Added" — "Part added: Battery Replacement x1" — Shrey Ghadge, 01 Sep 2026, 09:57 AM
  5. "Part Added" — "Part added: Back Panel / Housing Replacement x1" — Shrey Ghadge, 01 Sep 2026, 09:57 AM
  6. "Taken" — "Technician took the job" — badges "In Queue → In Progress" — Shrey Ghadge, 01 Sep 2026, 09:59 AM
  7. "Note" — "SEF" — Shrey Ghadge, 01 Sep 2026, 10:00 AM
  8. "Part Added" — "Part added: Battery Replacement x1" — Shrey Ghadge, 01 Sep 2026, 10:02 AM
  9. "Repair Done" — "Repair completed by technician" — badges "In Progress → Tech Completed" — Shrey Ghadge, 01 Sep 2026, 10:03 AM (continues, cut off at bottom)

---

## preview (73).webp — Service > Service Options — master config list (accordion)

**Breadcrumb:** Dashboard > Service > Service Options
**Header:** "Service Options", subtitle "Manage device types, brands, and problem tags used in job cards"
**Top-right:** teal "🔀 Split shared brands", "↻ Refresh"
**Info banner (yellow):** "ⓘ Some brands are still shared across multiple device types. Click Split shared brands above to give each device type its own independent brand row. Existing job cards stay untouched."

**Accordion sections (each with count badge, expand chevron, "+" add button on right):**

1. **Brands** — "🔗 6 device types" badge, count "20" — EXPANDED:
   - "Mobile" (collapsed) — count 19
   - "Keypad Phone" (collapsed) — count 7
   - "Tablet" (collapsed) — count 14
   - "Smart Watch" (EXPANDED) — count 7 — sub-list (drag handle ⠿, name, #index, edit ✎, delete 🗑 icons per row):
     - Samsung (#1)
     - Xiaomi (#2)
     - Redmi (#3)
     - Realme (#4)
     - OnePlus (#7)
     - Apple (#8)
     - Other (#20)
   - "Earbuds / TWS" (collapsed) — count 10
   - "Laptop" (collapsed) — count 3
   - "+ Add brand" link
2. **Cancel Reasons** — count 5 (collapsed)
3. **Customer Items** — count 5 (collapsed)
4. **Device Types** — count 6 (collapsed)
5. **Hold Reasons** — count 5 (collapsed)
6. **Models** — "🔗 18 brands" badge, count 91 (collapsed)
7. **Outstanding Reasons** — count 4 (collapsed)
8. **Problems** — count 1 (collapsed)

---

## preview (74).webp — Service > Job Costing — list + "Costing Details" drawer (view mode, after costing recorded)

**Breadcrumb:** Dashboard > Service > Job Costing
**Header:** 🟪 icon + "Job Costing", subtitle "Closed jobs — record actual parts, labor & overhead costs"
**Filter bar:** search "Search job, customer, devi[ce]...", quick buttons Today/Yesterday/This Week/This Month/This Year, date range, segmented "All"(selected/teal)/"Pending"/"Done", "✕ Clea[r]" (cut by drawer)
**Table columns:** Job | Customer | Device | Technician | Parts | Revenue | Pro[fit] (cut by drawer)
**Row:** "JC-2026-27-00001" | "Tesdt" | "Samsung Galaxy A15" | "Shrey Ghadge" | "⚙ 3 parts" | "₹245" | (Profit column cut off)
**Footer:** "1 records Show 10 per page"

**Right Drawer:**

- Header: "JC-2026-27-00001" bold ..... teal "₹ Record Cost" button (top right)
- Badges: "Closed" (grey), "Pending Costing" (orange)
- Section "JOB DETAILS": CUSTOMER "Tesdt", TECHNICIAN "Shrey Ghadge", DEVICE "Samsung Galaxy A15", IMEI "987465132065432", CREATED "01 Sep 2026, 09:57 AM", CLOSED "01 Sep 2026, 10:05 AM"
- Box "FINANCIAL": Revenue "₹245" (blue), Advance Paid "₹250"
- Section "PARTS USED (3)" — table: Part | Supplier | Rate | Qty | Total
  - Battery Replacement | 11 | ₹210 | 1 | ₹210
  - Back Panel / Housing Replacement | 11 | ₹23 | 1 | ₹23
  - Battery Replacement | 11 | ₹12 | 1 | ₹12

---

## preview (75).webp — Service > Service Items

**Breadcrumb:** Dashboard > Service > Service Items
**Header:** "Service Items", subtitle "Items and services used in job cards — managed via Item Master"
**Top-right:** "↻ Refresh", teal "+ Add Item"
**Stat cards (3):** "Total 10" | "Services 10" | "Parts 0"
**Info banner (blue text):** "Service items are managed in Item Master. Items with POS / Service enabled (IobConfig.pos.isActive) appear here automatically. To add or edit items, use Item Master." ..... button "↗ Item Master"
**Search:** "Search service items..."
**Table columns:** Item | Category | Type | UOM | Selling Price | (Edit action)
**Rows (10, all Category "Repair Services", Type "Services" green pill, UOM "nos", Selling Price "—", each row has "↗ Edit" link):**

1. Back Panel / Housing Replacement — SRV009
2. Battery Replacement — SRV003
3. Button / Key Repair — SRV008
4. Camera Repair / Replacement — SRV005
5. Charging Port Repair — SRV004
6. Data Backup / Transfer — SRV014
7. Diagnosis / Inspection — SRV001
8. General Service Charges — SRV016
9. Microphone Repair — SRV007
10. Motherboard / Chip Level Repair — SRV011
    (Same 10 items/order as Item Master list in preview 57 — confirms Service Items is a filtered read-only view of Item Master)

## preview (76).webp — DUPLICATE of preview (75).webp (verified identical, Service Items list)

---

## preview (77).webp — Finance > Receipts & Payments — list, no context menu (near-duplicate of preview (66) minus the open kebab menu)

Identical page/data to preview (66).webp: same header, subtitle, stat cards (TODAY RECEIVED ₹250/1 receipts, NET AMOUNT ₹250/After money out, CASH · NET ₹250), same filter bar (Today selected, All Modes), same table row (RCP-2609-00001 [Advance badge] | Tesdt / 9876542310 | JC-2026-27-00001 | CASH | ₹250 | 01 Sep, 09:57 AM), same footer "Showing 1–1 of 1, Rows: 10". Only difference: the row's "⋮" kebab menu is closed here (vs. open showing "Void Receipt" in (66)). No new information.

---

# END OF SCREEN NOTES — ALL 78 IMAGES REVIEWED

**Total files:** 78 (`preview.webp` + `preview (1)` through `preview (77)`)
**Unique screens documented in detail:** ~68
**Confirmed exact-duplicate files (verified byte-identical, same content):**

- preview (27) = preview (22)
- preview (28) = preview (23)
- preview (29) = preview (24)
- preview (30) = preview (25)
- preview (31) = preview (26)
- preview (40) = preview (39)
- preview (76) = preview (75)
- preview (77) ≈ preview (66) (same data, one UI menu state difference — not byte-identical but functionally the same screen)

## Cross-cutting observations (apply app-wide)

1. **App name:** "aim" (logo top-left, lowercase, bold). Footer everywhere: "© 2025 ERP Pro". Likely a multi-tenant ERP/repair-shop SaaS branded "aim" built on an "ERP Pro" platform.
2. **Live domain:** `https://aim.kiwikit.in` — routes follow pattern `/dashboard/<module>/<section>` e.g. `/dashboard/admin/roles`, `/dashboard/finance/receivables`.
3. **Top bar (present on every screen):** hamburger/collapse icon, "aim" logo (left) — breadcrumb trail — Search box "Search..." with "Ctrl K" shortcut, expand/fullscreen icon, gear icon, moon (dark-mode toggle) icon, a translate/language icon, bell (notifications) icon, user avatar (purple circle with initial) + name "Shrey Ghadge" + role "Owner" underneath.
4. **Left sidebar top-level items (always in this order):** Dashboard, Sales, Service, Finance, Masters, Second Hand Device, Reports, Administration, Settings. Only one section expands at a time (accordion behavior); expanding one auto-collapses others. Footer: "© 2025 ERP Pro".
5. **Sales** sub-items seen: Sales Invoices.
6. **Service** sub-items seen: Job Cards, Service Options, Job Costing, Service Items. Field Visit Report/Reports links live under a separate "Reports" section.
7. **Finance** sub-items seen: Receipts & Payments, Party Ledger, Cash Book, Receivables, Payables, Supplier Payables (🔒 locked/premium), Expenses (🔒 locked/premium).
8. **Masters** sub-items seen: Units of Measure, Item Categories, Item Master, Payment Modes, Party Categories, Parties.
9. **Second Hand Device** sub-items seen: Device Purchase, Device Sale, Device Stock, Purchase Register, Sale Register.
10. **Reports** sub-items seen: Service Reports, Profit & Loss (🔒 locked/premium), Job-wise Profit, Supplier Report, Technician Report, Period Summary, Field Visit Report.
11. **Administration** sub-items seen: User Management, Role Management, Active Sessions, IP Whitelist, Login Report, System Audit.
12. **Settings** sub-items seen: Branch Management, Workflow Designer, Company Settings, Financial Years, Billing & Subscription, Print Formats, WhatsApp, Backup & Restore.
13. **Design system / colors:** White/light background everywhere (no dark mode screenshots captured, though a moon toggle exists in top bar implying dark mode support). Primary action color = teal/dark-cyan (buttons like "Save", "Create X", active nav highlight, selected tabs/pills). Warning/yellow = amber boxes for notices, locked/pending badges. Danger/red = delete, cancel, negative numbers, overdue. Success/green = active status, paid, positive profit. Blue = informational buttons/links, "Connect", counts. Purple = used for avatars, some icons (Session/Role management), Job Costing icon. Orange = crown/shop icons for "default"/"main" entity badges, warnings.
14. **Common UI patterns:**
    - List pages: header (icon+title+subtitle), stat-pill row (clickable filters), search+filter toolbar, data table with sortable columns (↕ arrows), pagination footer ("N–M of T", "Rows per page ▾", «‹ Page X of Y ›»).
    - Row click → opens a right-side slide-over "Details" drawer (X to close) with sectioned info blocks, Edit/Delete/other action buttons, and often a Timeline/Created-Updated section at the bottom.
    - "Create X" is always a teal button top-right, opening either a centered modal or a dedicated full-page form (breadcrumb ".../Create").
    - Forms show required fields with a red asterisk *, optional fields labeled "(Optional)", inline helper text under fields, and often an amber/blue "Note:" info box above the submit buttons.
    - Modals commonly show autosave state top-right ("Saved HH:MM AM", "Draft saved", "Clear/Clear Draft") and a "Cancel"/teal-primary button pair at the bottom.
    - Currency throughout: ₹ (Indian Rupee). Dates: "DD Mon YYYY" display format, "dd-mm-yyyy" input format. Locale: India (GST, PAN, GSTIN fields; IST timezone default).
15. **Sample/seed data used consistently across screens:** Company "aim" (code aim-MAIN, unregistered/no GST), Branch "Main Branch" (code MAIN), Owner user "Shrey Ghadge" (shrey@aavrti.com, 9865329865), one Job Card "JC-2026-27-00001" (customer "Tesdt", device Samsung Galaxy A15, closed, ₹245 bill, ₹250 paid), one Second Hand Device deal (Samsung Galaxy S24, purchased ₹2,100 from party "11", sold to "Tesdt" for ₹2,500, ₹400 profit), Financial Year "FY 2026-27" (01 Apr 2026–31 Mar 2027), Roles: Owner/Manager/Salesman/Technician/Accountant, current date in-app "01 Sept 2026".
