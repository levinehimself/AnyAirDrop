---
title: "Wi-Fi Link Speed vs Real Speed: Where the Advertised Rate Goes"
description: "Derive a Wi-Fi 6 link rate step by step, then see how overhead, acknowledgements, sharing and Mbps vs MB/s turn 1,201 Mbps into a much smaller file-copy speed."
topic: "wifi-basics"
order: 5
publishDate: 2026-10-23
heroImage: "./images/diagram.svg"
heroAlt: "Diagram deriving a Wi-Fi 6 link rate of 600.5 Mbps per stream from subcarriers, bits, coding rate and symbol time, then bars showing the rate shrinking after overhead and again for phone to phone"
related:
  - "wifi-channels-and-channel-width"
  - "wifi-standards-explained"
  - "mimo-ofdma-beamforming-explained"
  - "wifi-vs-ethernet-for-local-transfers"
---

The link speed your device reports is the rate at which the radio sends the bits inside each transmission, not the rate at which a file arrives. Between the two sit waiting, headers, acknowledgements, retries, other devices and the fact that Wi-Fi can only talk one way at a time. Even in ideal conditions, a link rate of 1,201 Mbps works out to roughly three quarters of that in useful data.

**Short answer:** link speed is a theoretical radio rate. Real throughput is lower because every transmission carries fixed overhead, because Wi-Fi is half-duplex (a device sends or receives, never both at once), and because every other active device uses some of the same airtime. When one Wi-Fi device sends to another through the router, the data crosses the air twice, which roughly halves the speed again.

## Step 1: build a Wi-Fi 6 link rate from scratch

Every Wi-Fi rate comes from one formula:

**Rate = (data subcarriers × bits per subcarrier × coding rate × spatial streams) ÷ symbol time**

Here is each term for a common Wi-Fi 6 setup, an 80 MHz channel at the fastest setting (called MCS 11, where *MCS* means modulation and coding scheme):

- **Data subcarriers: 980.** An 80 MHz channel in Wi-Fi 6 has 996 usable subcarriers (narrow tones, each 78.125 kHz wide, as described in [how Wi-Fi works](/blog/how-wifi-works/)). Sixteen of them are pilots, reference tones used to keep the receiver in step, which leaves 980 for data.
- **Bits per subcarrier: 10.** 1024-QAM has 1,024 possible symbols, and 2^10 = 1,024, so each subcarrier carries 10 bits at a time.
- **Coding rate: 5/6.** Wi-Fi adds error-correcting redundancy. At rate 5/6, out of every 6 coded bits, 5 are your data and 1 is protection.
- **Symbol time: 13.6 µs.** Each OFDM symbol lasts 12.8 µs (that is 1 ÷ 78.125 kHz) plus a 0.8 µs *guard interval*, a short pause that keeps echoes from one symbol from smearing into the next. 12.8 + 0.8 = 13.6 µs.
- **Spatial streams: 1 or 2.** Each stream is an independent data path from a separate antenna pairing. A two-antenna phone or laptop typically gets two.

Now the arithmetic for one stream:

1. 980 subcarriers × 10 bits = 9,800 coded bits per symbol.
2. × 5/6 = 8,166.7 data bits per symbol.
3. ÷ 13.6 µs = **600.5 Mbps** (8,166.7 bits ÷ 0.0000136 s).

With two streams: 2 × 600.5 = **1,201 Mbps**. That is the number a Wi-Fi 6 laptop with two antennas can show when connected to a matching router on an 80 MHz channel. At 160 MHz the subcarrier count doubles to 1,960, which gives 1,201 Mbps per stream and 2,402 Mbps for two.

### The rate changes constantly

Link rate is not a fixed property of your Wi-Fi. The two devices choose a rate for each transmission based on how clean the signal is, and step down when frames start failing. For one stream on 80 MHz, the same formula gives:

| MCS | Modulation and coding | Bits per symbol (data) | Rate per stream |
| --- | --- | --- | --- |
| 0 | BPSK, 1/2 | 490 | about 36 Mbps |
| 3 | 16-QAM, 1/2 | 1,960 | about 144 Mbps |
| 5 | 64-QAM, 2/3 | 3,920 | about 288 Mbps |
| 7 | 64-QAM, 5/6 | 4,900 | about 360 Mbps |
| 9 | 256-QAM, 5/6 | 6,533 | about 480 Mbps |
| 11 | 1024-QAM, 5/6 | 8,167 | about 600 Mbps |

Walk away from the router and the device moves down this table. The top rate needs a very clean signal, so you only see it near the router. The reason is explained in [Wi-Fi channels and channel width](/blog/wifi-channels-and-channel-width/): more bits per symbol pack the symbols closer together, and noise makes close symbols easy to confuse.

## Step 2: where the gap to real throughput comes from

The 1,201 Mbps figure counts only the time when data bits are on the air. A real exchange spends time on other things. Take a common case, one device sending one *aggregate*: a burst that packs 64 packets of 1,500 bytes into a single transmission. These are typical timing values from the standard (a 5 GHz channel with 9 µs slots), and the exercise is arithmetic on paper, not a measurement.

| Step | Time |
| --- | --- |
| Wait for the channel to be idle (a fixed gap of 43 µs) | 43 µs |
| Random backoff, average of 7.5 slots × 9 µs | 67.5 µs |
| Preamble and headers that every transmission starts with | about 50 µs |
| Data: 64 × 1,500 bytes = 768,000 bits, plus about 20,500 bits of per-packet headers = 788,480 bits at 1,201 Mbps | 656.5 µs |
| Short gap before the reply (SIFS) | 16 µs |
| Block acknowledgement from the receiver | about 32 µs |
| **Total** | **about 865 µs** |

Useful payload is 768,000 bits in 865 µs, which is 768,000 ÷ 0.000865 = **about 888 Mbps**, or 74 percent of the link rate. That is the best case with one active device, a perfect signal, nothing retried and large aggregates. Several things then reduce it further:

- **Half-duplex.** Wi-Fi is half-duplex: a device sends or receives on a channel, never both. When you download, your device must still send TCP acknowledgements (small packets saying "got it"), and each one needs its own turn on the air. If each downstream burst triggers an extra 200 µs for the return traffic, the same example drops to 768,000 ÷ 0.001065 = about 721 Mbps, 60 percent of the link rate.
- **Other devices.** Every device that is transferring takes airtime. Ten active devices do not each get 1,201 Mbps. Neighbors on the same channel count too.
- **Retries at low signal.** If the signal is marginal, the radio drops to a lower MCS and also loses some frames. A retried frame wastes its airtime and widens the random backoff for the next attempt.
- **Smaller bursts.** The overhead in the table above is mostly fixed per transmission, so small or interrupted bursts waste a larger share.
- **Higher layers.** TCP slows itself when it sees loss or long delays, the receiving program may be slow, and a remote server has its own limits.

One consequence is counterintuitive: lower rates are more efficient. At MCS 7 with two streams (720.6 Mbps), the data takes 788,480 ÷ 720.6 = 1,094 µs, and the same 208.5 µs of overhead brings the total to about 1,303 µs. That gives 768,000 ÷ 0.001303 = about 590 Mbps, 82 percent of the link rate. Cutting the link rate by 40 percent, from 1,201 to 720 Mbps, reduced throughput by only about a third (888 to 590), because overhead is a smaller share of a longer transmission. This is why throughput does not rise in step with the number on the router box.

## Step 3: the extra halving between two Wi-Fi devices

Suppose a phone sends a file to a laptop, and both connect to the same router on the same channel. The phone does not talk to the laptop directly. It sends to the router, and the router sends to the laptop. That is two transmissions of the same data, both on the same shared channel, one after the other.

Using the example above, with both devices at 1,201 Mbps, the best case is about 888 ÷ 2 = **444 Mbps**. In general, if the two devices' effective rates are R1 and R2, the combined rate is about 1 ÷ (1/R1 + 1/R2). When both are equal that simplifies to half. If the laptop used an Ethernet cable instead, the second hop would not use Wi-Fi airtime at all, and the transfer could run at the full effective rate of the phone's link. [Wi-Fi vs Ethernet for local transfers](/blog/wifi-vs-ethernet-for-local-transfers/) compares them.

If the two devices are on different bands, such as one on 5 GHz and one on 2.4 GHz, the router can handle both hops at once on separate radios, so the slower link, not the sum, sets the pace.

## Mbps vs MB/s: the conversion

A lowercase *b* means bits and an uppercase *B* means bytes. There are 8 bits in a byte. Network speeds are usually quoted in megabits per second (Mbps); file managers show megabytes per second (MB/s).

- 888 Mbps ÷ 8 = **111 MB/s**.
- 444 Mbps ÷ 8 = **55.5 MB/s**.
- A 100 Mbps internet plan tops out at 100 ÷ 8 = 12.5 MB/s.

Some systems show MiB/s rather than MB/s. A mebibyte is 1,048,576 bytes rather than 1,000,000, so 111 MB/s appears as about 106 MiB/s. As an example of what the numbers mean: a 4 GB video is about 4,000 MB, which at 55.5 MB/s takes about 72 seconds, assuming nothing else is limiting.

### Why a speed test and a file copy disagree

They measure different paths. A speed test usually measures the route from your device to a server on the internet, so it is bounded by your Wi-Fi *and* your internet plan *and* the distant server. A file copy between two of your own devices measures your Wi-Fi (twice, if both are wireless), plus the storage speed of both devices and the way the file-sharing method works. A phone's storage write speed, a laptop's disk, or a transfer of thousands of small files, each with its own setup cost, can all be slower than the radio. Neither number is wrong; they answer different questions.

## How to read the link rate on your own device

The labels vary by system version, so treat these as pointers.

- **Windows:** the Wi-Fi properties screen in Settings shows the link speed and band. Running `netsh wlan show interfaces` in a terminal lists the *receive rate* and *transmit rate* in Mbps, the signal strength, the channel and the radio type (for example, 802.11ax).
- **macOS:** holding the Option key while clicking the Wi-Fi menu icon shows details such as transmit rate, channel width and signal.
- **Android and iOS:** some Android versions show a link speed in the connected network's details; other systems may not show it at all.

Two cautions. Receive and transmit rates can differ because each direction is negotiated separately, and the numbers drop when the connection is idle because the radio only needs to send small packets. To see your top rate, stand near the router while something is actively transferring. As a rough rule, useful throughput in good conditions is commonly somewhere between half and three quarters of the link rate, falling with distance, interference and the number of active devices.

## Setting expectations for a transfer between your own phone and laptop

When you move a large file between two of your own devices on one Wi-Fi network, four limits apply at once: the link rate of each device, the halving from the shared router hop, the storage speed of the slower device, and whatever your neighbors are doing on the channel. The slowest of those sets the speed. Because the data stays inside your home, your internet plan is not one of the limits, which is the main reason local transfers can beat uploading to a cloud service and downloading again; [local transfer vs cloud upload](/blog/local-transfer-vs-cloud-upload/) works through a comparison. For example, a 4 GB file on an internet upload speed of 20 Mbps is 32,000 megabits, which takes 1,600 seconds (about 27 minutes) to upload before any download starts. That example plan is illustrative, not typical.

AnyAirDrop.com is our own tool, and when a direct connection is possible it sends files straight between devices on the same network, so these same limits apply to it: the speed you see comes from your Wi-Fi and your devices, not from our servers. For the practical PC-and-phone side, see [transferring files between a PC and a phone over Wi-Fi](/blog/transfer-files-between-pc-and-phone-over-wifi/).

## Common questions

### Why is my Wi-Fi speed lower than the link speed my laptop shows?

The link speed counts only the time when data bits are being transmitted. Waiting, headers, acknowledgements, retries and other devices use the rest of the airtime. Throughput of around half to three quarters of the link rate is normal in good conditions.

### Is 1 Gbps Wi-Fi the same as 1 gigabyte per second?

No. 1 Gbps is one gigabit per second, which is 125 MB/s at most, before any overhead. A Wi-Fi connection rated at 1,201 Mbps would deliver at best around 100 MB/s in ideal conditions.

### Why do my speed test and my file copy show different speeds?

A speed test measures the path to a server on the internet, limited by your internet plan. A file copy between local devices measures your Wi-Fi, your devices' storage and the transfer method. They are different paths with different limits.

### Does a faster router speed up transfers between two phones?

Only if the router is the bottleneck. Each phone's own link rate, its antenna count and its Wi-Fi generation set the cap on its side, and the two-hop halving still applies. A newer router mainly helps by being cleaner and handling more devices at once.

### What does MCS mean?

MCS stands for modulation and coding scheme, a number that selects how many bits each symbol carries and how much error protection is added. Higher numbers are faster but need a cleaner signal, and the radio switches between them constantly.

## Key takeaways

- A Wi-Fi 6 link rate comes from a formula: 980 subcarriers × 10 bits × 5/6 ÷ 13.6 µs gives 600.5 Mbps per stream, and 1,201 Mbps for two.
- That rate counts only data bits on the air; waiting, headers and acknowledgements cut it to roughly three quarters even in ideal conditions.
- Sending from one Wi-Fi device to another through a router crosses the air twice, which roughly halves the speed.
- Mbps are bits and MB/s are bytes: divide by 8 to convert.
- Speed tests and file copies measure different paths, so they should not match.

## Sources

- Wi-Fi Alliance: [Wi-Fi (MAC/PHY) features](https://www.wi-fi.org/wi-fi-macphy)
- IEEE 802.11 Working Group: [Project overview](https://www.ieee802.org/11/)
- Wi-Fi Alliance: [Wi-Fi Alliance delivers Wi-Fi 6E certification program](https://www.wi-fi.org/news-events/newsroom/wi-fi-alliance-delivers-wi-fi-6e-certification-program)
- Microsoft Support: [Wi-Fi and your home layout](https://support.microsoft.com/en-us/windows/experience/connectivity-networking/wi-fi-and-your-home-layout)
