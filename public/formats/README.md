# Format previews

The apply wizard's "Pick Your Lane" step plays a short clip for each format, so
an artist who has never shot with us can see what "Hanging Mic" or "Running Gun"
actually means before paying for one.

Drop files in at these exact names — no code change needed. Anything missing
falls back to a styled placeholder, so a half-filled folder is fine.

| Format          | Still                   | Loop                    |
| --------------- | ----------------------- | ----------------------- |
| Hanging Mic     | `hanging-mic.jpg`       | `hanging-mic.mp4`       |
| Running Gun     | `running-gun.jpg`       | `running-gun.mp4`       |
| Mic'd Up Cypher | `micd-up-cypher.jpg`    | `micd-up-cypher.mp4`    |
| City on Fire    | `city-on-fire.jpg`      | `city-on-fire.mp4`      |

Paths live in `FORMATS` in `src/lib/constants.ts`.

## What the clips should be

- **4–8 seconds**, silent, looping cleanly. The card plays them muted — treat
  audio as absent, not quiet.
- **16:9**, 720p is plenty. The card renders at roughly 340px wide.
- **Under ~2MB each.** They sit on the critical path of a paid conversion step
  and most of this audience is on mobile data. `preload="none"` means nothing
  downloads until a card is hovered or scrolled into view, but keep them small.
- Encode H.264/AAC in MP4 for the widest playback support.
- The **still** should be the first frame of the loop, so there is no jump when
  playback starts.

Rough ffmpeg starting point:

    ffmpeg -i source.mov -ss 00:00:12 -t 6 -an \
      -vf "scale=1280:-2,fps=24" -c:v libx264 -crf 26 -movflags +faststart \
      hanging-mic.mp4

    ffmpeg -i hanging-mic.mp4 -frames:v 1 -q:v 3 hanging-mic.jpg
