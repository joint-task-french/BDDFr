## 2025-05-04 - Missing ARIA Labels on Close Buttons and Icon-Only Actions
**Learning:** Many interactive dialogs, modal panels, and list actions in the codebase (like the `&times;` close buttons in `SelectionModal`, `FilterPanel`, `BuildActions`, and emoji buttons for load/edit/delete) lacked `aria-label` attributes. While some had a visual `title`, they still needed explicit `aria-label` attributes to ensure consistent screen reader support.
**Action:** When auditing or building new components, always verify that icon-only buttons (`✕`, `&times;`, emojis) include explicit and descriptive `aria-label` attributes, in French, to meet accessibility standards and enhance the overall UX.

## 2025-05-18 - Missing ARIA Labels and Focus States on Search Clear Buttons
**Learning:** The 'clear search' icon-only buttons (like the one in SearchBar.jsx) lacked both `aria-label` attributes and proper keyboard focus states, making them inaccessible to screen readers and difficult to use via keyboard navigation.
**Action:** When creating or updating icon-only buttons, specifically clear buttons in search inputs, ensure they have explicit `aria-label` and `title` attributes (in French), and include `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-shd` to support keyboard accessibility.
