# UniCamp side navigation update

## What changed
- The bottom tab bar is hidden for admin, staff, and student areas.
- The existing hamburger button in the page header now opens a left-side drawer.
- Drawer links are different for each role and navigate to the existing screens.
- The drawer includes the signed-in user's profile summary and Log out action.
- Existing screen layouts and the student/staff/admin UI styling are preserved.

## Run
```bash
npm install
npx expo start --clear
```

If you are testing with a native Android development build, use `npx expo run:android` after installing dependencies.
