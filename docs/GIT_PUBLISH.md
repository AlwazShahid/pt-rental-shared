# Publish `@pt/rental-shared` from a public Git repo

Use this when **pt-admin**, **pt-marketplace**, and **pt-vendor** deploy separately (e.g. Render) and each repo only clones **one** repo. A **Git URL dependency** is a simple way to share the package without a private npm registry.

## 1. Create the Git repository

1. On GitHub (or GitLab / etc.), create a **new public** repository, e.g. [`AlwazShahid/pt-rental-shared`](https://github.com/AlwazShahid/pt-rental-shared).
2. Copy the contents of your local `rental-shared` folder into that repo (not the parent `pt-core` folder—only the package root: `package.json`, `src/`, `tsconfig.json`, `README.md`, etc.).
3. Commit and push:

```bash
cd rental-shared
git init
git add .
git commit -m "Initial @pt/rental-shared"
git branch -M main
git remote add origin https://github.com/YOUR_ORG/pt-rental-shared.git
git push -u origin main
```

4. **Do not commit `node_modules/` or `dist/`** if you use `.gitignore` for them. The `prepare` script in `package.json` runs `npm run build` after install so `dist/` is generated on the machine that runs `pnpm install` / `npm install`.

## 2. Tag a release (recommended)

Consumers should pin a **tag** so deploys are reproducible.

```bash
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

Bump `version` in `package.json` when you change the API or behavior, then tag again (`v1.0.1`, etc.).

## 3. Point each app at the Git repo

In **each** of `pt-admin`, `pt-marketplace`, and `pt-vendor`, set the dependency in `package.json`:

```json
"dependencies": {
  "@pt/rental-shared": "git+https://github.com/AlwazShahid/pt-rental-shared.git#main"
}
```

Pin a **tag** (e.g. `#v1.0.0`) instead of `#main` when you want reproducible deploys.

**SSH** (if the build server uses deploy keys):

```json
"@pt/rental-shared": "git+ssh://git@github.com:AlwazShahid/pt-rental-shared.git#main"
```

### pnpm

```bash
pnpm add @pt/rental-shared@git+https://github.com/AlwazShahid/pt-rental-shared.git#main
```

Or edit `package.json` manually, then:

```bash
pnpm install
```

### npm

```bash
npm install git+https://github.com/AlwazShahid/pt-rental-shared.git#main --save
```

## 4. What happens on install (Render / CI)

1. `pnpm` / `npm` clones the repo at the tag.
2. Installs dependencies for `@pt/rental-shared` (includes `tsup` / `typescript` needed to build).
3. Runs the **`prepare`** script → `npm run build` → produces `dist/`.
4. Your app imports `@pt/rental-shared` from `node_modules` like any other package.

No separate “download script” is required—**the package manager is the download step**.

## 5. Keep the three apps in sync

When you change shared logic:

1. **Merge** to `pt-rental-shared` `main` and **tag** a new version (e.g. `v1.0.1`).
2. Update **all three** apps to the new tag:

```json
"@pt/rental-shared": "git+https://github.com/YOUR_ORG/pt-rental-shared.git#v1.0.1"
```

3. Commit lockfiles (`pnpm-lock.yaml` / `package-lock.json`) and redeploy.

Optional: add a one-line note in each app’s `README` under “Dependencies” linking to the repo and current tag.

## 6. Local dev vs production

| Situation | Dependency |
|-----------|------------|
| Local monorepo (siblings on disk) | `"file:../rental-shared"` — fast iteration |
| Production / Render | `git+https://...#v1.x.x` — works with one repo clone |

You can keep `file:` locally and use a **Git URL** only on deploy branches, or standardize on Git URL everywhere once the public repo exists.

## 7. Troubleshooting

| Problem | What to check |
|--------|--------------------|
| `prepare` fails (no `dist`) | Node 20+; network allows `npm` to fetch `tsup`; check build logs on Render. |
| Wrong version | Lockfile pins the git commit; bump tag and commit updated lockfile. |
| Private repo later | Same `git+` URL; add SSH key or [GitHub token](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-with-a-personal-access-token) for HTTPS. |
