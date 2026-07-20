// Dynamic config layered over app.json. Expo evaluates this file last, so
// everything static lives in app.json and only account-specific values are
// injected here.
//
// The Apple Team ID is deliberately not checked in: it ties this repo to a
// developer account and is only needed for native builds and signing. Set
// APPLE_TEAM_ID in a local .env (see .env.example) before `npm run ios` or an
// EAS build. Expo CLI loads .env into process.env before evaluating this file.
module.exports = ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    ...(process.env.APPLE_TEAM_ID
      ? { appleTeamId: process.env.APPLE_TEAM_ID }
      : {}),
  },
});
