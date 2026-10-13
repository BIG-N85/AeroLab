# AeroLab Supabase setup

This project uses plain HTML, CSS, and JavaScript with the Supabase JavaScript v2 CDN. The site can be viewed while logged out. Personal records are loaded only after sign-in, and the database policies in schema.sql restrict each account to its own rows.

## 1. Create the database tables

In the Supabase Dashboard, open **SQL Editor**, create a query, paste the complete contents of schema.sql, and run it. The script creates the AeroLab tables, a profile row for new users, indexes, and row-level security (RLS) policies. The project does not run this SQL automatically.

## 2. Configure the browser client

Copy the project URL and the browser-safe anon/publishable key from the Supabase project API settings into js/config.js:

```js
window.AEROLAB_CONFIG = {
    url: "https://YOUR_PROJECT.supabase.co",
    anonKey: "YOUR_ANON_OR_PUBLISHABLE_KEY"
};
```

The anon/publishable key is meant for browser use with RLS enabled. Never put a secret key or service_role key in a page, JavaScript file, or repository. js/config.example.js shows the placeholder form.

## 3. Set up email confirmation

If email confirmation is enabled in Supabase Auth, sign-up displays a check-your-email message and users must confirm before password login. Add the local site URL and the deployed site URL to the Supabase Auth URL configuration. Redirects from sign-up return to the Login page.

## 4. Open the site

Serve the project folder through VS Code Live Server or another local static web server, then open /index.html. Do not open pages as file:// URLs: the browser module/session behavior and Supabase redirects require an HTTP origin.

## Supabase documentation

- [Install supabase-js](https://supabase.com/docs/reference/javascript/installing)
- [Initialize the client](https://supabase.com/docs/reference/javascript/initializing)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Managing user data](https://supabase.com/docs/guides/auth/managing-user-data)
