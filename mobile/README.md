# Dodana mobile app (Expo)

The Dodana app for Android and iPhone: phones only, English (default) and Arabic (right-to-left). It is a separate Expo project inside the website's repository, with its own dependencies. The website's install and build don't use anything in this folder.

The app talks only to the website's mobile API (`/api/mobile/v1`, documented in [`../docs/mobile/API.md`](../docs/mobile/API.md)). It never connects to the database or to Supabase, and it contains no server secrets.

## Status: Phase 2 (foundation)

| Area | State |
|---|---|
| Navigation | Five tabs (Home, Shop, Wishlist, Cart, Account), with temporary "Coming soon" content |
| Design system | Theme copied from the website's Tailwind colours; Fraunces, DM Sans and Cairo fonts; text, buttons, cards, price tag, loading, empty and error states, icons |
| Languages | English and Arabic using the website's own text files. Switching language restarts the app once to change the layout direction |
| API | Typed client for every v1 endpoint; TanStack Query caching |
| Sign-in token | Stored in the iPhone Keychain / Android Keystore (`expo-secure-store`). The session layer is ready; the sign-in screens come in Phase 5 |
| App icon and splash | **Temporary placeholders** (see below) |

Next phases: browsing (3), cart and wishlist (4), account (5), checkout with cash on delivery (6), quality (7) and store readiness (8).

## Running it locally

1. **Start the website on your computer with a local database**, never production. In the repository root:
   ```sh
   npm install
   npm run build && npm start   # serves http://localhost:3000
   ```
2. **Point the app at it.** In this folder:
   ```sh
   cp .env.example .env
   ```
   Then edit `EXPO_PUBLIC_API_URL` in `.env`:
   - iOS Simulator or web preview: `http://localhost:3000`
   - Android emulator: `http://10.0.2.2:3000`
   - A real phone on the same Wi-Fi: your computer's address, e.g. `http://192.168.1.20:3000`
3. **Install and start:**
   ```sh
   npm install
   npm start          # then press i (iOS), a (Android), or scan the QR code with Expo Go
   npm run web        # browser preview, for checking layouts only
   ```

`EXPO_PUBLIC_API_URL` is the **only** setting the app reads, and it is built into the app, so it must never contain a password, key or token.

The app enforces three rules on that address:
- There is no default address. If it isn't set, the app shows a configuration error.
- Development builds refuse the live store's address.
- Release builds require HTTPS.

The **Account** tab of a development build links to a design-system screen that also checks the API connection.

## Checks

```sh
npm run typecheck      # TypeScript (strict)
npm run lint           # ESLint (Expo rules)
npm test               # Jest unit tests, including the security checks below
npm run bundle:check   # builds the iOS and Android JavaScript bundles (no device needed)
```

The test suite also guards the project's rules:
- **Security:** fails if any server-only variable name, database URL or service key appears anywhere in the app, or if the app reads any variable other than `EXPO_PUBLIC_API_URL`.
- **Shared files:** fails if the app imports anything from the website except the English/Arabic text files and the API types file. The API types may only be imported with `import type`.
- **Brand colours:** fails if the app's palette drifts from the website's `tailwind.config.ts`.

Icons come from `src/components/icons.ts`, one module per icon. Importing from the `lucide-react-native` package root would bundle all ~1,900 icons, so lint blocks it.

## How the app shares code with the website

Metro can only bundle files inside this folder plus the folders listed in `metro.config.js`'s `watchFolders`, which contains exactly one website folder: `../src/messages`. Nothing else from the website can end up in the app, including its server code and its own `node_modules`. The API response types come from `../src/lib/mobile/types.ts` as type-only imports, which disappear at build time. The aliases are `@shared/messages/en.json`, `@shared/messages/ar.json` and `@shared/api-types`, defined in `tsconfig.json`.

## App identity

| | |
|---|---|
| Name | Dodana |
| iOS bundle ID / Android package | `com.dodana.app` (provisional, not registered anywhere yet) |
| Devices | Phones only, portrait |
| Theme | Light |

No Expo/EAS project, store account, push notifications, analytics or crash reporting is configured.

## Placeholder icon and splash screen

The images in `assets/images` are **temporary**. They are the website's favicon mark (`../public/favicon.svg`: a mocha square, an ivory "D" in Fraunces and a blush heart), rendered at 1024×1024. The source is `assets/brand/placeholder-mark.svg`. Replace these with the final Dodana logo before any store submission:

| File | Used for | Requirements |
|---|---|---|
| `icon.png` | iOS icon | 1024×1024, no transparency |
| `adaptive-icon.png` | Android adaptive icon foreground | 1024×1024, transparent; keep the mark inside the central ~66%. Background colour is set in `app.json` |
| `splash-icon.png` | Splash screen mark | Shown at 160 px wide on ivory |
| `favicon.png` | Web preview tab icon | |

## What can only be checked on a real device

This project is developed in an environment without iOS or Android simulators. Before release, check these on real phones:
- the right-to-left restart when switching language;
- Keychain/Keystore token storage;
- Arabic digits in prices;
- fonts, safe areas and the Android back button.
