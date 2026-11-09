# Alpha Build 1

A portable local Netrunner game with an AI opponent. No Node.js, Docker, account, or installation is needed. A modern browser is required. Gameplay and the built-in guide work offline; optional AI chat needs a separately configured provider.

1. Download the ZIP for your computer and extract the **entire** folder.
2. Windows x64: double-click **LocalTable.exe**. macOS: double-click **Local Table.app**. Linux x64: run **./LocalTable** (or open it from your file manager).
3. The game opens in your default browser. Choose Runner or Corporation and **Jack in**.
4. Use **Quit game** in the top bar to stop the local server, then close the tab. Closing the tab alone leaves the server running; launching again opens the same running game.

These alpha apps are unsigned by a verified publisher and are not notarized. Windows may show SmartScreen; macOS may require **System Settings → Privacy & Security → Open Anyway** after the first launch attempt. macOS packages have local ad hoc signatures for execution on their intended architecture. Keep the app with its bundled files. On Linux, if your extractor drops the executable permission, run `chmod +x LocalTable`.

Choose **macOS Apple Silicon** for M-series Macs, or **macOS Intel** for Intel Macs. The macOS build requires macOS 13.5 or newer. Windows requires Windows 10 or newer (64-bit). Linux requires a modern x64 distribution with glibc 2.28+ and a desktop browser; Alpine/musl is not supported. ARM Windows and ARM Linux are not included in this build.

Games save in this browser at `http://127.0.0.1:24680`. Use the same browser and address to resume. Different browsers and private windows have separate saves. **Menu → Export game replay** keeps a portable copy. Export before switching browsers or clearing browser data. Developer-server saves at port 5173 are separate; export/import a replay to transfer one.

If your browser does not open, visit **http://127.0.0.1:24680/launch**. Command-line options: `--no-browser`, `--port NUMBER`, `--json`, `--version`. Changing the port uses separate browser storage. Only this computer can connect to the game server.

This is an independent fan project, not an official NSG release. See the included LICENSE, NOTICE.md, and NODE-LICENSE.txt for code and asset notices. Report problems with the build name, operating system, and an exported replay at https://github.com/nicanadian/nzg-netrunner/issues.

## Build from source

On macOS with Node 22+ and Apple's command-line tools:

```sh
npm ci
npm run build:release
```

The builder downloads Node v26.13.0 official runtimes, checks them against the version's official SHA256SUMS, bundles the server with pinned esbuild, and creates native executables using Node's SEA builder. It cross-builds Windows x64, Linux x64, macOS arm64 and macOS x64; snapshots and code cache are disabled. Both macOS apps are ad hoc signed. `-- --target macos-arm64` builds just that target. Downloads are cached in ignored `tmp/release-runtime/`; staging is in ignored `.work/` and ZIPs/checksums/manifests are generated here. No `.env` files, developer tools, dependencies, test fixtures, Jinteki services, or personal credentials are copied into the packages. Runtime game assets, original card fallback images and license notices are included.

The generated `manifest.json` records source commit, dirty-tree status, platform, runtime version, official runtime archive hash, package size and ZIP SHA256. Releases must be built from a clean committed checkout and tagged at the recorded source commit. The ZIP file timestamps and ad hoc signatures are not promised to be byte-identical across rebuilds. `npm run test:desktop` checks the launcher; `node scripts/smoke-release.cjs PATH/TO/EXECUTABLE` checks an extracted native package on its intended OS. The manual **Verify Alpha packages** GitHub Actions workflow tests downloaded release ZIPs on all four native runner platforms.
