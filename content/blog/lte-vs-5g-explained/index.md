---
title: "LTE vs 5G Explained: Bands, Channel Width and Real Speed"
description: "What LTE and 5G NR actually change, why the 5G icon does not promise speed, and how channel width and modulation set a peak rate, with the arithmetic shown."
topic: "phones-as-modems"
order: 2
publishDate: 2026-10-23
heroImage: "./images/diagram.svg"
heroAlt: "Diagram comparing a narrow 20 MHz carrier with a wide 100 MHz carrier, showing that more bandwidth and more spatial streams give a higher peak rate"
related:
  - "what-is-a-phone-modem-baseband"
  - "why-phone-hotspots-are-slow"
  - "how-phone-hotspot-works"
  - "wifi-channels-and-channel-width"
---

LTE (Long-Term Evolution) is the fourth-generation cellular standard, and 5G NR (New Radio) is the fifth. Both do the same basic job: they move data between your phone and a cell tower using licensed radio spectrum. 5G adds wider channels, new frequency ranges, a more flexible timing structure and a new core network, but the speed you see on a given day still comes down to the same few physical limits.

**Short answer:** the "5G" icon on your status bar only tells you which radio technology your phone is attached to. Your speed is set by which frequency band the tower uses, how wide a slice of it you are given, how clean your signal is, how many other people share that tower, and how many antennas and data streams your phone and the tower can use together. A narrow low-band 5G channel can be slower than a well-aggregated LTE connection.

## What LTE and 5G NR have in common

Both standards are written by 3GPP (the 3rd Generation Partnership Project), and both use OFDM (orthogonal frequency-division multiplexing), the same idea that [Wi-Fi uses](/blog/how-wifi-works/): the channel is split into many narrow subcarriers, and each carries a slice of the data. The tower, called a base station, schedules who gets which subcarriers and when, in small time slots. Unlike Wi-Fi, where devices listen and take turns on their own, a cellular tower is in charge. Your phone does not decide when to transmit; it asks, and the tower grants.

The work of talking to the tower happens in the phone's modem, which we describe in [what a phone modem (baseband) is](/blog/what-is-a-phone-modem-baseband/). Everything in this article ultimately limits what that modem can deliver to the rest of the phone.

## What 5G NR actually adds

**More spectrum and wider channels.** An LTE carrier tops out at 20 MHz wide. According to the [3GPP 5G overview](https://www.3gpp.org/technologies/5g-system-overview), NR carriers can be up to 100 MHz wide in the ranges below 6 GHz and up to 400 MHz wide above 6 GHz. Wider channels carry more subcarriers, so more data per second.

**Flexible timing.** LTE has one subcarrier spacing, 15 kHz, which gives a time slot of 1 millisecond. NR allows 15, 30, 60 and 120 kHz spacings. Wider spacing means shorter symbols and shorter slots: 0.5 ms at 30 kHz and 0.125 ms at 120 kHz. Shorter slots let the tower schedule data sooner, which is one source of NR's lower latency.

**New frequency ranges.** NR works in two broad ranges that the specifications name FR1 and FR2 (frequency range 1 and 2). FR1 covers the traditional cellular bands up to roughly 7 GHz. FR2 covers millimeter wave, roughly 24 to 52 GHz.

**A new core network.** Behind the towers, 5G can use a new core network built for it. That matters for features such as network slicing and lower latency, and it is where standalone 5G comes in, discussed below.

## Low, mid and high band

Radio behaves differently at different frequencies, and cellular networks use all of them.

| Range | Typical frequencies | Character |
| --- | --- | --- |
| Low band | Below 1 GHz | Travels far and passes through walls. Channels are narrow, so peak speeds are modest. Best for wide-area coverage. |
| Mid band | About 1 to 6 GHz | A balance of reach and capacity. Wider channels (up to 100 MHz for NR) make this the main source of fast 5G in many countries. |
| High band (mmWave) | Roughly 24 GHz and above | Very wide channels and very high peak rates, but short range and easily blocked by walls, foliage, windows and even a hand. |

The same pattern appears in [Wi-Fi bands](/blog/wifi-bands-2-4-5-6-ghz/): the higher the frequency, the more room there is for wide channels, and the less well the signal passes through obstacles. Cellular networks simply apply it over kilometers instead of rooms.

The "5G" on your screen can therefore mean very different things. It may be a low-band NR carrier sharing the same narrow spectrum as the LTE network it replaced, a mid-band carrier 100 MHz wide, or a mmWave link that works only on one street. Many carriers use different status-bar icons for these cases, and the icon wording is a carrier choice, not a technical standard.

## Carrier aggregation: bonding channels together

A single carrier has a width limit, and operators rarely own a single wide block of spectrum. *Carrier aggregation* lets a phone use several carriers at once and treat them as one fatter pipe. In LTE-Advanced, [Rohde & Schwarz's overview](https://www.rohde-schwarz.com/us/solutions/wireless-communications-testing/wireless-standards/lte-lte-a-lte-a-pro/lte-advanced-carrier-aggregation/lte_advanced_carrier_aggregation_73018.html) explains, up to five component carriers of up to 20 MHz each can be combined for up to 100 MHz in total. They can be adjacent in one band, separated within one band, or spread across different bands. The phone keeps one *primary cell* for its main connection, and the others act as *secondary cells* that add capacity.

NR uses the same idea. A phone might combine a low-band carrier, which holds the connection at long range, with a mid-band carrier that supplies most of the speed when signal is good. Which combinations a phone supports is part of its modem's band list, and it varies by model and region.

## Standalone and non-standalone 5G

Not all 5G is built the same way underneath.

- **Non-standalone (NSA).** The phone connects to an LTE tower and an NR tower together. The LTE side handles the signaling and the NR side adds extra data capacity. As the [3GPP overview](https://www.3gpp.org/technologies/5g-system-overview) puts it, NSA uses NR alongside the existing 4G infrastructure, so only 4G services are supported, though they gain NR capabilities such as lower latency.
- **Standalone (SA).** The phone connects to NR towers only, and those towers connect to the new 5G core. 3GPP describes it as the configuration that supports the full set of 5G services.

For a phone user, the practical difference is mostly invisible except in two ways. SA networks do not depend on an LTE anchor, so they can lower latency further and enable features that NSA cannot. And whether your phone can use SA depends on both your carrier's network and the modem's support for it.

## A worked example: how channel width and modulation set a peak rate

The 3GPP capability specification, [TS 38.306](https://portal.3gpp.org/desktopmodules/Specifications/SpecificationDetails.aspx?specificationId=3193), gives an approximate formula for the peak data rate of a phone. We can follow it step by step with one set of values: a single NR carrier in FR1, 100 MHz wide, with 30 kHz subcarrier spacing.

1. **Resource blocks.** For 100 MHz at 30 kHz spacing, the 3GPP tables allow 273 *resource blocks*, each 12 subcarriers wide. That is 273 x 12 = 3,276 subcarriers.
2. **Symbols per second.** A slot holds 14 OFDM symbols. At 30 kHz spacing there are 2 slots per millisecond, so 2,000 slots per second. That gives 14 x 2,000 = 28,000 symbols per second on every subcarrier.
3. **Resource elements per second.** 3,276 x 28,000 = 91,728,000. Each subcarrier-symbol pair, called a resource element, can carry one modulation symbol.
4. **Bits per symbol.** With 256-QAM (quadrature amplitude modulation with 256 symbols, the same idea [Wi-Fi uses](/blog/how-wifi-works/)), each symbol carries 8 bits. 91,728,000 x 8 = 733.8 million bits per second before error correction.
5. **Coding rate.** Some bits are error-correction overhead. The specification caps the code rate at 948/1024, about 0.926. 733.8 x 0.926 = about 679.4 Mbps.
6. **Control and reference overhead.** The specification uses a 14% overhead for downlink in FR1 for signals that carry no user data. 679.4 x 0.86 = about 584 Mbps.

That is the peak for **one spatial layer**, meaning one independent stream. With MIMO (multiple antennas), a phone with four layers could in theory reach 4 x 584 = about 2,337 Mbps, and with two layers about 1,168 Mbps.

Now change one thing. A 20 MHz carrier at 15 kHz spacing has 106 resource blocks and 14,000 symbols per second. The same arithmetic gives 106 x 12 x 14,000 = 17.8 million resource elements per second, which comes to about 113 Mbps per layer. A fifth of the bandwidth gives about a fifth of the rate, because the number of subcarriers is what scales.

Three caveats keep this honest:

- It is a ceiling on paper, assuming a perfect signal and the whole channel dedicated to one phone for downlink.
- Mid-band 5G often uses *TDD* (time-division duplexing), where the same channel alternates between downlink and uplink. The formula does not capture the share of time reserved for uplink, so average downlink is lower.
- Real conditions rarely allow the top modulation. When your signal is weaker, the tower lowers the modulation and code rate automatically, and the rate falls.

## What really decides the speed you see

The peak is rarely the experience. In practice these factors combine:

| Factor | Why it matters |
| --- | --- |
| Band and channel width | Sets the ceiling, as the arithmetic above shows. |
| Signal quality | Measured as signal strength and signal-to-noise. Better signal allows higher modulation and more layers. |
| Number of users on the cell | The tower shares its capacity among everyone active. A busy cell at a stadium or station gives each person a thin slice. |
| Aggregation and antennas | More carriers and more layers raise the ceiling when conditions allow. |
| Backhaul and the internet | The tower's own connection to the core, and the server you talk to, can be slower than the radio link. |
| Plan rules | Carriers can apply priority or throttling by plan, which can cap speed regardless of signal. |

Android exposes some of these measurements to apps; for example, the [CellSignalStrengthLte](https://developer.android.com/reference/android/telephony/CellSignalStrengthLte) API reports reference signal power, quality and signal-to-noise values. A stronger reading generally gives you room for faster modulation, but a strong signal on a crowded cell can still be slow.

### Latency

Latency (the delay before data starts to arrive) depends on more than the radio generation. Short slots, scheduling and, on SA networks, a simpler path through the core can help NR beat LTE. But a request still travels from the tower to the carrier's core and then across the internet to a server, so the number you see is often dominated by the route, not the radio.

## What this means for sending files between your own devices

Cellular speed matters least when you transfer files between devices you own. If both devices are on the same Wi-Fi network, the data never touches the cell tower, so your 5G or LTE speed is irrelevant. That is why moving a large video between two phones in the same room over local Wi-Fi is usually faster than uploading it over cellular and downloading it again.

Uplink is the weak side of cellular. Phones transmit at much lower power than towers do, and TDD networks reserve less time for uplink, so upload speed is usually a fraction of download speed. Sending a big file to a cloud service over mobile data is therefore especially slow. See [local transfer vs cloud upload](/blog/local-transfer-vs-cloud-upload/) for the comparison.

Cellular speed does matter when your phone is the router. With a hotspot, every device you connect shares the phone's single cellular link. [How a phone hotspot works](/blog/how-phone-hotspot-works/) explains the path, and [why phone hotspots are slow](/blog/why-phone-hotspots-are-slow/) shows how to tell whether the cellular side or the Wi-Fi side is the limit.

## Common questions

### Is 5G always faster than LTE?

No. 5G has a higher ceiling, but a low-band 5G carrier on a crowded cell can be slower than a well-aggregated LTE connection on a quiet one. Speed follows channel width, signal and load, not the generation label.

### What does 5G NSA vs SA mean?

NSA (non-standalone) means 5G radio working with an LTE anchor and the old core network. SA (standalone) means 5G radio with the new 5G core and no LTE dependency. SA can support the full set of 5G features; NSA mainly adds capacity and some latency benefit.

### Why is my 5G slower than my friend's?

Different phones support different bands and carrier aggregation combinations, and you may be on a different carrier, cell or plan. Even identical phones in the same room can see different speeds if they hold different signal quality or priority.

### Does millimeter wave work indoors?

Usually not well. mmWave signals are easily blocked by walls, windows and foliage, so it generally works only in line of sight with a nearby small cell. Many 5G phones sold outside certain countries do not have mmWave hardware at all.

### Is LTE going away?

Not soon. Many networks still rely on LTE for coverage and for the NSA anchor, and plenty of phones use LTE for voice. Carriers retire old generations on their own schedules, which differ by country and operator.

## Key takeaways

- LTE and 5G NR both use OFDM and tower-scheduled time slots; NR adds wider channels, flexible timing and new frequency ranges.
- Low band reaches far, mid band balances reach and speed, and mmWave is very fast but short range.
- Carrier aggregation combines several carriers into one wider pipe, and standalone 5G runs on a new core instead of an LTE anchor.
- Peak rate on paper follows from subcarriers x symbols x bits per symbol x coding x layers, minus overhead: about 584 Mbps per layer for a 100 MHz carrier at 30 kHz spacing.
- The "5G" icon is not a speed guarantee; band, channel width, signal, load and plan rules decide what you get.
- Local Wi-Fi transfers ignore cellular speed entirely, while hotspots depend on it completely.

## Sources

- 3GPP: [5G System Overview](https://www.3gpp.org/technologies/5g-system-overview)
- 3GPP: [TS 38.306, NR User Equipment radio access capabilities](https://portal.3gpp.org/desktopmodules/Specifications/SpecificationDetails.aspx?specificationId=3193)
- Rohde & Schwarz: [LTE-Advanced carrier aggregation](https://www.rohde-schwarz.com/us/solutions/wireless-communications-testing/wireless-standards/lte-lte-a-lte-a-pro/lte-advanced-carrier-aggregation/lte_advanced_carrier_aggregation_73018.html)
- Android Developers: [CellSignalStrengthLte](https://developer.android.com/reference/android/telephony/CellSignalStrengthLte)
