# Ivy Wallet → Cashew Converter

[Ivy Wallet](https://ivywallet.app/) is a wonderful open-source money manager for Android — but its original maintainers [stopped developing it](https://github.com/Ivy-Apps/ivy-wallet) on November 5, 2024. While searching for a trustworthy replacement, I settled on [Cashew](https://cashewapp.web.app/).

This tool bridges the gap: it takes Ivy Wallet's CSV export and converts it into a format Cashew can import, so your transaction history moves with you.

**Try it live:** <https://phineasla.github.io/ivy-wallet-converter/>

## Usage

1. Export your data as CSV from Ivy Wallet (Settings → Export)
2. Drop the file onto the converter
3. Download the converted CSV and import it into Cashew

## Development

```sh
pnpm install
pnpm dev        # start dev server
pnpm build      # production build
pnpm test       # run test suite
```

To publish a new version to GitHub Pages:

```sh
pnpm build && pnpm run deploy
```

## Alternatives

- [Ivy2Cashew](https://github.com/iannim/Ivy2Cashew) — another Ivy Wallet to Cashew CSV converter

## Attribution

- Convert icon by [Azland Studio - Flaticon](https://www.flaticon.com/free-icons/convert)
