# Aiso watermark cleaner

A free, transparent web tool that removes invisible Unicode carriers and normalizes unusual spacing in text the user owns or is authorized to process.

Live tool: [aiso-watermark-cleaner.vercel.app](https://aiso-watermark-cleaner.vercel.app)

## What it does

- Removes zero-width marks, bidirectional controls, tag characters, variation selectors, and other Unicode format characters.
- Normalizes exotic spacing characters to standard spaces.
- Optionally normalizes common Cyrillic and full-width Latin lookalikes and applies Unicode NFKC.
- Reports exact removal and replacement counts.
- Stores the submitted text, clean copy, source category, counts, consent, and timestamps for 30 days in MongoDB.
- Returns a deletion token so the user can remove the record sooner.

It does not certify removal of statistical or secret-key watermarks. It does not process file metadata, images, audio, or video.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `MONGODB_URI`.
3. Run `npm run dev`.

The database name defaults to `aiso_watermark_cleaner` and can be changed with `MONGODB_DB`.

## Checks

```sh
npm test
npm run build
```

## Deploy

Deploy the repository to Vercel and configure `MONGODB_URI`, `MONGODB_DB`, and `NEXT_PUBLIC_SITE_URL` for Production and Preview. The application creates a 30-day TTL index on `expiresAt` in the `clean_records` collection.

## Privacy model

Storage is disclosed before submission and requires an explicit checkbox. Cleaning records do not intentionally include an IP address, user agent, account ID, name, or email. Hosting providers may keep their own access and security logs as described in the privacy policy.

## Attribution

The deterministic text-cleaning approach and codepoint coverage are adapted from [guillaumemeyer/watermarks-remover](https://github.com/guillaumemeyer/watermarks-remover), released under the MIT License. See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## License

MIT. See [LICENSE](./LICENSE).
