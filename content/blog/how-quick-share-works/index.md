---
title: "How Quick Share Works: Nearby Connections, Bluetooth and Wi-Fi Explained"
description: "Quick Share finds nearby devices with Bluetooth, then upgrades to a faster Wi-Fi link and asks both people to confirm. The steps, mediums and PIN check explained."
topic: "local-transfer-tech"
order: 2
publishDate: 2026-10-23
heroImage: "./images/diagram.svg"
heroAlt: "Diagram of Quick Share in three phases: Bluetooth advertising and discovery, a PIN check on both screens, then an upgrade to a faster Wi-Fi link for the file"
related:
  - "how-airdrop-works"
  - "bluetooth-file-transfer-explained"
  - "wifi-direct-wifi-aware-awdl-explained"
  - "mdns-bonjour-device-discovery"
---

Quick Share is the built-in nearby sharing feature on Android phones, Chromebooks and a Windows app. It first finds the other device with low-power Bluetooth, sets up an encrypted connection, and then moves the file over whichever faster radio link the two devices have in common, usually Wi-Fi. Community notes on the protocol describe a short PIN that both screens can show so the two people can check they are talking to each other. Google's name for the system underneath is Nearby Connections.

**Short answer:** Quick Share uses Bluetooth for discovery and a handshake, then switches to a faster link, usually Wi-Fi based, for the data, because Bluetooth is far too slow for photos and videos. The receiver must be visible to the sender, and the connection is encrypted before any file data moves. When the sender is another person, the receiver must accept the transfer; between your own devices on one Google Account, Google says it is accepted automatically.

## Two products became one

Quick Share has a slightly tangled history. Google built a feature called Nearby Share for Android, and Samsung built its own feature, also called Quick Share, for Galaxy devices. At CES in January 2024, [Google and Samsung announced](https://techcrunch.com/2024/01/09/google-and-samsung-are-merging-nearby-share-and-quick-share-into-a-single-sharing-solution) that they were merging the two into a single service under the Quick Share name, extending it to Chromebooks and working with PC makers on a Windows app. Google's own Windows app for Android phones is described on the [Android website](https://www.android.com/quick-share/with-windows-pc/) and needs a 64-bit Windows 10 or later PC with Bluetooth and Wi-Fi turned on.

This post describes the general mechanism that Google documents for Nearby Connections, the developer library that powers Android's nearby sharing. Samsung's version and Google's version have appeared in different apps over time, so details such as menu names and which devices are supported vary by phone, manufacturer and software version.

## The Nearby Connections model

Nearby Connections is a peer-to-peer networking layer. [Google's overview](https://developers.google.com/nearby/connections/overview) says it uses Bluetooth, Bluetooth Low Energy (BLE) and Wi-Fi together, hides the differences between them, and encrypts connections. An [Android Developers Blog post](https://android-developers.googleblog.com/2017/07/announcing-nearby-connections-20-fully.html) from when it launched says it uses Wi-Fi, BLE and Classic Bluetooth "under the hood" and can upgrade the bandwidth of a connection by changing radios.

The model has three roles and a handful of rules:

- **Advertiser.** A device that wants to be found announces itself.
- **Discoverer.** A device that is looking for others listens for those announcements and gets a notification when one appears or disappears.
- **Connection.** The discoverer asks to connect. Each side is told about the request and independently accepts or rejects it, and the connection exists only if both accept. Google calls this a symmetric authentication flow.

After that, the two sides are equals. The connection is full duplex, meaning both can send at the same time, and can carry small byte messages (limited to 32 KB each), whole files of any size, or open-ended streams.

## Phase 1: advertising and discovery

When you open the Quick Share sheet on a phone and tap Receive, the receiver advertises. When you pick files and start looking for recipients, the sender discovers. The first announcements travel by Bluetooth Low Energy because it needs very little power and can run in the background, in the same way and for the same reasons described in [how Bluetooth file transfer works](/blog/bluetooth-file-transfer-explained/).

Who can see whom depends on the visibility setting. [Google's help page](https://support.google.com/android/answer/9286773) lists the options as visible to your own devices (those signed in to the same Google Account), to your contacts, or to everyone nearby for 10 minutes, after which visibility reverts to the previous setting. For contacts, the device is visible only while the screen is on and unlocked. Exact option names and defaults differ between phones and Android versions.

![Three Quick Share visibility options compared: your own devices, contacts, and everyone nearby for 10 minutes. Reach widens from left to right, and a share from another person needs the receiver to accept, while your own devices accept automatically.](./images/figure.svg)
*Visibility decides who can find your phone; it never removes the accept step for a share from another person.*

### A worked trace on the home network

One community effort, the [NearDrop protocol notes](https://github.com/grishka/NearDrop/blob/master/PROTOCOL.md), reverse engineered how Quick Share behaves over one of its mediums, Wi-Fi on a local network (not an official specification, so treat it as one researcher's observations of a version that existed when it was written). It shows how many separate pieces cooperate:

1. The receiver advertises a service over mDNS, the same multicast discovery technique used for printers and described in [mDNS and Bonjour](/blog/mdns-bonjour-device-discovery/). The service type is a fixed string, `_FC9F5ED42C8A._tcp`.
2. The service's instance name is 10 bytes: one marker byte, a 4-byte endpoint ID that identifies the device for this session, a 3-byte service ID, and 2 zero bytes. Encoded as text, it looks like random characters.
3. A text record holds the device's visibility, device type and, if the device is visible, its name. If the receiver is hidden, the name is not included.
4. The notes say Android does not keep the mDNS advertisement running all the time: it waits to see a Bluetooth Low Energy advertisement first. That fits Google's help page, which asks for Bluetooth to be on for both devices even when they share a Wi-Fi network.

The key idea to take from the trace is the division of labor. Bluetooth says "I am here". The faster medium carries the actual conversation.

## Phase 2: the encrypted handshake and PIN

Once the sender chooses a receiver, the two devices open a connection and run a key exchange. In the NearDrop notes, this is a protocol called UKEY2, which lets two devices agree on a shared secret that an eavesdropper who only watched the exchange cannot reconstruct. From that secret both sides derive keys: according to the notes, messages after the handshake are encrypted with AES-256 and authenticated with HMAC-SHA256, which stops anyone altering them without detection.

Then comes a step you may see: both screens can show a short PIN, which the notes describe as four digits, computed from the shared secret. Google's help page does not mention the PIN, so whether and when your phone displays it varies by device and type of transfer. Where it is shown, matching numbers mean nobody is sitting in the middle of the conversation, because a person in the middle would have run a separate key exchange with each side, and the PINs would normally differ. If they differ, decline. The NearDrop notes add that a QR code shown by the sender carries key material and, in the notes' words, bypasses the need for Bluetooth broadcasts. That is consistent with Google's help page, which offers scanning a QR code as the way to connect when a device does not show up in the list.

After that the sender sends a list of what it plans to send, and the receiver is asked to accept or reject. For a share from another person, files are only transferred after an accept, so a device that is visible to everyone is still not open to unsolicited files. Google's help page says that when you share between your own devices on the same Google Account, the receiving device accepts automatically.

## Phase 3: upgrading to a faster link

Bluetooth is a poor carrier for large files. The usable throughput of even a good Bluetooth link is a small fraction of Wi-Fi's, so Nearby Connections negotiates an upgrade. Both sides learn which *mediums* (kinds of radio link) the other supports, and the connection is moved to a faster one they have in common. The 2017 Android Developers Blog post announcing Nearby Connections 2.0 describes this as upgrading the bandwidth of a connection by switching between radios.

The mediums that appear in [the open source Nearby project's code](https://github.com/google/nearby/tree/main/connections/implementation/mediums) include Wi-Fi on the local network (LAN), Wi-Fi Direct, a Wi-Fi hotspot that one device creates for the other, and WebRTC, alongside Bluetooth and BLE. Which ones are used on a given transfer depends on the hardware, the operating system and what the devices share. The NearDrop notes say the server picks a medium by intersecting its supported list with the client's list, and may ask for an upgrade later; they also say it is still not clear how the actual switch happens. Which medium was used is generally not shown to you.

The three options behave differently:

| Medium | Needs a shared router? | Notes |
| --- | --- | --- |
| Wi-Fi on a shared local network | Yes, both on the same network | Traffic goes through the access point |
| Wi-Fi Direct | No | A direct link between the two devices; see [Wi-Fi Direct, Wi-Fi Aware and AWDL](/blog/wifi-direct-wifi-aware-awdl-explained/) |
| Wi-Fi hotspot made by one device | No | One device temporarily acts as the access point |

Google's [Nearby Connections strategies page](https://developers.google.com/nearby/connections/strategies) describes the Point-to-Point strategy, which allows one connection at a time, as the one with the highest throughput and suited to large files. The same page gives the radio range as about 100 meters, though Quick Share's own help page tells you to bring the devices within about 1 foot (30 cm) when a transfer fails.

## Quick Share and Apple's AirDrop

In November 2025 Google announced that Quick Share on Pixel 10 phones can exchange files with Apple devices through Apple's AirDrop. Press coverage such as [TechCrunch's report](https://techcrunch.com/2025/11/20/androids-quick-share-now-works-with-iphones-airdrop-starting-with-the-pixel-10-lineup/) says it works when the Apple device is set to Everyone for 10 minutes. [heise](https://heise.de/-11220599) later reported that the Pixel 9 series (not the 9a) gained the feature and that Samsung's Galaxy S26 rollout starts on 23 March 2026. How the two systems talk is not described in what Google published, and the feature is tied to particular phones, so confirm current support for your devices. Our post on [how Apple's AirDrop works](/blog/how-airdrop-works/) describes the Apple side.

## Why the same two phones can be fast or slow with Quick Share

Because Quick Share picks the link for you, speed depends on which medium wins. A transfer between two phones that can set up a direct Wi-Fi link avoids your router entirely, which matters when the router is slow, congested or set up to block devices from talking to each other, as with [client isolation](/blog/client-isolation-guest-networks-and-device-visibility/). A transfer over the shared network is limited by that network. Google's page for the Windows app asks for Bluetooth and Wi-Fi to be on for the PC, which fits the same Bluetooth-then-Wi-Fi pattern.

Quick Share is, however, a feature of Android, Chromebook and Windows software that is installed and supported on specific devices. If one of your devices is an iPhone, an old Android phone, a work laptop with restrictions, or a Linux machine, a browser-based method is the portable alternative. AnyAirDrop.com is our own tool built on that idea: devices open the same web page, and the files go directly between them using [WebRTC](/blog/webrtc-data-channels-explained/), encrypted. For more phone-to-PC options, see [transferring files between a PC and a phone over Wi-Fi](/blog/transfer-files-between-pc-and-phone-over-wifi/).

## Common questions

### Does Quick Share use Wi-Fi or Bluetooth?

Both. Bluetooth Low Energy announces and discovers devices, and a Wi-Fi based link usually carries the file. Google's help page says Bluetooth must be on for both devices, and QR code transfers need both Wi-Fi and Bluetooth.

### Does Quick Share use mobile data?

A nearby transfer is meant to go directly between the two devices, but not every route is local. Google's help page says that if you don't use Wi-Fi, data charges may apply, and that sharing by QR code with an Apple device where the AirDrop route is not supported needs internet access on both devices. The open source Nearby code also includes a WebRTC medium, which can be internet based. If mobile data matters to you, check the mobile data option in your Quick Share settings.

### Is Quick Share secure?

The connection is encrypted, and a share from another person needs the receiver to accept it. Google's overview describes Nearby Connections as fully encrypted, and where your phone shows a PIN, comparing it lets you confirm you are connected to the device you meant. Set visibility to the narrowest option that works, such as your own devices or contacts, rather than leaving it open to everyone.

### Why does Quick Share not find my device?

The common causes are that Bluetooth is off, the receiver is not in Receive mode or its screen is locked, visibility is limited to contacts and the sender is not in them, or the devices are too far apart. Google's help page also lists a Location requirement on Android 12 and earlier. The general checks are collected in our [troubleshooting guide](/blog/devices-cant-find-each-other-troubleshooting/).

### Is Samsung Quick Share the same as Google Quick Share?

They were separate products until the January 2024 announcement and are now meant to be one service under one name. Some differences remain on Windows: Google's page for its Windows app says that app is no longer supported on Samsung PCs, which use Samsung's own app. Which app you have depends on the device.

## Key takeaways

- Quick Share is built on Nearby Connections, which pairs Bluetooth for discovery with Wi-Fi style links for speed.
- Devices advertise, a discoverer asks to connect, and both sides must accept before a connection exists.
- Traffic is encrypted, and community notes describe a PIN on both screens that helps you confirm nobody is in the middle, though your phone may not always show it.
- The faster medium (Wi-Fi LAN, Wi-Fi Direct, hotspot, WebRTC and others) is negotiated by the devices, and you are usually not told which one was used.
- Visibility settings control who can find you, and a share from another person needs the receiver to accept. Between your own devices on one Google Account, Google says acceptance is automatic.
- The AirDrop interoperability first announced in November 2025 has since widened to more phones, but it still depends on the Apple device being in Everyone mode, and its inner workings have not been described in detail.

## Sources

- Google for Developers: [Nearby Connections overview](https://developers.google.com/nearby/connections/overview)
- Google for Developers: [Nearby Connections strategies](https://developers.google.com/nearby/connections/strategies)
- Android Developers Blog: [Announcing Nearby Connections 2.0](https://android-developers.googleblog.com/2017/07/announcing-nearby-connections-20-fully.html)
- Google Help: [Quick Share on Android](https://support.google.com/android/answer/9286773)
- Android: [Quick Share for Windows](https://www.android.com/quick-share/with-windows-pc/)
- TechCrunch: [Google and Samsung are merging Nearby Share and Quick Share](https://techcrunch.com/2024/01/09/google-and-samsung-are-merging-nearby-share-and-quick-share-into-a-single-sharing-solution)
- TechCrunch: [Android's Quick Share now works with iPhones' AirDrop, starting with the Pixel 10 lineup](https://techcrunch.com/2025/11/20/androids-quick-share-now-works-with-iphones-airdrop-starting-with-the-pixel-10-lineup/)
- heise: [Quick Share: Samsung brings AirDrop support for Galaxy S26 series](https://heise.de/-11220599)
- Google (open source): [Nearby Connections mediums source code](https://github.com/google/nearby/tree/main/connections/implementation/mediums)
- grishka: [NearDrop protocol notes](https://github.com/grishka/NearDrop/blob/master/PROTOCOL.md) (community reverse engineering, not an official specification)
