---
title: "Wi-Fi Channels and Channel Width: 20, 40, 80, 160 and 320 MHz"
description: "How Wi-Fi channels are numbered, why only 1, 6 and 11 avoid overlap on 2.4 GHz, and why wider channels run faster but break more easily, with the noise arithmetic."
topic: "wifi-basics"
order: 4
publishDate: 2026-10-23
heroImage: "./images/diagram.svg"
heroAlt: "Chart of 2.4 GHz Wi-Fi channels 1 to 11 drawn as overlapping humps, with channels 1, 6 and 11 highlighted as the three that do not overlap"
related:
  - "wifi-bands-2-4-5-6-ghz"
  - "wifi-link-speed-vs-real-speed"
  - "wifi-standards-explained"
  - "mesh-wifi-vs-extenders-vs-powerline"
---

A Wi-Fi channel is a slice of a band with a center frequency and a width, and your router and every nearby network must pick one. Wider slices carry more data at once, but they need a stronger, cleaner signal and leave fewer slices for everyone else. That trade-off is why "use the widest channel" is often poor advice.

**Short answer:** on 2.4 GHz, channel numbers are only 5 MHz apart but each channel is about 20 MHz wide, so only 1, 6 and 11 (in the US) avoid overlapping. Doubling channel width doubles the data capacity but also raises the noise your receiver collects by about 3 dB, which shortens the distance at which the fastest speeds work.

## What a channel is

A band such as 2.4 GHz is a continuous stretch of spectrum. A *channel* is a defined piece of it, identified by a number that maps to a *center frequency*, and a *width* that says how much spectrum around that center it occupies. The main widths are 20, 40, 80, 160 and, in Wi-Fi 7, 320 MHz. Everything on a channel is shared airtime, as [how Wi-Fi works](/blog/how-wifi-works/) describes: if two nearby networks use the same channel, their devices take turns.

The channel number is just a shorthand. It is the center frequency minus a band-specific base, divided by 5 MHz.

## 2.4 GHz: numbered 5 MHz apart, but 20 MHz wide

On 2.4 GHz, the center frequency of channel *n* is 2407 + 5 × *n* MHz. So:

| Channel | Center | 20 MHz span |
| --- | --- | --- |
| 1 | 2412 MHz | 2402 to 2422 MHz |
| 2 | 2417 MHz | 2407 to 2427 MHz |
| 6 | 2437 MHz | 2427 to 2447 MHz |
| 11 | 2462 MHz | 2452 to 2472 MHz |
| 13 | 2472 MHz | 2462 to 2482 MHz |

The United States allows channels 1 to 11, most of the world allows 1 to 13, and Japan additionally has a channel 14 that older 802.11b networks use. Cisco Meraki's guidance on [channel planning](https://documentation.meraki.com/Wireless/Design_and_Configure/Architecture_and_Best_Practices/Channel_Planning_Best_Practices) notes that the US permits channels 1 to 11, yielding three non-overlapping channels.

### Why 1, 6 and 11

Adjacent channel numbers are 5 MHz apart, yet each channel needs about 20 MHz (22 MHz for the older 802.11b). That means channel 1 and channel 2 overlap across 15 of their 20 MHz. To find channels that do not overlap, you need centers at least 20 to 22 MHz apart. Counting in steps of 5 channels gives 25 MHz, which clears it with a few MHz to spare:

- Channel 1 spans 2402 to 2422 MHz.
- Channel 6 spans 2427 to 2447 MHz.
- Channel 11 spans 2452 to 2472 MHz.

There is a 5 MHz gap between each pair. In regions with channel 13 you could squeeze in four channels (1, 5, 9, 13) if you accept channels touching edge to edge, but the 1, 6, 11 pattern is the accepted default because it leaves a margin.

The practical consequence is surprising. If neighbors are on 1 and 11 and you pick channel 3 or 8 because it looks empty, you now overlap one or both of them partially. As the next sections explain, that is usually worse than sharing a channel with one of them directly.

## 5 GHz: 20 MHz steps, and channels bonded in blocks

On 5 GHz, the channel number is (frequency in MHz − 5000) ÷ 5. Channel 36 is 5180 MHz, 40 is 5200 MHz, 44 is 5220 MHz. Each 20 MHz channel is 20 MHz from the next, so the numbers step by 4, and no overlap exists between standard 20 MHz channels.

In the United States, the 20 MHz channels fall in four groups:

| Group | Channels | Notes |
| --- | --- | --- |
| Lower | 36 to 48 | No radar rules |
| Middle | 52 to 64 | Radar rules (DFS) apply |
| Upper-middle | 100 to 144 | Radar rules (DFS) apply |
| Upper | 149 to 165 | No radar rules |

That is up to 25 channels at 20 MHz, fewer in other countries. [Wi-Fi bands compared](/blog/wifi-bands-2-4-5-6-ghz/) explains the radar rules: a router that uses *dynamic frequency selection* (DFS) must check for and yield to radar.

Wider channels are made by *bonding* neighboring 20 MHz channels into aligned blocks. Channels 36, 40, 44 and 48 together form one 80 MHz channel. Channels 36 to 64 form a 160 MHz channel. The US layout has roughly twelve 40 MHz, six 80 MHz and two 160 MHz channels. Notice what that means: if your router wants 160 MHz on 5 GHz, there are only two places it can go, and one of them needs DFS.

## 6 GHz: much more room

On 6 GHz, the channel number is (frequency in MHz − 5950) ÷ 5, so channel 1 is 5955 MHz and the 20 MHz channels are numbered 1, 5, 9 and so on up to 233. In the US that is 59 channels at 20 MHz, 29 at 40 MHz, 14 at 80 MHz and 7 at 160 MHz. The [Wi-Fi Alliance's 6E announcement](https://www.wi-fi.org/news-events/newsroom/wi-fi-alliance-delivers-wi-fi-6e-certification-program) cites up to seven 160 MHz channels. Wi-Fi 7's 320 MHz width fits three times in the US allocation.

This is the real benefit of 6 GHz for crowded buildings: even with wide channels, there are enough of them that neighbors can avoid each other.

## Why wider channels are faster

Wi-Fi sends data on many narrow subcarriers (the OFDM technique explained in [how Wi-Fi works](/blog/how-wifi-works/)). A wider channel is simply more of them. In Wi-Fi 6 and Wi-Fi 7, each subcarrier is 78.125 kHz wide, and the number that carry data grows with width:

| Width | Data subcarriers | Wi-Fi 6 rate per stream (1024-QAM, rate 5/6) |
| --- | --- | --- |
| 20 MHz | 234 | about 143 Mbps |
| 40 MHz | 468 | about 287 Mbps |
| 80 MHz | 980 | about 600 Mbps |
| 160 MHz | 1,960 | about 1,201 Mbps |

The count roughly doubles at each step: 468 is exactly 2 × 234, 1,960 is exactly 2 × 980, and 980 is a little more than 2 × 468 because the 80 MHz layout spends proportionally less on pilot and guard tones. Each doubling about doubles the data per transmission. [Wi-Fi link speed vs real speed](/blog/wifi-link-speed-vs-real-speed/) shows the full calculation behind these rates.

## Why wider channels are more fragile

### Noise grows with width

Every receiver collects thermal noise from the random motion of electrons, and the noise power is proportional to the bandwidth it listens to. At room temperature it is about −174 dBm per hertz, so for a bandwidth *B*:

**Noise floor (dBm) = −174 + 10 × log10(B in Hz)**

For 20 MHz, 10 × log10(20,000,000) = 73.0, so the noise floor is −174 + 73.0 = **−101 dBm**. Each doubling adds 10 × log10(2) = 3.01 dB:

| Width | Ideal noise floor |
| --- | --- |
| 20 MHz | −101 dBm |
| 40 MHz | −98 dBm |
| 80 MHz | −95 dBm |
| 160 MHz | −92 dBm |
| 320 MHz | −89 dBm |

These are ideal values; real receivers add their own noise. The point is the slope. The transmitter's total power limit does not rise with width, so the same signal is spread over more spectrum while the noise grows. The *signal-to-noise ratio* (SNR), the gap in dB between your signal and the noise, drops 3 dB per doubling.

A worked example: suppose a link has 30 dB of SNR on a 20 MHz channel. Going to 40 MHz leaves 27 dB, 80 MHz leaves 24 dB, and 160 MHz leaves 21 dB. The densest modulations, such as 1024-QAM, need a high SNR to decode reliably, so at the lower SNR the radio steps down to a less dense one. The exact SNR each modulation needs depends on the hardware, but the direction is fixed: the farther away you are, the less a very wide channel helps and the more it may hurt.

### Fewer channels and more neighbors

A wider channel is also harder to keep clean. At 80 MHz, four 20 MHz channels must be quiet. If a neighbor's network is active on any of them, the router can lose the ability to use the full width during those moments. Newer standards help: the receiver can fall back to a narrower width for a frame, and Wi-Fi 7 can use *preamble puncturing*, which skips a busy 20 MHz slice and uses the rest. Still, in a dense apartment block, a 40 or 80 MHz channel often performs as well as 160 MHz because it collides less.

On 2.4 GHz, 40 MHz is almost never wise. It takes roughly half the whole 83.5 MHz band, so it only works where no one else is around.

## Co-channel vs adjacent-channel interference

There are two kinds of interference between neighbors.

**Co-channel interference** is two networks on the *same* channel. Their devices can decode each other's preambles (the opening bits of each frame), so they follow the polite listen-and-wait rules. The standard sets a detection level of about −82 dBm for a Wi-Fi preamble on a 20 MHz channel. A neighbor stronger than that makes your device wait. Nothing breaks, but airtime is split.

**Adjacent-channel interference** is two networks on *partly overlapping* channels. Each hears the other as plain noise rather than as a readable Wi-Fi frame, and noise is only noticed above a much higher level (about 20 dB higher in typical implementations). So devices often fail to wait their turn, transmit on top of each other, and both networks lose frames and retry.

That is why sharing channel 6 with a neighbor on 6 is better than sitting on channel 8 beside them. Co-channel costs airtime; overlap costs airtime and also corrupts frames.

## Looking at the channels around you

You can see the competition with a Wi-Fi scanner. The exact tool depends on your device, and menu names vary by system version:

- On **Windows**, running `netsh wlan show networks mode=bssid` in a terminal lists nearby networks with their channels and signal levels.
- On **macOS**, the Wireless Diagnostics tool has a scan view; a keyboard modifier on the Wi-Fi menu icon usually reveals it, and it varies by version.
- On **Android**, scanner apps from the app store show channels, and some Wi-Fi settings screens show your own channel.
- On **Linux**, `nmcli device wifi list` or `iw dev <interface> scan` print channels and signal.

Read the result like this. Signal strength is shown in dBm (or as a percentage), where −40 is very strong and −80 is weak. Count the networks on each channel that are stronger than about −70 dBm, since those are the ones that make you wait. On 2.4 GHz, choose whichever of 1, 6 and 11 has the fewest strong neighbors. On 5 and 6 GHz, look for a block of channels with little traffic and consider 40 or 80 MHz if the neighborhood is dense. Most routers pick automatically at startup; a manual choice is worth trying when a scan shows one clear winner and your router keeps choosing a crowded one. Where your router's channel settings live varies by brand, so check its manual.

## Channel choices when you move big files between your own devices

A large transfer keeps the channel busy for as long as it runs. Other networks on your channel are not a minor background issue then: every moment a neighbor transmits is a moment your transfer waits. That is one reason a file copy that is fast late at night can slow down in the evening.

Three practical consequences follow. First, a wide channel only helps if the devices are close and the signal is strong. A phone across the apartment may see no gain from 160 MHz over 80 MHz. Second, two devices that both use the router pay for airtime twice, once for each hop, as [Wi-Fi link speed vs real speed](/blog/wifi-link-speed-vs-real-speed/) works out. Third, a direct device-to-device link such as Wi-Fi Direct may sit on its own channel, and some phones must switch between the router's channel and that one, which costs time. [Wi-Fi Direct, Wi-Fi Aware and AWDL](/blog/wifi-direct-wifi-aware-awdl-explained/) covers how those direct links choose channels. If your signal path is the bottleneck, a cable from the router to a computer removes one wireless hop; see [Wi-Fi vs Ethernet for local transfers](/blog/wifi-vs-ethernet-for-local-transfers/).

## Common questions

### What is the best Wi-Fi channel?

On 2.4 GHz in the US, the best of 1, 6 and 11 is the one with the fewest strong neighbors. On 5 and 6 GHz, any clean channel works, and non-DFS channels avoid the radar wait. A scan of your own surroundings answers this better than any general rule.

### Should I set my router to 80 MHz or 160 MHz?

Use the widest width only if you have a strong signal and few neighbors. In a busy building, 40 or 80 MHz is often more reliable. A narrower setting collides less with neighbors.

### Why does my router use 20 MHz on 2.4 GHz?

Because 2.4 GHz has only 83.5 MHz of space in total, so a 40 MHz channel would take about half of it and collide with neighbors. Many routers default to 20 MHz there for that reason.

### Does changing the channel really help?

It can, when interference is the cause. If your channel is shared with several strong networks, moving to an emptier one gives you more airtime. If your problem is distance or walls, changing channels does little.

### What does "auto" channel do?

The router scans at startup (and on some models periodically) and picks the quietest channel it can find. It cannot see future traffic, so it can pick a crowded channel when the neighbors are busy at a different time.

## Key takeaways

- A channel is a center frequency plus a width. The number is just the frequency offset divided by 5 MHz from a band base.
- On 2.4 GHz, channels are 5 MHz apart but 20 MHz wide, so only 1, 6 and 11 avoid overlap in the US.
- Each doubling of width doubles the subcarriers and adds about 3 dB of noise, so wider means faster only when the signal is strong and the air is quiet.
- Sharing a channel is better than partly overlapping one, because overlapping neighbors corrupt each other's frames.
- A scanner shows the channels around you; count strong neighbors per channel before changing a setting.

## Sources

- Cisco Meraki: [Channel Planning Best Practices](https://documentation.meraki.com/Wireless/Design_and_Configure/Architecture_and_Best_Practices/Channel_Planning_Best_Practices)
- Wi-Fi Alliance: [Wi-Fi Alliance delivers Wi-Fi 6E certification program](https://www.wi-fi.org/news-events/newsroom/wi-fi-alliance-delivers-wi-fi-6e-certification-program)
- Wi-Fi Alliance: [Wi-Fi (MAC/PHY) features](https://www.wi-fi.org/wi-fi-macphy)
- US Federal Register: [Unlicensed National Information Infrastructure (U-NII) Devices in the 5 GHz Band; Correcting Amendments](https://www.govinfo.gov/content/pkg/FR-2014-09-24/html/2014-22677.htm)
- IEEE 802.11 Working Group: [Project overview](https://www.ieee802.org/11/)
