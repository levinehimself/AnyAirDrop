# Real-device testing session (fill this in)

The scheduled AdSense job turns this file into the "How we tested" boxes, results tables and
screenshots in the guides listed below. **Only write down what you actually did and measured.**
The editorial policy says "no invented testing", and the job will not guess, round or fill gaps:
a section that still says `TODO` is skipped, and its guide is left as it is.

Edit this file on GitHub (the pencil icon works from a phone). Put screenshots and photos in
`testing/images/` and name them in the sections below.

## How to measure (keep it simple and honest)

- **Time a transfer:** start a stopwatch (or screen-record, which also gives you a screenshot) when you tap Send and stop it
  when the receiving device shows the file as complete. Write down seconds. Speed = file size in MB divided by seconds.
- **Do each test twice** and write down both numbers (or the average and say it is an average of two runs). If one run is
  odd (someone else was using the Wi-Fi), say so instead of dropping it.
- **Same files for every method** in a guide, so the numbers are comparable. Note the exact file sizes.
- **Link rate:** use whatever your device shows. Windows: Settings > Network & internet > Wi-Fi > hardware properties shows
  "Link speed". Mac: hold Option and click the Wi-Fi icon to see "Tx Rate". Android: the saved network's details screen
  often shows link speed. If a device does not show it, write "not shown" rather than guessing.
- **Screenshots:** crop out anything private (names, addresses, notifications). Save them in `testing/images/` and use
  plain names such as `wifi-vs-ethernet-speeds.png`.
- **If something failed or was slower than the guide says, write that down.** That is exactly the kind of first-hand
  detail that makes a guide useful, and the guide can be corrected to match.
- A guide you could not test this week stays `TODO`. It is simply skipped, and nothing is invented for it.

## Shared setup (used in every guide's box)

- Test date: TODO (YYYY-MM-DD)
- Devices (model + OS version, one per line):
  - TODO: iPhone model, iOS version
  - TODO: Android phone model, Android version
  - TODO: laptop or PC model, OS version
- Router model and Wi-Fi standard / band used: TODO
- Files used (type, count, size): TODO (for example 50 HEIC photos totalling X MB, one 1 GB 4K video)

## Results per guide

For each guide, give the real numbers or observations. Times in seconds, speeds in MB/s or Mbit/s
(say which). Screenshots: file names in `testing/images/`.

### airdrop-to-android (also needs the guide to be finished: see docs/adsense-readiness.md, task C2)
- Time per method, iPhone to Android, same files (AnyAirDrop, Quick Share with AirDrop if supported, LocalSend, iCloud link, Google Photos): TODO
- Screenshots (the six listed in the guide's SCREENSHOT comments): TODO

### transfer-files-between-pc-and-phone-over-wifi
- Time per method in the comparison, same photos and one large video: TODO
- Screenshots: TODO

### local-transfer-vs-cloud-upload
- Measured local transfer time vs cloud upload plus download, same file: TODO

### wifi-vs-ethernet-for-local-transfers
- Same file over Wi-Fi and over a cable, both speeds: TODO

### wifi-link-speed-vs-real-speed
- Link rate your OS reports (screenshot) next to the measured copy speed: TODO

### devices-cant-find-each-other-troubleshooting
- Router guest network and isolation settings (screenshots) and what the tool shows in each case: TODO

### client-isolation-guest-networks-and-device-visibility
- Main network vs guest network: could the devices see each other? Result: TODO

### why-phone-hotspots-are-slow
- The guide's own bottleneck test run on your phone, and what you found: TODO

### transfer-files-over-a-hotspot-without-internet
- Transfer over a hotspot with mobile data off: did it work? Speed: TODO

### how-quick-share-works
- Screenshots of the Quick Share flow on an Android phone or Windows PC: TODO
