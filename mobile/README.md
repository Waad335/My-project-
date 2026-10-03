# Dodana mobile app (Expo)

The Dodana app for Android and iPhone: phones only, English (default) and Arabic (right-to-left). It is a separate Expo project inside the website's repository, with its own dependencies. The website's install and build don't use anything in this folder.

The app talks only to the website's mobile API (`/api/mobile/v1`, documented in [`../docs/mobile/API.md`](../docs/mobile/API.md)). It never connects to the database or to Supabase, and it contains no server secrets.

## Status: Phase 5 (sign-in and account)

| Area | State |
|---|---|
| Home | Store announcement, hero with the boutique photos, Shop by Category, departments, Featured, New Arrivals (with category tabs), Best Sellers. While the catalogue is empty it shows the website's "coming soon" block instead of empty rows |
| Shop | Search with suggestions while typing, category chips, sort and price filters, a two-column grid that loads 20 products at a time |
| Category | Description, subcategory chips, the same grid and filters (newest first, as on the website) |
| Product | Swipeable photos with a full-screen viewer (pinch or double-tap to zoom), price and stock for the chosen colour or size, delivery, returns and payment notes, description, details, ingredients, reviews and related pieces |
| Cart | Add to Cart on the product screen (quantity, chosen colour or size, stock limits). The Cart tab lists each piece with its photo, size/colour, price, quantity and remove, then the subtotal. Checkout arrives in Phase 6 |
| Wishlist | A heart on every product card and on the product screen. The Wishlist tab shows the saved pieces, which open their product or can be removed |
| Cart and wishlist storage | Kept on the phone for everyone, like the website keeps them in the browser. For a signed-in customer they are also saved to the account through `/me/cart` and `/me/wishlist` (`src/shopping/account-sync.ts`, ported from the website). See [Cart and wishlist when signing in and out](#cart-and-wishlist-when-signing-in-and-out) |
| Account | Signed out: Sign In and Create Account. Signed in: the customer's name and email, and Sign out. Also the language switch. Orders, profile editing, password change and account deletion aren't in the app yet |
| Sign in, Create account | The website's fields, rules and error messages (`src/auth/validation.ts` mirrors `../src/lib/validation.ts`), checked on the phone first and then by the server. Errors appear under the field they belong to; wrong password, too many attempts, email already used and no connection each have their own message. A show/hide control on passwords. Arabic digits in the phone number are accepted |
| Forgot password | Sends the website's reset email (`POST /auth/forgot-password`); the link opens the website's reset page |
| Design system | Theme copied from the website's Tailwind colours; Fraunces, DM Sans and Cairo fonts; text, buttons, chips, fields, bottom sheet, cards, price tag, loading, empty and error states, icons |
| Languages | English and Arabic using the website's own text files. Switching language restarts the app once to change the layout direction |
| API | Typed client for every v1 endpoint; TanStack Query caching |
| Sign-in token | Stored only in the iPhone Keychain / Android Keystore (`expo-secure-store`, this device only), never in the app's other storage, never logged. The web preview keeps it in memory only |
| Staying signed in | The customer stays signed in after closing the app until the token expires. The app checks the token when it starts and each time it comes back to the foreground; an expired or rejected token signs the customer out with "Your session has ended. Please sign in again." Offline, the customer stays signed in and the account is confirmed once the connection is back |
| App icon and splash | **Temporary placeholders** (see below) |

The browsing rules (badges, sale percentage, stock messages, colour/size choices, the details table) are ported from the website's components in `src/catalog/product-logic.ts`, and tests compare them with the website's source.

Next phases: checkout with cash on delivery (6), quality (7) and store readiness (8).

### Cart and wishlist when signing in and out

Nothing a customer adds is lost:
- **First sign-in on this phone:** the phone's cart and wishlist are merged with the ones saved in the account, using the website's rule (saved lines are kept, a piece in both keeps the larger quantity within its stock, phone-only pieces are added), and the result is saved to the account.
- **While signed in:** changes are saved to the account 0.8 s after the last one, like the website. If a save fails (offline), the phone remembers it, and the next sync merges again instead of letting the account's older copy replace the phone's.
- **The account's copy is never overwritten before it has been loaded.** If it can't be loaded, the phone's items stay as they are and nothing is saved.
- **Sign out:** pending changes are saved first. Only if the account confirms them is the phone cleared, as on the website. Otherwise the items stay on the phone, the Account tab says so, and they're merged at the next sign-in.
- **Session expired:** the items stay on the phone and are merged at the next sign-in.

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
- **API contract:** fails if the app calls any endpoint (path and HTTP method) that doesn't exist under `../src/app/api/mobile/v1`, if the cart and wishlist code uses anything but the saved cart and wishlist endpoints, or if the sign-in screens use anything but sign-in, register, forgot password and `/me`.
- **Sign-in token:** fails if anything other than `src/auth/token-storage.ts` touches the secure store or the token's key, if that file uses any other storage, if anything other than the API client sets the `Authorization` header, or if the app logs to the console (other than one development-only translation warning).
- **Website parity:** fails if the sort options, low-stock threshold, sale-badge maths, cart quantity limits, the cart merge rule, the save delay or the sign-in and registration rules (name, email, Egyptian phone and password lengths and patterns) differ from the website's code, or if an error message the app can show is missing in English or Arabic.

Photos use `expo-image` (cached on the device). The full-screen photo viewer uses `react-native-gesture-handler` and `react-native-reanimated`, so zooming runs on the UI thread; they add roughly 2 MB to the JavaScript bundle.

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
- Keychain/Keystore token storage: still signed in after force-closing the app and after restarting the phone. The token is stored with "this device only" access, so it isn't copied to another phone through a backup. iOS can keep Keychain items after an app is deleted, so a reinstalled app may still be signed in until the token expires; Android removes them with the app;
- Arabic digits in prices;
- fonts, safe areas and the Android back button;
- swiping the product photos and the full-screen viewer (pinch, double-tap, swipe) in both languages;
- the filter sheet's price fields with the keyboard open, especially on Android;
- the cart and wishlist being kept after closing and reopening the app, and the counts on the tab icons;
- signing in, creating an account and signing out against a local copy of the website; the forgot-password email and its link;
- password autofill and the keyboard on the sign-in and registration forms in both languages, including the Android back button with the keyboard open;
- a session expiring (tokens last 30 days): move the phone's clock past the expiry, or temporarily lower `CUSTOMER_SESSION_MAX_AGE_SECONDS` in `../src/lib/customer-token.ts` on a local copy of the website (never committed), then reopen the app or bring it back to the foreground;
- saving the cart and wishlist to an account, merging them on another device and on the website, and signing out while offline.
