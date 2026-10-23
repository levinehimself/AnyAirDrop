---
title: "Bluetooth File Transfer Explained: Speeds, Profiles and Why It's Slow"
description: "How Bluetooth sends files with OBEX over RFCOMM, why 3 Mbps on the box becomes minutes per 100 MB, and why phones use it only to find each other before Wi-Fi."
topic: "local-transfer-tech"
order: 4
publishDate: 2026-10-23
heroImage: "./images/diagram.svg"
heroAlt: "Diagram of Bluetooth file transfer time: the same 100 MB file takes several minutes at Bluetooth speeds but seconds over Wi-Fi, so Bluetooth is used to find the device and Wi-Fi to send"
related:
  - "nfc-explained"
  - "how-quick-share-works"
  - "wifi-direct-wifi-aware-awdl-explained"
  - "how-airdrop-works"
---

Bluetooth can send files, but slowly: its radio is built for low power and short messages, not bulk data, and sending 100 MB can take many minutes even when the speed on the spec sheet sounds generous. That is why modern phones use Bluetooth mainly to find each other and agree on a connection, then move the actual file over Wi-Fi.

**Short answer:** Bluetooth comes in two radio systems, Classic and Low Energy. Classic sends files through a stack of protocols (RFCOMM, then OBEX, then a profile such as Object Push) at roughly 1 to 2 megabits per second in practice. Low Energy is even more limited and is used for discovery and small data. Wi-Fi is typically tens of times faster or more, so nearby-sharing features hand the file over to it.

## Two radios under one name

"Bluetooth" is two separate radio technologies that share a name and a frequency band. The [Bluetooth SIG](https://www.bluetooth.com/learn-about-bluetooth/tech-overview/), the industry group that maintains the standard, lists them as follows:

| | Classic (BR/EDR) | Low Energy (LE) |
| --- | --- | --- |
| Band | 2.4 GHz ISM (2.402 to 2.480 GHz used) | Same |
| Channels | 79 channels, 1 MHz apart | 40 channels, 2 MHz apart (3 for advertising, 37 for data) |
| Raw rates | 1 Mb/s (basic rate), 2 Mb/s and 3 Mb/s (EDR) | 1 Mb/s (1M PHY), 2 Mb/s (2M PHY), plus slower long-range modes |
| Typical use | Audio streaming, mobile printing, file transfer | Sensors, wearables, beacons, discovery |

BR/EDR stands for *Basic Rate / Enhanced Data Rate*. The basic rate is 1 Mb/s. The enhanced rates use a denser modulation (called π/4 DQPSK for 2 Mb/s and 8DPSK for 3 Mb/s) to pack more bits into each radio symbol. In LE, the *PHY* (physical layer) is the radio mode; the 1M PHY and 2M PHY run at 1 and 2 Mb/s.

Both radios use *frequency hopping*: the connection jumps among channels many times a second so that interference on any one frequency harms only a fraction of the data. That same 2.4 GHz band is shared with Wi-Fi's 2.4 GHz channels, which is why the two have to coexist; [Wi-Fi bands compared](/blog/wifi-bands-2-4-5-6-ghz/) covers that crowding.

## Why raw speed is not real speed

A "3 Mb/s" label describes how fast bits are pushed onto the air while the radio is transmitting. A file only gets what is left after overhead is subtracted:

- Each radio packet carries headers and error-checking bits, plus gaps for the other side to reply.
- Classic Bluetooth divides time into very short slots and alternates between sending and receiving, so the channel is not used for sending all the time.
- Lost packets are retransmitted.
- Higher protocol layers, such as RFCOMM and OBEX described below, add their own headers.

Commonly cited figures put the best-case usable rate of Classic EDR at about 2.1 Mb/s for the 3 Mb/s mode, and everyday transfers between real phones tend to come in lower than that. Treat 2.1 as a ceiling on paper, not as something to expect. For LE, practical throughput depends on connection settings and the phone, and is generally lower than the raw 1 or 2 Mb/s.

### A worked example: 100 MB at Bluetooth speeds

A 100 MB file contains 100 × 1,000,000 bytes × 8 bits = 800,000,000 bits, or 800 megabits (Mb). Time is size divided by rate:

| Sustained rate | Calculation | Time |
| --- | --- | --- |
| 3 Mb/s (raw EDR, not reachable in practice) | 800 ÷ 3 = 266.7 s | about 4 min 27 s |
| 2.1 Mb/s (best-case usable EDR, on paper) | 800 ÷ 2.1 = 381 s | about 6 min 21 s |
| 1 Mb/s (a modest real-world rate) | 800 ÷ 1 = 800 s | 13 min 20 s |
| 0.5 Mb/s (a poor connection) | 800 ÷ 0.5 = 1,600 s | 26 min 40 s |
| 100 Mb/s over Wi-Fi (illustrative) | 800 ÷ 100 = 8 s | 8 s |

The Wi-Fi row is illustrative: real Wi-Fi rates vary widely, as [Wi-Fi link speed vs real speed](/blog/wifi-link-speed-vs-real-speed/) explains. The comparison is the point. The same file takes minutes on Bluetooth and seconds on Wi-Fi.

## Why Wi-Fi is so much faster

Radio capacity depends heavily on how much spectrum a signal occupies. A Classic Bluetooth channel is 1 MHz wide, and an LE channel is 2 MHz wide. A single Wi-Fi channel is typically at least 20 MHz wide and can be widened to 80 or 160 MHz, as described in [Wi-Fi channels and channel width](/blog/wifi-channels-and-channel-width/). Wi-Fi also uses denser modulation and can send several streams at once. Bluetooth deliberately gives all that up in return for low power use and simple, cheap chips.

## How a classic Bluetooth file transfer works

When you choose "send via Bluetooth" on an older phone or a laptop, several layers cooperate:

1. **Pairing.** The two devices exchange keys so they can recognize each other and encrypt their traffic (explained below).
2. **A serial link.** Classic Bluetooth provides *RFCOMM*, a protocol that emulates a simple serial cable. It gives programs a plain stream of bytes between the two devices.
3. **OBEX.** The Object Exchange protocol (OBEX), which originated in infrared transfers and was adopted by Bluetooth, runs on top of RFCOMM. It defines requests such as connect, put and get, and describes an object (a file, a contact, a calendar entry) with a name, type and length.
4. **A profile.** A *profile* is a Bluetooth specification that fixes how a particular job is done so devices from different makers interoperate. The Bluetooth SIG says its [Object Push Profile](https://www.bluetooth.com/specifications/specs/object-push-profile-1-2-1/) defines the application requirements for devices to support the Object Push usage model: pushing items from one device to another. A related File Transfer Profile (FTP, not to be confused with the internet's file transfer protocol) lets a device browse and pull files too.

When you tap Accept on the receiving device, the sender's OBEX client issues a put request, and the receiver stores the object. The speed limit is that of the underlying Classic link plus the overhead of the layers above it.

## Pairing and security

Before sensitive traffic is exchanged, two Bluetooth devices *pair*. The specifications define several pairing methods. In some, both screens show a number that you confirm matches; in others, one device displays a passkey and you type it on the other; a "just works" method skips user verification, which is convenient but gives no protection against someone intercepting the pairing in the moment it happens. After pairing, the devices store keys (called *bonding*) and encrypt the link.

The practical advice is general: only accept pairing requests you started, and decline unexpected file transfers. The Bluetooth SIG says its [specifications include security features](https://www.bluetooth.com/learn-about-bluetooth/key-attributes/bluetooth-security/) that developers can use to choose a suitable security level, and publishes guides on the topic.

## Why nearby sharing uses Bluetooth only to find the other device

Bluetooth Low Energy has two strengths that matter for sharing: it uses very little power, and a device can send out small *advertisements* on three dedicated advertising channels without any connection. A phone can keep listening for them in the background without draining its battery quickly. This is how Apple's feature and Google's feature learn that somebody nearby wants to share, as laid out in [how Apple's AirDrop works](/blog/how-airdrop-works/) and [how Quick Share works](/blog/how-quick-share-works/).

Bluetooth then does a second useful thing: it carries the small first messages that let the two devices agree on a faster channel, for example the details of a Wi-Fi link. After that, the heavy data moves over Wi-Fi, often a direct link of the kind covered in [Wi-Fi Direct, Wi-Fi Aware and AWDL](/blog/wifi-direct-wifi-aware-awdl-explained/). The result combines Bluetooth's cheap, always-on discovery with Wi-Fi's speed.

## Why iPhones do not exchange files with other platforms over Bluetooth

Apple's [list of Bluetooth profiles supported by iOS and iPadOS](https://support.apple.com/en-us/102842) includes profiles for hands-free calling, audio streaming, remote control, phone book and message access, personal area networking and input devices. It does not include the Object Push Profile or the File Transfer Profile, so an iPhone has no standard Bluetooth route for sending or receiving a file with an Android phone or Windows PC. Apple's page does not explain the reason, and it does not say anything about plans, so we can describe the result but not the motive.

Apple's own sharing feature works between Apple devices, using Bluetooth for discovery and a direct Wi-Fi link for the file. For other combinations, the usual routes are a shared Wi-Fi network, a cable, or cloud storage.

## What this means for sending files between your own devices

If you just want a file from one of your devices to another, Bluetooth is rarely the right transport. It is useful for small items such as a contact card or a short document, and for devices that have nothing else in common, such as an older phone and a basic laptop. For photos, videos and folders, use a method that moves the data over Wi-Fi: a built-in nearby-sharing feature, or a tool that works through a browser on the same network. AnyAirDrop.com is our own example of the latter: devices on the same Wi-Fi network find each other and send the file directly, with no Bluetooth pairing involved. The practical steps for phone-to-PC transfers are in [transferring files between a PC and a phone over Wi-Fi](/blog/transfer-files-between-pc-and-phone-over-wifi/).

## Common questions

### How fast is Bluetooth file transfer?

On paper, Classic Bluetooth tops out at 3 Mb/s raw, with roughly 2.1 Mb/s usable at best, and real transfers are often below that. At 1 Mb/s, a 100 MB file takes about 13 minutes. Bluetooth Low Energy is not normally used for large files.

### Is Bluetooth 5 faster than older versions?

Newer versions added the LE 2M PHY, which doubles the raw LE rate to 2 Mb/s, and other improvements, but Classic EDR still tops out at 3 Mb/s. Newer versions help most with range, power and reliability, not with turning Bluetooth into a file-transfer rival to Wi-Fi.

### Can I send files from an iPhone to an Android phone over Bluetooth?

Not with a standard Bluetooth file transfer. Apple's published list of supported profiles has no Object Push or File Transfer entry. Use a shared Wi-Fi network, a cable, cloud storage, or Quick Share's announced AirDrop interoperability on supported phones.

### Is Bluetooth file transfer secure?

Bluetooth links are encrypted after pairing, but security depends on how pairing was done and which version and mode the devices use. Pair only with devices you recognize, decline unexpected requests, and switch Bluetooth off or limit visibility when you are not using it.

### Why does my phone need Bluetooth for AirDrop or Quick Share when it uses Wi-Fi for the file?

Bluetooth does the discovery. It is cheap enough to leave scanning, and it lets the devices announce themselves and negotiate a faster link. Without it, the Wi-Fi link would not start. Google's help page for Quick Share says Bluetooth must be on, and Apple's AirDrop page asks for both Wi-Fi and Bluetooth.

## Key takeaways

- Bluetooth is two radios, Classic (BR/EDR) and Low Energy, with raw rates of 1 to 3 Mb/s and 1 to 2 Mb/s respectively.
- Real throughput is lower than the raw rate because of headers, retransmissions, time slots and protocol layers.
- At about 1 Mb/s, 100 MB takes roughly 13 minutes; at a best-case 2.1 Mb/s, about 6 minutes; over a decent Wi-Fi link, seconds.
- Classic file transfer stacks RFCOMM, OBEX and a profile such as Object Push.
- Nearby sharing uses Bluetooth LE for discovery and negotiation, then hands the file to Wi-Fi.
- Apple's published Bluetooth profile list for iOS and iPadOS has no Object Push or File Transfer profile.

## Sources

- Bluetooth SIG: [Bluetooth technology overview](https://www.bluetooth.com/learn-about-bluetooth/tech-overview/)
- Bluetooth SIG: [Object Push Profile specification](https://www.bluetooth.com/specifications/specs/object-push-profile-1-2-1/)
- Bluetooth SIG: [Bluetooth security](https://www.bluetooth.com/learn-about-bluetooth/key-attributes/bluetooth-security/)
- Apple Support: [Bluetooth profiles that iOS and iPadOS support](https://support.apple.com/en-us/102842)
