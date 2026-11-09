---
name: vency
description: Plan and write briefs/prompts for Vency AI (vency.ai), a creative studio for product photoshoots, video ads, upscaling, image/video editing, background removal, vectors, brand identity, voice-over and file tools. Use when the user mentions Vency, or wants product photos, video ads, brand kits, or image/PDF utilities and asks which tool to use or how to prompt it. Arabic and English.
---

# Vency AI (vency.ai)

Vency is a web/iOS creative studio ("your virtual agency"). It aggregates models
(Nano Banana, GPT Image, FLUX, Seedance, Veo, Kling, MiniMax, Hailuo, Wan, Grok Imagine).
The site is bilingual (English / عربي). **No public API or CLI is known**: this skill
helps the user choose the right tool and write the input; the user runs it at
https://vency.ai (sign-in required). Never claim you ran a Vency tool yourself.

## Tool catalog

| Need | Vency tool | Input |
|---|---|---|
| Product photo -> studio shot | Photoshoot | product photo + background/style |
| Product photo -> video ad | Videoshoot | product photo + motion/mood |
| Fashion / try-on shots | Model Photoshoot | product + model + setting |
| Graduation portraits | Graduation Photoshoot | user photos + gown design |
| Edit by prompt (translate labels, swap background) | Image Editor | image + instruction |
| Edit/restyle/extend a clip | Video Editor | video + instruction |
| Low-res -> 4K | Upscaler | image or clip |
| Cut out subject | Background Remover | image |
| Raster/idea -> editable vector | Vector | image or text |
| Social posts, ads, slides | Canvas | freeform design |
| Logo, palette, typography from a site | Brand Identity | website URL |
| Marketing email (subject, copy, hero) | Email Generator | short brief |
| Text -> speech | Voice Over | script |
| Share large files | File Transfer | files (password/expiry) |
| Compress / convert / PDF / QR | File & Image Compressor, File Converter, PDF Toolkit, QR Code | file or URL |

## Workflow

1. Ask only what is missing: goal, input assets, target channel (Instagram, ad, store), language.
2. Pick the single best tool (or a short chain, e.g. Background Remover -> Photoshoot -> Upscaler).
3. Write the ready-to-paste prompt, in the language the user will publish in.
4. List what to upload and the expected output; suggest 2-3 variations to try.

## Prompt recipe (images)

Subject + setting + lighting + camera/lens + style + constraints.
Example: "Matte black sneaker on wet concrete, soft rim light, 85mm shallow depth of field,
premium editorial look, keep logo and proportions unchanged, no extra text."

## Prompt recipe (video ads)

Hero motion (slow orbit, push-in) + environment + duration (5-10s) + mood + "product stays
identical, no morphing". One motion idea per clip.

## Editing prompts

Short imperative, one change at a time: "Translate all labels to Arabic, keep fonts and layout."
For Arabic text, ask to verify spelling and right-to-left direction in the output.

## Caveats

- Pricing, credits and model availability change; point to https://vency.ai/pricing rather than quoting numbers.
- Only use photos the user owns or may use; do not target real people without consent.
