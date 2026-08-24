# Cinematic Frame Sequence

Place your extracted video frames here.

## Naming Convention

```
frame-0001.webp
frame-0002.webp
frame-0003.webp
...
frame-NNNN.webp
```

## Requirements

- **Format**: WebP (recommended for quality/size balance)
- **Aspect Ratio**: 9:16 (portrait / vertical video)
- **Resolution**: 1080×1920 recommended (or higher)
- **Naming**: Zero-padded 4-digit index starting from 0001

## Extraction Command (FFmpeg)

```bash
ffmpeg -i input_video.mp4 -vf "fps=30" frame-%04d.webp
```

## After Adding Frames

Update `FRAME_COUNT` in `src/components/cinematic/frameSequence.ts` to match
the total number of frames, and set `USE_TEST_FRAMES` to `false`.
