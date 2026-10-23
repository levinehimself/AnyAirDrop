---
title: "Wi-Fi Direct vs Wi-Fi Aware vs AWDL: How Router-Free Wi-Fi Works"
description: "Wi-Fi Direct, Wi-Fi Aware and Apple's AWDL let two devices talk over Wi-Fi with no router. How each one connects, shares the radio, and which platforms support it."
topic: "local-transfer-tech"
order: 3
publishDate: 2026-10-23
heroImage: "./images/diagram.svg"
heroAlt: "Diagram comparing a normal Wi-Fi path, where two phones talk through a router, with a direct path used by Wi-Fi Direct, Wi-Fi Aware and AWDL"
related:
  - "how-airdrop-works"
  - "how-quick-share-works"
  - "bluetooth-file-transfer-explained"
  - "how-wifi-works"
---

Wi-Fi Direct, Wi-Fi Aware and AWDL (Apple Wireless Direct Link) are three different ways of letting two devices use Wi-Fi radios to talk to each other with no router in between. They exist because the usual arrangement, where every message goes up to an access point and back down, wastes airtime and requires a network that both devices have joined.

**Short answer:** all three create a direct Wi-Fi link between nearby devices. Wi-Fi Direct makes one device act as a mini access point, Wi-Fi Aware lets devices find each other by publishing and subscribing to named services, and AWDL is Apple's own scheme that hops between channels so the radio can serve both a router and a nearby device. Which one is available depends on the phones involved.

## The problem they solve

In a normal Wi-Fi network, described in [how Wi-Fi works](/blog/how-wifi-works/), your devices are *stations* and the router is the *access point*. Stations never talk to each other directly. A photo from one phone to another goes to the access point first and from there to the second phone. This has three costs:

- **Both devices must be on the same network.** On a train, in a park or on a hotel network that blocks device-to-device traffic (see [client isolation](/blog/client-isolation-guest-networks-and-device-visibility/)), that is not possible.
- **The data crosses the air twice.** Each hop uses airtime on the same channel, so the effective transfer speed is roughly halved.
- **Discovery needs help.** Devices have to find each other through the router's network, using techniques such as [mDNS](/blog/mdns-bonjour-device-discovery/).

Peer-to-peer Wi-Fi removes all three. The price is complexity: the radio has to be shared between talking to the router and talking to a neighbor, and some device has to coordinate. The three technologies differ mainly in how they solve those two problems.

### A worked example of the "twice" cost

Imagine a single Wi-Fi link that can carry 400 megabits per second (Mbit/s) of real data in one direction when the channel is otherwise quiet. The number is illustrative, not a measurement.

- **Through a router:** the phone sends to the access point (one transmission on the channel), then the access point sends to the other phone (a second transmission on the same channel). Both transmissions share the same airtime, so the useful rate is about 400 ÷ 2 = 200 Mbit/s. A 1 GB file is 8,000 megabits, so it takes about 8,000 ÷ 200 = 40 seconds.
- **Direct:** the data crosses the air once. At 400 Mbit/s the same file takes about 8,000 ÷ 400 = 20 seconds.

Real results vary with signal, interference, chipsets and how the radio is shared, as explained in [Wi-Fi link speed vs real speed](/blog/wifi-link-speed-vs-real-speed/). The point is the factor of two that comes from taking the access point out of the middle.

## Wi-Fi Direct: one device becomes the access point

Wi-Fi Direct is a certification from the Wi-Fi Alliance. According to the [Wi-Fi Alliance](https://www.wi-fi.org/discover-wi-fi/wi-fi-direct), there is no need for an access point: devices can connect one-to-one or form a group of several devices, and users can see available devices and either request a connection or accept an invitation.

Technically, the trick is that one device in the pair takes on the access point role. The specification calls it the *group owner*. The others are *clients*. When two devices connect:

1. **Discovery.** Each device announces itself and listens for others, using ordinary 802.11 frames that carry extra information elements.
2. **Negotiation.** The devices run a *group owner negotiation*. Each states how much it wants the job through a numeric "intent" value (0 to 15 in the specification) and the higher value becomes group owner. [Android's documentation](https://developer.android.com/develop/connectivity/wifi/wifi-direct) says the choice is based on each device's power management, user interface and service capabilities, so the device best able to act as a server is selected.
3. **Group creation and security.** The group owner starts a small network of its own. Android's documentation says Wi-Fi Direct supports WPA2 encryption, and its example code asks for push-button style setup.
4. **IP networking.** The group owner hands out IP addresses, much like a router, and the apps use ordinary sockets over it.

The group owner design has a useful side effect: a device without Wi-Fi Direct support can join the group as a *legacy client*, because to it the group owner looks like a regular access point. Android lets an app create a group manually and share the passphrase for that reason, and Windows has a matching `WiFiDirectLegacySettings` option in its [Wi-Fi Direct API](https://learn.microsoft.com/en-us/uwp/api/windows.devices.wifidirect).

On the downside, Wi-Fi Direct is not designed to be invisible. On Android the user is often asked to confirm a connection and a group exists until it is torn down. Many phones can hold a normal Wi-Fi connection and a Wi-Fi Direct group at the same time, but how well they do it depends on the chipset and software.

## Wi-Fi Aware: discovery by publish and subscribe

Wi-Fi Aware, also known as NAN (Neighbor Awareness Networking), starts from a different question: how can devices find a *service* nearby, cheaply, before deciding to connect? The [Wi-Fi Alliance](https://www.wi-fi.org/discover-wi-fi/wi-fi-aware) describes it as independent device-to-device Wi-Fi connections that work without traditional network infrastructure or an internet connection.

[Android's developer guide](https://developer.android.com/develop/connectivity/wifi/wifi-aware) explains the model:

- **Clusters.** Devices that support Aware form or join a *cluster* with their neighbors, or start one if they are first. The system manages clustering, and apps cannot control it. Devices in a cluster stay time-synchronized, so they wake briefly at agreed moments to exchange discovery messages instead of keeping the radio on.
- **Publish and subscribe.** A publisher advertises a named service. A subscriber listens for that name and is told when a match comes into range. A device can do both.
- **Messages.** Small messages, limited to about 255 bytes, can be exchanged during discovery.
- **Data path.** When a subscriber and publisher decide to connect, they request a network. The publisher opens a server socket, and the subscriber connects to the publisher's IPv6 address and port. A passphrase can protect the link.

In effect, Wi-Fi Aware separates *finding* from *transferring*: discovery uses little power and happens continuously in a cluster, and a high-throughput data link is created only when needed. That makes it similar to the Bluetooth-then-Wi-Fi pattern used by [Quick Share](/blog/how-quick-share-works/), but the finding part happens over Wi-Fi.

Wi-Fi Aware is a standard maintained by the Wi-Fi Alliance, so in principle phones, laptops and accessories from different makers can interoperate. In practice, support depends on the hardware and the operating system.

## AWDL: Apple's channel-hopping link

AWDL is a proprietary protocol that Apple created for its own devices. Apple's technical note TN3111 calls its version "Apple peer-to-peer Wi-Fi", says it dates back to iOS 7 and works on all of its device platforms, and says it is not documented for third-party use, so it works only between Apple devices. Most of what is publicly known about the protocol comes from reverse engineering. A [USENIX Security 2019 paper](https://www.usenix.org/conference/usenixsecurity19/presentation/stute) describes it as a proprietary ad hoc protocol based on IEEE 802.11.

The core of AWDL is channel hopping:

- Time is divided into *availability windows*. For each one, a device declares whether it is available for direct communication and on which channel.
- That channel can be the one its router uses, or one of AWDL's *social channels*, which the paper lists as 6, 44 and 149.
- Each device announces a sequence of 16 windows. Each window is 64 time units long (a time unit is 1,024 microseconds), so a full sequence lasts about a second: 16 × 64 × 1.024 ms is roughly 1.05 seconds.
- Devices elect a master, and use its frames as the clock, so two nearby devices can arrange to be on the same channel at the same time.

This lets one Wi-Fi radio serve two masters. For part of each second it sits on your router's channel, so your internet connection continues, and for another part it sits on an AWDL channel, so a nearby iPhone can reach it. Apple's AirDrop uses it, as described in [how Apple's AirDrop works](/blog/how-airdrop-works/). The cost is that the radio is only on each channel part of the time, so a transfer cannot use all the airtime, and the router connection has gaps.

## The three side by side

| | Wi-Fi Direct | Wi-Fi Aware (NAN) | AWDL |
| --- | --- | --- | --- |
| Who defines it | Wi-Fi Alliance | Wi-Fi Alliance | Apple (proprietary) |
| How devices connect | One becomes group owner (software access point) | Clustered devices publish and subscribe, then open a data path | Synchronized channel hopping between devices |
| Finding other devices | Probe and listen with extra information elements | Time-synchronized discovery windows in a cluster | Frames announcing availability windows, plus mDNS for services |
| Works with a router at the same time | Often, depending on hardware | Designed to coexist; limits vary by device | Yes, by hopping between channels |
| Open to apps from any maker | Yes, on Android and Windows | Yes, on Android and iOS | No, Apple devices only |

## Which platforms support what

Support changes as phones and software update, so treat this as a snapshot and check your own device:

- **Android** has had Wi-Fi Direct for many years through its `WifiP2pManager` interface. Wi-Fi Aware is available from Android 8.0 (API level 26), though a given phone also needs the hardware and software for it.
- **Windows 10 and 11** have Wi-Fi Direct APIs, as shown in Microsoft's documentation.
- **iPhone and iPad:** Apple's TN3111 says support for Wi-Fi Aware was introduced in iOS 26 and is available on iPhone 12 and later, and the note says this opens up communication with non-Apple devices and accessories. Apple's WWDC25 session on the framework says it operates alongside your regular Wi-Fi connection and is described as cross-platform. AWDL remains Apple-only.
- Whether a particular app uses any of these is up to the app developer. A phone with the hardware does not automatically get a feature.

## What this means for sending files between your own devices

Direct links are the reason phone-to-phone sharing can be fast with no internet and no shared network. They are also why such features often work only inside a platform family: Apple's AirDrop uses AWDL, and Android's Quick Share can choose from several mediums, including Wi-Fi Direct. The addition of Wi-Fi Aware to iOS 26 gives iPhones an industry-standard direct Wi-Fi mechanism that Android also supports, but whether a given app takes advantage of it is a separate matter. Treat claims about cross-platform direct sharing carefully until they are described in primary documentation.

When the devices are on the same Wi-Fi network and that network lets them see each other, you do not need direct radio links at all, and a browser-based tool can use the network you already have. AnyAirDrop.com is our own tool that does this: both devices open a page on the same Wi-Fi network and files go directly between them. When the network blocks device-to-device traffic, a direct link such as Wi-Fi Direct or a phone hotspot is the usual way around it; [transferring files over a hotspot without internet](/blog/transfer-files-over-a-hotspot-without-internet/) shows that route.

## Common questions

### Is Wi-Fi Direct the same as a hotspot?

They are similar but not the same. In both cases one device acts as an access point. A hotspot is usually set up to share a mobile data connection with the internet, whereas Wi-Fi Direct is a standardized way for two devices to find each other and form a small private group with no internet needed. See [how a phone hotspot works](/blog/how-phone-hotspot-works/).

### Is Wi-Fi Aware the same as Wi-Fi Direct?

No. Both are direct device-to-device Wi-Fi, but Wi-Fi Aware is built around cheap, continuous discovery of named services and creates data links on demand, while Wi-Fi Direct is built around forming a group with a group owner.

### Does AWDL work on Android or Windows?

No. Apple's own documentation says its peer-to-peer Wi-Fi is not documented for third-party use and works only between Apple devices. Apple's route for talking to non-Apple devices is Wi-Fi Aware, which it added in iOS 26.

### Are direct Wi-Fi links faster than Bluetooth?

Yes, by a large margin, because they use Wi-Fi radios and wider channels. Android's documentation notes that Wi-Fi Aware supports higher throughput over longer distances than Bluetooth. Bluetooth's limits are explained in [Bluetooth file transfer](/blog/bluetooth-file-transfer-explained/).

### Do these link types need the internet?

No. None of them require an internet connection or a router. Some apps that use them still ask for internet permission, because they use standard network sockets. Android's Wi-Fi Direct guide notes that the permission is needed for that reason even though no internet connection is required.

## Key takeaways

- Peer-to-peer Wi-Fi lets two devices talk without a router, which avoids sending data across the air twice.
- Wi-Fi Direct makes one device the group owner, acting as a small access point for the other.
- Wi-Fi Aware separates cheap, synchronized discovery (publish and subscribe) from an on-demand data link.
- AWDL hops between channels in repeating availability windows, so one radio can serve both a router and a nearby Apple device, and it is available only between Apple devices.
- Android has Wi-Fi Direct and Wi-Fi Aware (from Android 8.0, hardware permitting), and Apple added Wi-Fi Aware in iOS 26 for iPhone 12 and later.
- Whether an app uses any of these depends on the app, not just the phone.

## Sources

- Wi-Fi Alliance: [Wi-Fi Direct](https://www.wi-fi.org/discover-wi-fi/wi-fi-direct)
- Wi-Fi Alliance: [Wi-Fi Aware](https://www.wi-fi.org/discover-wi-fi/wi-fi-aware)
- Android Developers: [Wi-Fi Direct (peer-to-peer) overview](https://developer.android.com/develop/connectivity/wifi/wifi-direct)
- Android Developers: [Wi-Fi Aware overview](https://developer.android.com/develop/connectivity/wifi/wifi-aware)
- Apple Developer: [TN3111: iOS Wi-Fi API overview](https://developer.apple.com/documentation/technotes/tn3111-ios-wifi-api-overview)
- USENIX Security 2019: [A Billion Open Interfaces for Eve and Mallory](https://www.usenix.org/conference/usenixsecurity19/presentation/stute)
- Microsoft Learn: [Windows.Devices.WiFiDirect namespace](https://learn.microsoft.com/en-us/uwp/api/windows.devices.wifidirect)
