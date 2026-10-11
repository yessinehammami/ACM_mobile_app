# AMC / DM

AMC / DM is a cross-platform catalogue for searching and filtering DPM Tunisia's authorized medical-product data. The same Preact interface can run in a web browser, as an Android or iOS app through Capacitor, and as a Windows desktop app through Electron.

The app loads its catalogue from the published GitHub CSV when available and falls back to the CSV bundled with the app.

## Project Structure

```text
backend/
  requirements.txt       Python dependencies for the scraper
  scrape.py              Fetches product AMC rows from dpm.tn
frontend/
  public/ACM_data.csv    Bundled catalogue used as offline fallback
  src/                   Preact interface and data services
  android/               Capacitor Android project
  ios/                   Capacitor iOS project
  electron/              Electron desktop main process
  package.json           Frontend and platform scripts
.github/workflows/
  scrape.yml              Scheduled and manually triggered data update
```

## Prerequisites

- Node.js 22 LTS and npm for the web, mobile, and Windows desktop builds.
- Python 3.11 or newer for running the scraper locally.
- Android Studio and the Android SDK for Android builds.
- A Mac with Xcode for iOS builds. Native iOS builds cannot be produced on Windows.

Install frontend dependencies from the `frontend` directory:

```powershell
cd frontend
npm install
```

## Data and Scraping

The scraper reads the product list and posts each product code to DPM Tunisia's AMC pages. It writes the resulting rows to `frontend/public/ACM_data.csv`, replacing that file after a successful scrape. The frontend bundles this CSV during a build.

### Run the scraper locally

From the repository root, create and install a Python virtual environment:

```powershell
py -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements.txt
backend/.venv/Scripts/python backend/scrape.py
```

The scraper makes a request for each listed product, so a complete local run can take some time. It prints progress and writes the CSV when it finishes. If no data is returned, it exits without replacing the existing CSV.

The scraper currently disables TLS certificate verification for dpm.tn because its server certificate chain is incomplete. This is a workaround; certificate verification should be restored if the server chain or a trusted CA configuration is corrected.

### GitHub Actions schedule

The workflow is in `.github/workflows/scrape.yml`. It runs every Saturday at 00:00 Tunisia time (23:00 UTC on Friday) and can also be started manually from the repository's **Actions** tab. A successful run commits the updated CSV to `frontend/public/ACM_data.csv`. GitHub may start scheduled jobs several minutes later than their requested time.

The workflow needs repository write permission to commit the generated CSV. It runs on a GitHub-hosted Ubuntu runner and installs dependencies from `backend/requirements.txt`.

## Configure the CSV URL

Set `VITE_GITHUB_CSV_URL` in `frontend/.env` to the raw URL of the CSV committed by the workflow. For this repository:

```dotenv
VITE_GITHUB_CSV_URL=https://raw.githubusercontent.com/yessinehammami/ACM_mobile_app/main/frontend/public/ACM_data.csv
```

Vite embeds this setting at build time. The `.env` file is local and ignored by Git, so configure it on each development machine or in the relevant deployment environment before building.

At startup, the app tries the GitHub URL first and falls back to `/ACM_data.csv` bundled with the app. If it opens offline, it uses the bundled snapshot after the GitHub request times out; it does not automatically retry when connectivity returns during that session. Restart the app while online to load the latest published CSV.

## Web

Start the development server from `frontend`:

```powershell
cd frontend
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

Create and preview a production web build:

```powershell
npm run build
npm run preview
```

The production site is generated in `frontend/dist`. It can be hosted as a static site. Configure `VITE_GITHUB_CSV_URL` in the hosting provider's build environment if the site should fetch the newest CSV from GitHub; otherwise it uses the bundled CSV.

## Android

Build and run a debug installation on a connected Android device or emulator:

```powershell
cd frontend
npm run build
npx cap sync android
npx cap run android
```

Enable USB debugging and authorize the computer on a physical Android phone. Alternatively, open the native project in Android Studio:

```powershell
npx cap open android
```

### Create a signed Android APK

1. Build and sync the current frontend using the commands above.
2. In Android Studio, select **Build → Generate Signed Bundle / APK**.
3. Choose **APK**, select the `release` build variant, and create or select a keystore.
4. Keep the keystore (`.jks`) and its passwords securely backed up. Never commit or distribute them.

Android Studio displays the generated APK location after the build. It can be shared directly with Android users, who may need to allow installation from the app used to open the APK.

For future updates, keep the same application ID (`com.acmapp.dm`) and signing key, and increase `versionCode` in `frontend/android/app/build.gradle`. Update `versionName` for the human-readable release number. Users must install each new APK themselves unless the app is distributed through an update service or store. A release-signed APK cannot update a debug-signed installation; uninstall the debug build first (this removes its local data).

## iOS

The Capacitor iOS project is in `frontend/ios`. iOS builds require macOS and Xcode:

```sh
cd frontend
npm run build
npx cap sync ios
npx cap open ios
```

Use Xcode to select a simulator or connected device and configure signing. TestFlight and App Store distribution require Apple Developer Program enrollment and App Store Connect setup. An Android APK cannot be installed on an iPhone.

## Windows Desktop

The Electron wrapper is in `frontend/electron`. The frontend is served through a local app protocol so the packaged application can load both built assets and the bundled CSV.

Build and launch the desktop app locally:

```powershell
cd frontend
npm run desktop:dev
```

Build a Windows NSIS installer:

```powershell
npm run desktop:dist
```

The installer is generated in `frontend/dist-electron`, normally as `AMC DM Setup <version>.exe`. Send the installer to Windows users; they run it to install the app. Windows may show a security warning for installers that are not signed with a trusted code-signing certificate.

Desktop app updates are currently distributed manually: build a new installer and send it to users. There is no automatic desktop updater configured. Increase the `version` in `frontend/package.json` before building a new desktop release.

## App Behavior

- The layout switches between desktop and mobile views based on screen width.
- The catalogue filters by product, importer, supplier, provenance, lot number, manufacturing date, expiry date, and article code.
- Results are paginated in the interface.
- The Android, iOS, and desktop packages include the CSV available at build time as an offline fallback.
- When internet is available at startup, the app attempts to load the latest CSV from GitHub.

## License and Data Source

The catalogue is scraped from the public DPM Tunisia website. Respect the source website's terms and availability. No backend API server is required to run the frontend; the scraper is a separate data-update utility.
