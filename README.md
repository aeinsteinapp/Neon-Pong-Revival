
# DeadmanXXXII's Classic Pong (BeeWare + pygame)

This project packages the existing pygame-based Pong game as a BeeWare app so it can be built with Briefcase for Android, iOS, desktop platforms.

## Quick Start (local)
```bash
pip install briefcase toga pygame-ce
briefcase dev
```

## GitHub Actions
The `.github/workflows/beeware.yml` will attempt to build an Android package using Briefcase.

## Notes
- Make sure `8-bit-loop-music-290770.mp3` and `icon.png` are present in `src/deadman_pong/assets/` when you push to GitHub.
- The app runs `pong.py` as a subprocess so the UI remains responsive.
