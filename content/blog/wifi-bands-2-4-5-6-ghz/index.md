---
title: "Wi-Fi Bands Compared: 2.4 GHz vs 5 GHz vs 6 GHz"
description: "Why 2.4 GHz reaches farther and 6 GHz is cleaner and faster: the path-loss arithmetic, walls, interference, 5 GHz radar rules and what 6 GHz needs."
topic: "wifi-basics"
order: 3
publishDate: 2026-10-23
heroImage: "./images/diagram.svg"
heroAlt: "Bar chart of free-space path loss at 10 meters: 60.0 dB at 2.4 GHz, 66.4 dB at 5 GHz and 68.0 dB at 6 GHz, with the extra loss highlighted"
related:
  - "wifi-channels-and-channel-width"
  - "wifi-standards-explained"
  - "wifi-link-speed-vs-real-speed"
  - "client-isolation-guest-networks-and-device-visibility"
---

A Wi-Fi band is a block of radio frequencies, and the frequency you use trades range for capacity. 2.4 GHz reaches farthest and through the most walls but is crowded and slow. 5 GHz has more room and more speed with shorter reach. 6 GHz has the most room and the cleanest air, but it reaches least far and only works with newer devices.

**Short answer:** higher frequencies lose more signal per meter and get absorbed more by walls, so range falls from 2.4 GHz to 5 GHz to 6 GHz. The same physics that shortens range also lets higher bands hold wider channels and fewer neighbors. Which band is best depends on distance, obstacles and what your devices support.

## The three bands at a glance

| | 2.4 GHz | 5 GHz | 6 GHz |
| --- | --- | --- | --- |
| Frequency range | 2.400 to 2.4835 GHz | roughly 5.15 to 5.85 GHz | 5.925 to 7.125 GHz where permitted |
| Wavelength | about 12.5 cm | about 6 cm | about 5 cm |
| Width of the band | about 83 MHz | several hundred MHz in pieces | up to 1,200 MHz (US) |
| Non-overlapping 20 MHz channels | 3 in the US | roughly two dozen, varies by country | 59 in the US |
| Needs | any Wi-Fi device | Wi-Fi 4 and newer, plus 802.11a | Wi-Fi 6E or Wi-Fi 7 |

Exact channel counts depend on the country. Rules differ: the United States opened the whole 1,200 MHz of 6 GHz, while some other regions opened only part of it. The [Wi-Fi Alliance's 6E announcement](https://www.wi-fi.org/news-events/newsroom/wi-fi-alliance-delivers-wi-fi-6e-certification-program) notes that several countries have taken different decisions. How channels are laid out inside each band is the subject of [Wi-Fi channels and channel width](/blog/wifi-channels-and-channel-width/).

## Why a higher frequency means less range

The common explanation, that "high frequencies get absorbed by air," is mostly wrong at Wi-Fi distances. The main effect is simpler. A receiving antenna of a given gain captures less of a passing wave as the wavelength shrinks. In free space, the loss between two antennas of fixed gain is:

**FSPL (dB) = 20 × log10(distance) + 20 × log10(frequency) + a constant**

*FSPL* means free-space path loss, which is the loss in empty space with nothing in the way. Only the frequency term differs between bands, so the *extra* loss going from 2.4 GHz to 5 GHz at the same distance is:

1. Take the frequency ratio: 5 ÷ 2.4 = 2.083.
2. Take the base-10 logarithm: log10(2.083) = 0.3188.
3. Multiply by 20: 20 × 0.3188 = **6.4 dB**.

A decibel (dB) is a ratio on a logarithmic scale, and 6.4 dB means about 4.3 times less power arrives (10^0.638 = 4.3). For 6 GHz the same steps give 20 × log10(6 ÷ 2.4) = 20 × 0.398 = **8.0 dB**, about 6.3 times less power than at 2.4 GHz.

Here are the absolute figures at 10 meters, using the standard form FSPL = 20·log10(d in meters) + 20·log10(f in MHz) − 27.55:

| Band | Loss at 10 m |
| --- | --- |
| 2.4 GHz | 20 + 67.6 − 27.55 = about 60.0 dB |
| 5 GHz | 20 + 74.0 − 27.55 = about 66.4 dB |
| 6 GHz | 20 + 75.6 − 27.55 = about 68.0 dB |

You can turn the 6.4 dB into distance. Free-space loss grows by 20 dB for every tenfold increase in distance, so 6.4 dB equals a distance factor of 10^(6.4/20) = 2.08, which is just the ratio 5 ÷ 2.4 again. To suffer the same free-space loss, a 5 GHz link must be about 48 percent as long as a 2.4 GHz link. That is a theoretical comparison with equal antennas and power. Real routers add more antenna gain and different power limits per band, so treat it as the direction and rough size of the effect, not a range guarantee.

## Walls, floors and furniture

Indoors, free-space loss is only the start. Every wall adds its own loss by absorbing, reflecting and scattering the signal, and that added loss is generally larger at higher frequencies. Short waves also bend around corners (*diffraction*) less than long ones, so shadow zones behind obstacles are deeper at 5 and 6 GHz.

Materials matter more than the band. Drywall and wood cost little. Brick, concrete, metal foil insulation, mirrors and water (a fish tank, a bathroom full of pipes, a crowd) cost much more. Microsoft's [Wi-Fi and your home layout](https://support.microsoft.com/en-us/windows/experience/connectivity-networking/wi-fi-and-your-home-layout) page says the same in plain terms: 2.4 GHz goes through obstacles better, 5 GHz reaches less far but is less congested. Published measurements of loss per wall vary widely with construction, so any single "dB per wall" figure should be treated skeptically.

## Interference: who else is on your band

Signal strength is half the story. The other half is noise from anything else transmitting on the same frequencies.

- **2.4 GHz** is license-free for far more than Wi-Fi. Microwave ovens operate near 2.45 GHz, and the leakage from a running oven can degrade nearby Wi-Fi. Bluetooth uses the same band. Classic Bluetooth hops across 79 channels of 1 MHz each and is designed to avoid busy ones, but a busy Bluetooth environment still adds noise. Cordless phones, baby monitors and some smart-home radios also use it. With only three non-overlapping channels in the US, neighboring Wi-Fi networks collide often.
- **5 GHz** has no microwave or Bluetooth interference, and many more channels, but part of it is shared with radar (see below).
- **6 GHz** is, for now, the quietest band, because only newer devices use it. As adoption grows, it will fill up, though there is much more room.

## 5 GHz and radar: what DFS does

Part of the 5 GHz band is shared with weather and other radar systems. To protect them, the rules require *dynamic frequency selection* (DFS) on those channels. In the United States the affected ranges are roughly 5.25 to 5.35 GHz and 5.47 to 5.725 GHz. A router using a DFS channel must:

1. **Listen for radar before starting.** The FCC's rules (see the [Federal Register corrections to the 5 GHz rules](https://www.govinfo.gov/content/pkg/FR-2014-09-24/html/2014-22677.htm)) call for a check of at least 60 seconds before using a channel.
2. **Leave if it hears radar.** It must stop transmitting on the channel within 10 seconds.
3. **Stay away afterwards.** The channel is off limits for at least 30 minutes.

Those figures are the US ones; other regions, such as Europe, have different timings and some longer checks. In practice, DFS shows up as a router that takes a minute to start its 5 GHz network after a reboot, or a 5 GHz network that briefly drops and returns on a different channel. If you live near an airport or weather radar, DFS channels may be unreliable, and a router may avoid them by default.

## What 6 GHz needs

6 GHz is not a drop-in speed-up. Using it requires several things:

- **Devices that support it.** Only Wi-Fi 6E and Wi-Fi 7 devices can use the band. Phones, laptops and routers from before that cannot see a 6 GHz network at all. If your device does not list 6 GHz, it simply will not connect there. [Wi-Fi standards explained](/blog/wifi-standards-explained/) shows which generations qualify.
- **Modern security.** Under Wi-Fi Alliance certification, 6 GHz networks use WPA3 (or the Enhanced Open mode for open networks). Older WPA2-only devices cannot join even if the radio could. [WPA2 and WPA3 explained](/blog/wifi-security-wpa2-wpa3-explained/) covers why.
- **Compliance with power-mode rules.** Regulators protect existing licensed users of the band, such as fixed microwave links. In the US there are three modes, described here at a high level. *Low-power indoor* devices may use the whole band but only inside buildings and at reduced power. *Standard-power* devices may use only parts of it and must ask an *automated frequency coordination* (AFC) service, a database that tells them which channels and power levels are safe at their location. *Very-low-power* devices can be used anywhere at even lower power. Most home routers run in low-power indoor mode. Other countries have their own rules and sometimes open less spectrum.

Because of these limits, 6 GHz delivers its best results across one room or two, not through several concrete walls.

## Band steering, and one SSID or two

Most routers broadcast the same network name (the SSID, or service set identifier) on multiple bands. Two mechanisms help devices choose:

- **Band steering** is the router nudging a dual-band device towards the faster band, for instance by not answering its 2.4 GHz probes or by suggesting a move using a standard message (802.11v transition management). It works when the device cooperates, and some devices ignore the nudge.
- **The final choice stays with the device.** The router can suggest a band, but the phone or laptop decides which one to join.

There is a trade-off in naming:

| Approach | Advantage | Drawback |
| --- | --- | --- |
| One SSID for all bands | Simple, devices move between bands automatically | You cannot choose a band; some devices cling to 2.4 GHz after moving closer |
| Separate SSIDs per band | You pick the band for each device | More names to manage, no automatic switching |

A practical split many people use is one name for 5 and 6 GHz capable devices and a separate 2.4 GHz name for old smart-home gadgets that only speak 2.4 GHz. Whatever you choose, all bands normally join the same local network.

## What this means when you send files between your own devices

Your phone and your laptop can be on different bands of the same router and still be on the same local network. The router bridges between them, so a transfer works, but the pair is only as fast as the weaker connection. If your phone has attached itself to 2.4 GHz at the far end of the house while your laptop is on 5 GHz, the phone's link sets the pace. Moving closer to the router, or forcing the phone onto 5 GHz by choosing a separate network name, often changes the result more than any other tweak.

6 GHz adds a wrinkle. A device on a 6 GHz-only name and a device that cannot use 6 GHz may end up on different networks if the router puts 6 GHz on its own SSID. If two devices on the "same Wi-Fi" cannot see each other, check that they are on the same network name and not a guest network; [client isolation and guest networks](/blog/client-isolation-guest-networks-and-device-visibility/) explains why guest networks block device-to-device traffic, and [what to do when devices cannot find each other](/blog/devices-cant-find-each-other-troubleshooting/) gives a checklist. To see how band and signal strength turn into real transfer speeds, read [Wi-Fi link speed vs real speed](/blog/wifi-link-speed-vs-real-speed/).

## Common questions

### Is 5 GHz always faster than 2.4 GHz?

No. 5 GHz allows wider channels and has less interference, so it is usually faster at close range. At long range, or through several walls, a weak 5 GHz signal can drop to a lower speed than a strong 2.4 GHz one. The best band is the one with a strong, clean signal where you are.

### Why does my router take so long to start its 5 GHz network?

If it is on a DFS channel, it must listen for radar for at least a minute before transmitting on it in the US. After a reboot, 2.4 GHz appears first and 5 GHz joins later. Choosing a non-DFS channel in the router's settings removes the wait, though the exact options vary by router.

### Can my phone use 6 GHz?

Only if it supports Wi-Fi 6E or Wi-Fi 7. The device's specifications or Wi-Fi information usually list the supported bands; the exact place varies by phone and software version. Even then, you need a router that broadcasts a 6 GHz network.

### Should I use the same name for 2.4 and 5 GHz?

A single name is the simplest choice and works well for most households. Use separate names if an older device keeps connecting to the slow band or a gadget will not join a combined network.

### Do microwave ovens really interfere with Wi-Fi?

They can. Ovens operate near 2.45 GHz, and a running one can leak noise into nearby 2.4 GHz channels, usually for as long as it runs. Moving the affected devices to 5 GHz avoids it.

## Key takeaways

- Free-space loss rises by 20 × log10 of the frequency ratio: 6.4 dB more at 5 GHz than 2.4 GHz and 8.0 dB more at 6 GHz.
- Walls add more loss at higher frequencies, but material matters more than band.
- 2.4 GHz is crowded by neighbors, microwave ovens and Bluetooth; 5 GHz must yield to radar on DFS channels; 6 GHz is cleaner but needs Wi-Fi 6E or 7 and WPA3.
- Band steering is a suggestion, not control; a single name is simplest, separate names give you control.
- Two devices on different bands of one router can still exchange files, but the slower connection sets the pace.

## Sources

- Wi-Fi Alliance: [Wi-Fi Alliance delivers Wi-Fi 6E certification program](https://www.wi-fi.org/news-events/newsroom/wi-fi-alliance-delivers-wi-fi-6e-certification-program)
- Microsoft Support: [Wi-Fi and your home layout](https://support.microsoft.com/en-us/windows/experience/connectivity-networking/wi-fi-and-your-home-layout)
- US Federal Register: [Unlicensed National Information Infrastructure (U-NII) Devices in the 5 GHz Band; Correcting Amendments](https://www.govinfo.gov/content/pkg/FR-2014-09-24/html/2014-22677.htm)
- Wi-Fi Alliance: [Wi-Fi (MAC/PHY) features](https://www.wi-fi.org/wi-fi-macphy)
