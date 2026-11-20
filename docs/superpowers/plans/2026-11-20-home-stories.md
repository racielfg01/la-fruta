# Home Stories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home banner area with Facebook-like stories (portrait horizontal strip + fullscreen viewer with auto-advance and authenticated reactions) managed from Admin Configuración > Banners in a separate "Historias" subtab.

**Architecture:** Add a `stories` domain/public/admin layer mirroring banners (PocketBase collection + server actions + admin CRUD UI) and a `story_reactions` layer for per-user reactions via authenticated server actions. On the home page, fetch public stories and render a new `HomeStories` strip + fullscreen viewer in `StoreView`; when active stories exist they take precedence over banner/hero fallback as defined in the spec. Admin Banners tab becomes two subtabs: Banners and Historias.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind/shadcn UI, PocketBase (`getPB`, `getAdminPB`, `getTokenPB`, `getAllRecords`), existing auth/admin helpers (`requirePermission`, `decodePocketBaseToken`), Vitest + Testing Library patterns used in repo.

**Spec:** `docs/superpowers/specs/2026-11-20-home-stories-design.md`

## Global Constraints

- Follow existing project patterns (banners/offers/settings/actions/components) and Spanish UI copy consistent with admin/store.
- PocketBase collections/fields/rules for `stories` and `story_reactions` may not exist in all environments: public reads must degrade gracefully (return empty / no crash), admin/reaction mutations should surface clear errors.
- Reactions are private per user: only authenticated users can set/change their own reaction; never expose other users' reactions. Auth derived from token (`decodePocketBaseToken` + user record) as in existing auth flows.
- Story CTA destinations (per spec): `product` -> `/product/${productId}` (if id present), `offer` -> `/ofertas` (safe fallback for specific offer), `none` -> no CTA.
- Duration is per story in seconds, integer >= 1, default 5.
- Keep home `h1` accessibility behavior intact (visible hero when no stories and no banner fallback visible; `sr-only` h1 when visual hero replaced).
- Do not remove existing banners functionality; banners and stories coexist in admin (separate subtabs).

## Review Focus

- **Unauthenticated reaction attempt:** pressing a reaction without a valid session must not write anything and must show a clear sign-in-required message/toast; no crash.
- **Missing/empty `stories` or `story_reactions` collection:** home renders without stories (falls back per spec) and admin/actions fail with actionable errors instead of unhandled exceptions.
- **Invalid story media/duration/link:** admin cannot save a story with empty image/name, duration < 1/non-integer, or CTA type requiring missing destination; public rendering skips/handles broken records safely.
- **Reaction upsert/change:** same logged-in user changing reaction on same story updates their single reaction (no duplicates) and UI reflects new selection.
- **Viewer end/controls edge cases:** last story auto-advances to close (not out-of-bounds), close/next/prev work from first/last positions, and auto-advance respects pause/hold and configured per-story duration.

---

### Task 1: Story domain types and pure helpers

**Files:**
- Create: `lib/stories.ts`
- Test: `lib/stories.test.ts`

**Interfaces:**
- Produces: `StoryLinkType = 'none' | 'product' | 'offer'`, `StoryReaction = 'like' | 'love' | 'whatever' | 'dislike'`, `AdminStory`, `PublicStory`, `StoryInput`, `toAdminStory(rec)`, `toPublicStory(s)`, `normalizeStoryDuration(v)`, `storyCtaHref(story)`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from "vitest";
import { normalizeStoryDuration, storyCtaHref, toAdminStory, toPublicStory } from "./stories";

describe("stories domain", () => {
  test("normalizes duration to integer seconds >= 1 with default 5", () => {
    expect(normalizeStoryDuration(undefined)).toBe(5);
    expect(normalizeStoryDuration(0)).toBe(5);
    expect(normalizeStoryDuration(2.6)).toBe(2);
    expect(normalizeStoryDuration("7")).toBe(7);
  });

  test("maps admin record and resolves CTA href by link type", () => {
    const admin = toAdminStory({ id: "s1", name: "N", image: "/i.png", duration: 8, link_type: "product", product_id: "p1", offer_id: "", active: true, sort: 2 });
    expect(admin).toMatchObject({ id: "s1", duration: 8, linkType: "product", productId: "p1", offerId: "" });
    expect(storyCtaHref(admin)).toBe("/product/p1");
    expect(storyCtaHref({ ...admin, linkType: "offer", offerId: "o1" })).toBe("/ofertas");
    expect(storyCtaHref({ ...admin, linkType: "none" })).toBeNull();
  });

  test("toPublicStory exposes safe public fields", () => {
    const pub = toPublicStory({ id: "s1", name: "N", image: "/i.png", duration: 5, linkType: "none", productId: "", offerId: "", active: true, sort: 0 });
    expect(pub).toEqual({ id: "s1", name: "N", image: "/i.png", duration: 5, linkType: "none", productId: "", offerId: "", active: true, sort: 0 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/stories.test.ts`
Expected: FAIL (module `./stories` missing).

- [ ] **Step 3: Implement domain in `lib/stories.ts`**

Export the interfaces/types and helpers used by tests and later tasks: `StoryLinkType`, `StoryReaction`, `AdminStory { id,name,image,duration,linkType,productId,offerId,active,sort }`, `PublicStory` (same shape), `StoryInput` (writable fields), `toAdminStory(rec: Record<string, any>)` (maps PB snake_case, defaults: duration 5 normalized, active !== false, sort number||0), `toPublicStory`, `normalizeStoryDuration`, `storyCtaHref` returning `/product/${productId}` for product with id, `/ofertas` for offer with id, else `null`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/stories.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/stories.ts lib/stories.test.ts
git commit -m "feat(stories): add story domain types and helpers"
```

### Task 2: Public stories fetch and home data flow

**Files:**
- Create: `app/actions/public-stories.ts`
- Modify: `app/page.tsx`
- Modify: `components/home-experience.tsx`
- Modify: `components/store-view.tsx` (props/state for initial stories; rendering comes in Task 4)

**Interfaces:**
- Produces: `getPublicStories(): Promise<PublicStory[]>` (active stories sorted by `sort,created`, tolerant of missing collection -> `[]`).
- Consumes: `getPB`, `getAllRecords` from `@/lib/pocketbase`; `toAdminStory`, `toPublicStory` from `@/lib/stories`.

- [ ] **Step 1: Write the failing test**

Create `app/actions/public-stories.test.ts` mocking `@/lib/pocketbase` similar to `app/actions/public-offers.test.ts`:

```ts
import { describe, expect, test, vi, beforeEach } from "vitest";
vi.mock("@/lib/pocketbase", () => ({ getPB: vi.fn(() => ({})), getAllRecords: vi.fn() }));
import { getAllRecords } from "@/lib/pocketbase";
import { getPublicStories } from "./public-stories";

const mockGetAll = getAllRecords as unknown as ReturnType<typeof vi.fn>;

describe("getPublicStories", () => {
  beforeEach(() => mockGetAll.mockReset());
  test("returns mapped active public stories in order", async () => {
    mockGetAll.mockResolvedValue([{ id: "1", name: "A", image: "x", duration: 6, link_type: "none", active: true, sort: 1 }]);
    await expect(getPublicStories()).resolves.toEqual([{ id: "1", name: "A", image: "x", duration: 6, linkType: "none", productId: "", offerId: "", active: true, sort: 1 }]);
  });
  test("returns [] on error/missing collection", async () => {
    mockGetAll.mockRejectedValue(new Error("missing"));
    await expect(getPublicStories()).resolves.toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run app/actions/public-stories.test.ts`
Expected: FAIL (module/action missing).

- [ ] **Step 3: Implement `getPublicStories` and wire data**

In `app/actions/public-stories.ts`: `"use server"`, fetch `stories` with filter `active = true`, sort `sort,created`, map via `toAdminStory`/`toPublicStory`, catch -> `[]`.

In `app/page.tsx`: import/get `getPublicStories`, add to `Promise.all`, pass `stories` (and keep existing banner/settings logic) into `<HomeExperience stories={stories} ... />`.

In `components/home-experience.tsx`: extend props with `stories: PublicStory[]`, pass `initialStories={stories}` to `StoreView`.

In `components/store-view.tsx`: extend props with `initialStories?: PublicStory[]`, add state `const [stories, setStories] = useState(initialStories ?? [])`, in client fallback load also fetch stories (import `getPublicStories`) and `setStories`; keep behavior unchanged for now (no new rendering yet) to avoid breaking build mid-plan.

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm exec vitest run app/actions/public-stories.test.ts lib/stories.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/actions/public-stories.ts app/actions/public-stories.test.ts app/page.tsx components/home-experience.tsx components/store-view.tsx
git commit -m "feat(stories): add public stories fetch and home data plumbing"
```

### Task 3: Admin stories server actions

**Files:**
- Modify: `app/actions/admin-extras.ts`

**Interfaces:**
- Produces: `StoryRow` (admin shape), `getStoriesAction(token)`, `createStoryAction(data, token)`, `updateStoryAction(id, data, token)`, `deleteStoryAction(id, token)`; all require `settings` permission and operate on PB `stories`.
- Consumes: `requirePermission`, `getDataPB`, `getAllRecords`, `sanitize`; validation rules (name/image required trimmed, duration normalized >=1, link type and destination required when applicable).

- [ ] **Step 1: Write the failing test**

Create `app/actions/admin-stories-actions.test.ts` with the repo's server-action test style (mock `@/lib/admin-auth`, `@/lib/pocketbase`). Test at least:
- `createStoryAction` rejects empty name/image and duration < 1.
- `createStoryAction` rejects `linkType: 'product'` without `productId` and `linkType: 'offer'` without `offerId`.
- `getStoriesAction` maps rows (mock getAllRecords). If mocking the exact PB client shape is cumbersome, extract/validate via a small pure validator helper in `lib/stories.ts` (e.g. `validateStoryInput`) and test that helper plus a light action smoke test; prefer direct action tests consistent with existing patterns.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run app/actions/admin-stories-actions.test.ts` (or the chosen test file)
Expected: FAIL.

- [ ] **Step 3: Implement admin actions in `app/actions/admin-extras.ts`**

Add near banners section:
- types `StoryLinkType`, `StoryRow`, `StoryInput`.
- `mapStory`, `storyLinkFields` (validate destination; for product require productId, for offer require offerId, for none clear ids).
- `getStoriesAction(token)` -> list sorted `sort,created`.
- `createStoryAction(data, token)` -> create with normalized/validated fields.
- `updateStoryAction(id, data, token)` -> partial update with validation.
- `deleteStoryAction(id, token)` -> delete.

Ensure duration uses `Math.max(1, Math.trunc(Number(...)) || 5)` and image/name trimmed non-empty.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run app/actions/admin-stories-actions.test.ts lib/stories.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/actions/admin-extras.ts app/actions/admin-stories-actions.test.ts lib/stories.ts lib/stories.test.ts
git commit -m "feat(stories): add admin stories CRUD actions"
```

### Task 4: Home stories strip and fullscreen viewer UI

**Files:**
- Create: `components/home-stories.tsx` (strip + viewer, client component)
- Modify: `components/store-view.tsx` (render stories; adjust hero/sr-only logic)
- (Optional) Create: `lib/story-viewer.ts` for pure helpers (progress/sequence) if it simplifies testing

**Interfaces:**
- Consumes: `PublicStory[]`, product/offer context not required except CTA href; auth state from `useAuthStore` (token/user presence) for reaction UI gating in Task 5.
- Produces: `HomeStories` UI: horizontal scroll portrait cards (image + bottom-left name overlay). On click opens fullscreen viewer: image, name bottom-left, CTA bottom (link when `storyCtaHref`), progress segments, auto-advance by `story.duration` seconds, next/prev, close, pause-on-hold, close on last story end.

- [ ] **Step 1: Write the failing test(s)**

Add `lib/story-viewer.test.ts` (if extracting helpers) for pure logic, e.g. sequence index wrap/advance and duration clamping for viewer timing, and/or `components/home-stories.test.tsx` with minimal render tests following repo style (e.g. render strip with stories, click opens viewer dialog/fullscreen container). Keep UI tests resilient (query by role/label/text).

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/story-viewer.test.ts` and/or `components/home-stories.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement strip and viewer**

In `components/home-stories.tsx`:
- Export component `HomeStories({ stories }: { stories: PublicStory[] })`.
- Strip: section/container with horizontal scroll (`flex gap-*, overflow-x-auto, snap-x`), cards with portrait aspect (e.g. `aspect-[9/16]` fixed height classes), `next/image` or `<img>` consistent with project, name overlay `absolute bottom-left`.
- Viewer state: `open`, `index`, `paused`, progress timer (`requestAnimationFrame`/interval) advancing after `duration*1000`; segment bars at top; tap zones/buttons for prev/next; close button; pause on pointer down/hold; on story/index change reset timer.
- CTA: render bottom button/link when href exists (`Link` for internal routes).

In `components/store-view.tsx`:
- Import and render `<HomeStories stories={stories} />` (stories state) in the banner/hero region.
- Update hero/sr-only conditions per spec: if `stories.length > 0` show stories strip (and sr-only h1, no hero, no banner carousel); else keep current logic (`displayBanners.length > 0` => carousel+sr-only, else hero). Ensure `displayBanners` carousel not shown when stories take precedence.

- [ ] **Step 4: Run tests and lint/typecheck targeted files**

Run: `pnpm exec vitest run lib/story-viewer.test.ts lib/stories.test.ts` (and any new component tests) and `pnpm exec tsc --noEmit`
Expected: PASS / exit 0.

- [ ] **Step 5: Commit**

```bash
git add components/home-stories.tsx components/store-view.tsx lib/story-viewer.ts lib/story-viewer.test.ts components/home-stories.test.tsx
git commit -m "feat(stories): add home stories strip and fullscreen viewer"
```

### Task 5: Story reactions (authenticated, per-user)

**Files:**
- Modify: `lib/stories.ts` (export reaction constants/types if not already)
- Create: `app/actions/story-reactions.ts`
- Modify: `components/home-stories.tsx` (reaction UI wired to actions)

**Interfaces:**
- Produces: `getMyStoryReactionsAction(token, storyIds: string[]): Promise<Record<string, StoryReaction | null>>` and `setStoryReactionAction(token, storyId: string, reaction: StoryReaction): Promise<{ storyId: string; reaction: StoryReaction }>` (or equivalent). Both require valid authenticated user token.
- Consumes: `getTokenPB`/`getAdminPB` as appropriate, `decodePocketBaseToken` (or token PB authStore model) to identify user id; PB `story_reactions` collection.

- [ ] **Step 1: Write the failing test**

Create `app/actions/story-reactions.test.ts` mocking pocketbase/auth helpers: unauthenticated/invalid token rejected, valid token upserts reaction for resolved user+story and returns selection. Follow existing action test patterns.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run app/actions/story-reactions.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement reaction actions**

In `app/actions/story-reactions.ts` (`"use server"`): resolve user id from token (consistent with repo: `decodePocketBaseToken` and/or `getTokenPB(token).authStore.model?.id` after ensuring auth). 
- `getMyStoryReactionsAction`: if no valid user/token return empty map; query `story_reactions` filtered by user and story ids (build safe OR filter via `sanitize`/`buildOrFilter` patterns) and map story->reaction; tolerate missing collection with empty map/error handling as appropriate.
- `setStoryReactionAction`: require authenticated user; validate reaction in allowed set and storyId present; find existing record for (user,story) and update or create; return current reaction. Use admin/data PB strategy consistent with other actions (try admin PB, fallback token PB if needed) but ensure writes comply with auth/ownership.

- [ ] **Step 4: Wire reactions into viewer and verify**

In `components/home-stories.tsx`: load current user's reactions for displayed stories when viewer opens (if token exists), render 4 reaction buttons (👍 Me gusta, ❤️ Me encanta, 😐 Da igual, 👎 No me gusta) in fullscreen; on click, if no session show toast/info "Inicia sesión para reaccionar"; if session call `setStoryReactionAction` with optimistic UI update and rollback on error. Do not show others' data.

Run: `pnpm exec vitest run app/actions/story-reactions.test.ts app/actions/public-stories.test.ts lib/stories.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/actions/story-reactions.ts app/actions/story-reactions.test.ts lib/stories.ts components/home-stories.tsx
git commit -m "feat(stories): add per-user story reactions"
```

### Task 6: Admin UI for stories (subtab + CRUD)

**Files:**
- Modify: `app/admin/configuracion/tabs/banners-tab.tsx` (or split into `banners-tab.tsx` + `stories-subtab.tsx` / `banners-subtab.tsx` for clarity)

**Interfaces:**
- Consumes: admin story actions from `app/actions/admin-extras.ts`, `getPublicProducts`/offers loading for CTA selectors, `useAuthStore` token, existing upload/components patterns.
- Produces: within config Banners area, nested Tabs: "Banners" (existing behavior + home-banners toggle kept in Banners context) and "Historias" (list + create/edit/delete/toggle active/sort, form with image, name, duration, link type none/product/offer, product selector, offer selector).

- [ ] **Step 1: Write the failing test (lightweight)**

Add/adjust a small UI or logic test if practical (e.g. pure helper for story form validation) to pin admin input rules; otherwise rely on action/domain tests and include manual verification steps below. Prefer adding `lib/stories.test.ts` cases for `validateStoryInput` if introduced.

- [ ] **Step 2: Run targeted tests to confirm baseline**

Run: `pnpm exec vitest run lib/stories.test.ts app/actions/admin-stories-actions.test.ts`
Expected: PASS (baseline before UI refactor).

- [ ] **Step 3: Implement admin subtabs and stories CRUD UI**

Refactor Banners tab to render nested tabs:
- **Banners:** existing banners table/dialog and the "Mostrar banners en la portada" visibility card/switch.
- **Historias:** new subtab component/section that loads `getStoriesAction`, lists stories (miniatura, nombre, duración, CTA destino, orden, activo) with edit/delete/toggle; dialog form fields image, name, duration (number, min 1, default 5), active, sort, linkType select (none/product/offer), product select when product, offer select when offer. Load products and offers options (offers via admin/public action as available). Save via create/update actions with toasts and validation feedback.

Keep UX/copy in Spanish consistent with existing admin.

- [ ] **Step 4: Verify admin build/lint/types**

Run: `pnpm exec eslint app/admin/configuracion/tabs/banners-tab.tsx app/actions/admin-extras.ts components/home-stories.tsx components/store-view.tsx app/page.tsx components/home-experience.tsx` and `pnpm exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add app/admin/configuracion/tabs/banners-tab.tsx app/actions/admin-extras.ts
git commit -m "feat(stories): add admin stories management subtab"
```

### Task 7: Final integration, verification, and documentation note

**Files:**
- Modify (if needed): `02-DOCS/wiki/index.md` or relevant wiki/FTD entry (only if project convention requires; keep minimal)
- Create/Modify: `02-DOCS/wiki/ftd/historias-portada.md` (recommended) documenting PB schema requirements and behavior

**Interfaces:**
- Produces: verified integrated feature; note that PB collections `stories` and `story_reactions` must exist with expected fields/rules.

- [ ] **Step 1: Run focused automated verification**

Run: `pnpm exec vitest run lib/stories.test.ts lib/story-viewer.test.ts app/actions/public-stories.test.ts app/actions/admin-stories-actions.test.ts app/actions/story-reactions.test.ts`
Expected: PASS.

- [ ] **Step 2: Run lint and typecheck**

Run: `pnpm exec eslint` on all modified/created source files and `pnpm exec tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Manual smoke checklist (record results in commit/notes)**

- With `stories` collection absent/empty: home loads normally (no crash), fallback behavior intact.
- Admin > Configuración > Banners shows Banners/Historias subtabs; can create/edit/toggle/delete a story (when PB ready).
- Home shows portrait horizontal story strip when active stories exist; tap opens fullscreen, auto-advances by duration, CTA works, close/next/prev behave.
- Logged-in user can react and change reaction (persisted); logged-out user is prompted and no write occurs.

- [ ] **Step 4: Add minimal FTD/wiki note**

Create `02-DOCS/wiki/ftd/historias-portada.md` (and link from index if appropriate) stating intent, admin location, collections/fields/rules needed (`stories`, `story_reactions`), and graceful-degradation behavior.

- [ ] **Step 5: Commit**

```bash
git add 02-DOCS/wiki/ftd/historias-portada.md 02-DOCS/wiki/index.md docs/superpowers/plans/2026-11-20-home-stories.md
git commit -m "docs(stories): add portada stories FTD and plan references"
```
