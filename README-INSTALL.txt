GANESH'S HABITFLOW — PWA PACKAGE

PACKAGE CONTENTS
- index.html: your existing application
- manifest.webmanifest: install name, icon and display settings
- sw.js: service worker for app-shell/offline caching
- icons/: app icons

IMPORTANT
A PWA must be served over HTTPS (or localhost for testing). Opening index.html directly from Downloads using file:// will not enable service-worker installation.

FREE HOSTING WITH GITHUB PAGES
1. Create/sign in to https://github.com/
2. Create a new public repository, e.g. ganesh-habitflow.
3. Upload index.html, manifest.webmanifest, sw.js and the icons folder. Keep the folder structure.
4. Open repository Settings -> Pages.
5. Under Build and deployment, choose Deploy from a branch.
6. Select branch main and folder /(root), then Save.
7. Wait for GitHub Pages to publish. Open the HTTPS URL shown in Pages settings.

ANDROID
1. Open the published HTTPS URL in Chrome.
2. Tap the three-dot menu.
3. Choose Install app (or Add to Home screen).
4. Confirm.

IPHONE
1. Open the published HTTPS URL in Safari.
2. Tap Share.
3. Choose Add to Home Screen.
4. Tap Add.

DATA
The app continues using LocalStorage. Data stays in the same browser/profile on each device and does not automatically sync between phone and computer. Use the app's JSON backup feature regularly.

OFFLINE
Open the app once while online so the service worker can cache the app shell. Third-party CDN libraries may only work offline if they were successfully cached during that first visit.
