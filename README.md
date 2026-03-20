# @pt/rental-shared

Shared **rental transaction state machine**, canonical enums, and pure helpers for **pt-admin**, **pt-marketplace**, and **pt-vendor**.

## Local development

`file:../rental-shared` in each app’s `package.json` works when all folders live as **siblings** on disk.

```bash
cd rental-shared && pnpm install && pnpm build
cd ../pt-admin && pnpm install
```

## Deploy from a public Git repo (recommended for Render)

There is **no separate download script**: `pnpm` / `npm` **is** the step that fetches the package.

1. Push this package to its **own** GitHub repo and **tag** releases (e.g. `v1.0.0`).
2. In each app, depend on:

```json
"@pt/rental-shared": "git+https://github.com/YOUR_ORG/pt-rental-shared.git#v1.0.0"
```

3. On `install`, the package manager clones that tag and runs **`prepare`** → `npm run build` → `dist/` is created.

**Full step-by-step:** [docs/GIT_PUBLISH.md](./docs/GIT_PUBLISH.md)

**Do not** rely on `file:../rental-shared` on Render (only one repo is cloned per service).

### Alternatives

- **npm / GitHub Packages:** `"@pt/rental-shared": "^1.0.0"` with registry auth.
- **Vendor inside each app repo:** `"file:./vendor/rental-shared"` — copy or submodule; sync when shared code changes.

## Contents

- `rental-transaction.machine` — states, `allowed_actions`, transitions
- `checkout-metadata` — Stripe Checkout `quote_request_id` / fee parsing
- `booking-preconditions` — shared guards for booking-from-payment

Enums in `canonical-enums.ts` must stay aligned with Prisma in each app.

## Release checklist

1. Change shared code → bump **semver** in `rental-shared/package.json`.
2. Tag git (`v1.x.y`) if using Option A.
3. Publish or push tag, then update **all three** apps to the new version / tag.
4. Run `pnpm prisma:prepare` and `tsc` in each app before deploy.
