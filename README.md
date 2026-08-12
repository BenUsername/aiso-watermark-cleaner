# Aiso watermark remover

Aiso&apos;s hosted web implementation of Guillaume Meyer&apos;s MIT-licensed [watermarks-remover](https://github.com/guillaumemeyer/watermarks-remover) project.

Live tool: [getaiso.com/tools/watermark-remover](https://www.getaiso.com/tools/watermark-remover)

This repository ports the complete supported upstream inspection-first workflow to TypeScript and Next.js, including both text layers, file containers, post-clean verification, and the same residual-risk boundaries.

## Implemented scope

| Layer | Hosted implementation |
| --- | --- |
| Layer A | Inspect codepoints, categories, kinds, counts, and offsets; remove invisible and format Unicode; normalize space lookalikes; optionally normalize Latin confusables and NFKC |
| Layer B | Paraphrase, back-translation, and structural rewrite prompts; optional hosted OpenAI-compatible rewrite; Layer A scrub after model output |
| PNG / JPEG | Inspect C2PA, JUMBF, EXIF, XMP, text, APP, and comment carriers; strip supported metadata while preserving image data |
| SVG / PDF | Inspect provenance markers; remove SVG metadata/XMP/comments; best-effort PDF XMP scrub with byte offsets preserved |
| DOCX / ODT | Inspect ZIP parts; scrub document properties and generator fields; remove custom XML and non-content provenance parts |
| HTML / Markdown | Remove AI-related meta, JSON-LD, data attributes, or YAML frontmatter, then run Layer A |
| Common text files | Run detailed Layer A inspection and cleaning |

Every file clean includes a new download and a post-clean residual inspection. The source file is never changed in place.

## Honest limits

- Layer B is a substantial rewrite, can reduce writing quality, and cannot certify a result against a private vendor detector.
- The hosted PDF pass is best-effort. The upstream Python CLI prefers optional `exiftool` for more complete PDF metadata stripping.
- Pixel, audio, and video watermark removal, C2PA soft binding, secret-key detectors, and training backdoors remain out of scope.
- Upstream&apos;s optional reverse-SynthID integration is detection-only, requires a separate roughly 220 MB external checkout, and is not bundled in this hosted service.
- The hosted file size limit is 3 MB because Vercel Functions cap both request and response payloads at 4.5 MB.

## Data handling

- Inspection and Layer B prompt generation do not create MongoDB cleaning records.
- Text cleaning and hosted rewriting store the input, output, report, selected source, consent, and timestamps for 30 days.
- Text-like file cleaning stores the original and cleaned text-like content plus the report.
- Binary file cleaning stores the filename, type, sizes, findings, actions, and residual report, but not the raw binary input or output.
- Every stored record returns a browser-held deletion token for early deletion.

See the live privacy policy and terms for the complete disclosure.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and configure `MONGODB_URI`.
3. On Vercel, Layer B uses AI Gateway with automatically refreshed OIDC authentication and chooses a non-origin model when the selected source is known. For another OpenAI-compatible endpoint, optionally configure `WATERMARKS_REWRITE_API_KEY`, `WATERMARKS_REWRITE_BASE_URL`, and `WATERMARKS_REWRITE_MODEL`.
4. Run `npm run dev`.

The database name defaults to `aiso_watermark_cleaner`. The application creates a 30-day TTL index on `expiresAt` in `clean_records`.

## Checks

```sh
npm test
npm run build
```

## Deployment

The Next.js base path is `/tools/watermark-remover`, allowing the complete app to be served at the canonical Aiso tools URL. Configure the MongoDB variables in Vercel for Production and Preview. Vercel AI Gateway authenticates hosted Layer B with the deployment&apos;s OIDC identity, so a separate model secret is not required. Prompt generation remains available outside Vercel without a model credential.

## Attribution

The workflow, removal matrix, Unicode coverage, Layer B prompts, file cleaning behavior, and limitation language are adapted from [guillaumemeyer/watermarks-remover](https://github.com/guillaumemeyer/watermarks-remover), released under the MIT License. The implementation was ported against upstream commit `545c38320163cb9825ef43271e6a5fe60397fa20`.

See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## License

MIT. See [LICENSE](./LICENSE).
