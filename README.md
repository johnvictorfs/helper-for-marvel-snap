# (WIP) Tracker Overlay for Marvel Snap

A overlay for Linux that appears over the Marvel Snap game to help you keep track of cards in your deck (and in the future the opponent's deck as well).

![overlay image](images/overlay.png)

- Tested with:
  - i3wm/x11

## Development

- Requirements
  - [bun](https://bun.sh)
  - [rust](https://www.rust-lang.org/tools/install)

- Install dependencies
  - `bun install`
  - `cd src/desktop && cargo build`

- Running
  - `bun server` to start the API
  - `bun desktop` to start the overlay
  - `bun dev` to start the overlay web page

## Known issues

- Very often game state updates just don't happen and the overlay is outdated
- Only supports your default display, which is not necessarily the one the game is running on
- Overlay is always in a fixed position, not being able to move it (at least on i3wm)

## Missing features

- Another window to setup overlay settings + keybindings
- Packaging for easier installation
- Tracking opponent's deck

## Out of scope

- Syncing your collection/game stats to third-party tracking websites. Other trackers that do run on linux can already do that.
