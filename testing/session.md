# Real-device testing session (fill this in)

The scheduled AdSense job turns this file into the "How we tested" boxes, results tables and
screenshots in the guides listed below. **Only write down what you actually did and measured.**
The editorial policy says "no invented testing", and the job will not guess, round or fill gaps:
a section that still says `TODO` is skipped, and its guide is left as it is.

Edit this file on GitHub (the pencil icon works from a phone). Put screenshots and photos in
`testing/images/` and name them in the sections below.

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
