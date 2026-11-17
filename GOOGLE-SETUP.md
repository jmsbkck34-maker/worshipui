# Setting up "Sign in with Google" (home sync)

With this set up, anyone can build a setlist at home and have it appear on the church computer. They choose **Connect → Sign in with Google** on both computers, using the same Google account. WorshipUI keeps setlists, the undated service and branding in a private WorshipUI area of that account's Google Drive. It cannot see or change any other Drive files.

You do the setup below **once** for your copy of WorshipUI. The people who use WorshipUI don't need to do it. It is free.

## 1. Create a Google Cloud project

1. Go to <https://console.cloud.google.com/> and sign in with the Google account that should own WorshipUI's setup (for example the church office account).
2. At the top, open the project list and choose **New project**. Name it `WorshipUI` and choose **Create**.

## 2. Turn on the Google Drive API

1. Open **APIs & Services → Library**.
2. Search for **Google Drive API**, open it and choose **Enable**.

## 3. Describe the app to Google (the sign-in screen)

1. Open **Google Auth Platform** (shown as **OAuth consent screen** in some menus) and choose **Get started**.
2. **App name:** `WorshipUI`. **User support email:** your email. Continue.
3. **Audience:** **External**. Continue, add your contact email, agree, and choose **Create**.
4. Open **Data access → Add or remove scopes** and add:
   - `.../auth/drive.appdata`, which lets WorshipUI see and manage its own app-data area only
   - `openid` and `.../auth/userinfo.email`

   Then **Update** and **Save**.
5. Open **Audience** and choose **Publish app**. While the app is in *Testing*, Google signs people out every 7 days and only listed test users can sign in.

When signing in, people may see **"Google hasn't verified this app"**. For your own church that is fine: choose **Advanced → Go to WorshipUI (unsafe)**. To remove the warning for everyone, submit the app for verification under **Verification Center** in the same place.

## 4. Create the sign-in credentials

1. Open **Clients → Create client**.
2. **Application type:** **Desktop app**. **Name:** `WorshipUI desktop`. Choose **Create**.
3. Choose **Download JSON** and keep the file safe.

## 5. Give the credentials to WorshipUI

The repository is public, so the credentials are never committed. Instead:

- **For the GitHub release builds (what you share):** on GitHub open the repository → **Settings → Secrets and variables → Actions → New repository secret**.
  - **Name:** `GOOGLE_CLIENT_JSON`
  - **Value:** paste just these two lines, using the values from the downloaded file (`installed.client_id` and `installed.client_secret`):

    ```json
    {"client_id":"1234567890-abc.apps.googleusercontent.com","client_secret":"GOCSPX-..."}
    ```

  The next release (for example `v0.3.5`) includes Google sign-in.
- **For a build on your own computer:** save the same JSON as `desktop/google-client.json`. Git ignores this file.

Google treats the client secret of a desktop app as not truly secret, because it ships inside the installed app. Keeping it out of the public repository still avoids casual reuse.

## Using it

On each computer: **Connect → Sign in with Google**. The browser opens; choose the church's Google account and allow access. Then return to WorshipUI. Setlists sync automatically, with the same review and conflict protection as before: nothing is overwritten silently, and Live mode holds incoming changes. **Sign out** on that computer stops syncing; its setlists stay on the computer.
