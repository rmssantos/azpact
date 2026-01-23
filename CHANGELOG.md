# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Engine Improvements
- **Regex caching for performance**: Added `getCachedRegex()` function that caches compiled RegExp instances, improving performance when evaluating rules with regex patterns
- **Multiple blockers reporting**: Engine now collects and reports ALL matching blockers instead of just the first one, giving users a complete picture of issues
- **Combined reasons from matched rules**: Impact reasons now aggregate explanations from all matched rules instead of only showing the last matched rule's reason

#### Accessibility (WCAG Compliance)
- **Skip link**: Added "Skip to main content" link in Header for keyboard navigation
- **Form label associations**: Added proper `htmlFor` and `id` attributes to form elements in VMForm
- **ARIA labels**: Added `aria-label` attributes to interactive buttons and navigation elements
- **Role attributes**: Added `role="alert"`, `role="banner"`, `role="navigation"` where appropriate
- **Reduced motion support**: Added `prefers-reduced-motion` support using Framer Motion's `useReducedMotion` hook
- **Focus indicators**: Added visible focus rings (`focus:ring-2`) to interactive elements
- **Screen reader improvements**: Added `aria-hidden="true"` to decorative icons and `sr-only` text for external links

#### Performance Optimizations
- **SKU lookup optimization**: Changed `getSKU()` from O(n) linear search to O(1) Map lookup
- **Memoization**: Added `useMemo` for computed values in VMForm (currentSourceSku, currentTargetSku, topologies, pageTransition)
- **Article memoization**: Memoized `getArticlesForAction` and `getGeneralArticles` calls in ImpactReport

#### Testing
- **Comprehensive condition operator tests**: Added new test file `tests/condition-operators.test.ts` with 28 test cases covering:
  - All 11 condition operators (eq, ne, in, nin, exists, notExists, gt, gte, lt, lte, matches)
  - Dynamic field resolution (e.g., `targetSku.family`)
  - Blocker rules (generation, architecture)
  - Impact aggregation
  - All 15 action types
  - Multiple blockers handling

### Changed

#### Engine
- `evaluateCondition()` now uses cached RegExp instances via `getCachedRegex()`
- Blocker evaluation loop now collects all matching blockers before returning
- Impact aggregation now collects reasons from all matched rules into `infraReasons[]` and `guestReasons[]` arrays

#### Components
- VMForm now uses `useReducedMotion` hook for motion preferences
- VMForm now uses `useId` for generating unique form element IDs
- Header animation respects `prefers-reduced-motion`
- ImpactReport blocked state now has `role="alert"` and `aria-live="assertive"`

### Fixed

#### Critical Bug Fixes
- **RegExp error handling**: Fixed potential crash when rule conditions contain invalid regex patterns. Now catches errors and logs them instead of crashing the evaluation

#### Security
- External links now have proper `aria-label` indicating they open in new windows

### Removed

- **autoprefixer**: Removed from dependencies as it's redundant with Tailwind CSS v4 which handles vendor prefixing internally

### Dependencies

- Removed `autoprefixer` (^10.4.23) - redundant with Tailwind v4

---

## Test Results

After all changes:
- **44 tests passing** (up from 16)
- **4 test files**: engine.test.ts, type-guards.test.ts, sku-lookup.test.ts, condition-operators.test.ts
- **Build**: Successful (68 rules, 46 mitigations compiled)

---

## Files Modified

### Engine Layer
- `src/lib/engine.ts` - Regex caching, multiple blockers, reason aggregation
- `src/data/skus.ts` - Map-based O(1) SKU lookup

### UI Components
- `src/components/VMForm.tsx` - Accessibility, memoization, reduced motion
- `src/components/ImpactReport.tsx` - Accessibility, memoization, reduced motion
- `src/components/Header.tsx` - Skip link, accessibility, reduced motion

### Tests
- `tests/condition-operators.test.ts` - New comprehensive test file (28 tests)

### Configuration
- `package.json` - Removed autoprefixer dependency

### Documentation
- `docs/COMPREHENSIVE_REVIEW.md` - Full project review document
- `CHANGELOG.md` - This file
