This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Contact form storage (Supabase) — optional

The contact form works out of the box in **visual-only mode**: it shows an
`Inquiry #RW-XXXXX logged` reference but does not persist anything. To store
submissions for real:

1. Create a free Supabase project.
2. In the Supabase SQL editor, run [`supabase/schema.sql`](supabase/schema.sql)
   (creates `contact_inquiries` with row-level security on and an anon
   **insert-only** policy — the public key can add rows but never read them back).
3. Create `.env.local` (gitignored) with your project's values:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

4. Restart the dev server. Submissions now insert into `contact_inquiries` —
   **no code changes required**. The Supabase client is loaded on demand at
   submit time, so it stays out of the initial page bundle.

## Employee Access — setting the real secret names

`/login` accepts a **secret name** and, if recognized, signs the visitor in at a
tier (Recruit / Employee / High Command) and sends them to `/portal`. The
recognized names are never stored in plaintext — only their SHA-256 hashes live
in [`lib/auth/secretNames.ts`](lib/auth/secretNames.ts).

Placeholder codenames ship so the flow is testable:
`minnow` → Recruit, `tidewater` → Employee, `leviathan` → High Command.

To set your real names, compute the SHA-256 of each (lowercased, trimmed) and
replace the three hashes in `SECRET_HASHES`:

```bash
# prints the hash to paste as the key for the desired tier
node -e "console.log(require('crypto').createHash('sha256').update('YOUR-NAME'.toLowerCase().trim()).digest('hex'))"
```

You can add more than one name per tier (just add more `hash: 'tier'` entries).
No plaintext name is ever written into the site.

> Note: this is a shared-codename gate for the roleplay, not real authentication —
> the check runs client-side and the session lives in `localStorage`. It is not
> protecting anything sensitive.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
