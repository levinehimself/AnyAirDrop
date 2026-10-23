---
title: "How a Phone Hotspot Works: Your Phone as a Wi-Fi Router"
description: "A hotspot makes your phone act as a small router: its cellular modem is the internet side, its Wi-Fi chip is the access point, and NAT and DHCP tie them together."
topic: "phones-as-modems"
order: 3
publishDate: 2026-10-23
heroImage: "./images/diagram.svg"
heroAlt: "Diagram of a laptop connecting by Wi-Fi to a phone acting as a router, which passes traffic through its cellular modem to a cell tower and the internet"
related:
  - "android-hotspot-usb-bluetooth-tethering-compared"
  - "iphone-personal-hotspot-explained"
  - "why-phone-hotspots-are-slow"
  - "how-a-router-works-nat-dhcp-dns"
---

A phone hotspot turns your phone into a small router. The phone's cellular modem provides the connection to the internet, and its Wi-Fi chip creates a new Wi-Fi network that your laptop or tablet can join. In between, the phone does the same jobs a home router does: it hands out addresses to the devices that connect, and it rewrites their traffic so it can share one internet connection.

**Short answer:** a hotspot is three pieces of software and hardware working together. The cellular modem is the "WAN" side, the Wi-Fi chip running as an access point is the "LAN" side, and the phone's operating system sits in the middle doing DHCP (address assignment), DNS forwarding and NAT (network address translation). Everything your laptop sends goes through the phone's one cellular connection, so that link, not the Wi-Fi, is usually the limit.

## The two sides of the phone

A home setup has a modem and a router, often in the same box. [Modem vs router vs access point](/blog/modem-vs-router-vs-access-point/) separates the roles. A phone has all of them inside one device:

- **The modem side.** The baseband processor and radio talk to the cell tower, as described in [what a phone modem is](/blog/what-is-a-phone-modem-baseband/). The operating system sees this as a network interface that already has an IP address from the carrier.
- **The access point side.** Wi-Fi chips can usually run in more than one mode. Normally the phone is a *station*, meaning a client that joins someone else's network. When you switch on the hotspot, the chip runs as an *access point*: it broadcasts a network name, accepts clients and relays their frames, just like the access point in [how Wi-Fi works](/blog/how-wifi-works/).
- **The router side.** Software in the operating system connects the two. On Android, this is the Tethering module. [Android's documentation](https://source.android.com/docs/core/ota/modular-system/tethering) says it shares the device's internet connection with client devices over Wi-Fi, USB, Bluetooth or Ethernet, setting up NAT and DHCP for IPv4 and using stateless address autoconfiguration (SLAAC) for IPv6. iPhone's Personal Hotspot does the equivalent job in iOS, though Apple does not publish its internals.

## What happens, step by step

Suppose your laptop joins the hotspot and you open a web page. Here is the sequence, simplified.

1. **Join.** The phone's Wi-Fi chip broadcasts beacons with the hotspot's name. Your laptop sends the password-based handshake ([WPA2 and WPA3](/blog/wifi-security-wpa2-wpa3-explained/) work the same way as on any router), and both sides derive encryption keys.
2. **Get an address.** The laptop asks for an IP address using DHCP (Dynamic Host Configuration Protocol). The phone's DHCP server replies with an address, a subnet, a gateway (the phone itself) and a DNS server. [How a router works](/blog/how-a-router-works-nat-dhcp-dns/) explains the four-message exchange.
3. **Look up the name.** The laptop asks the phone to resolve the web site's name. The phone typically forwards that question to a DNS server reached through the carrier and passes the answer back.
4. **Send the request.** The laptop sends its packets to the gateway, which is the phone. Those packets travel over Wi-Fi, encrypted, to the phone's access point.
5. **Translate.** The phone's operating system looks at the packet. The source address is the laptop's private address, which means nothing on the internet. The phone replaces it with its own cellular address and notes the swap in a table.
6. **Transmit.** The packet goes from the operating system to the baseband and out over the radio to the tower.
7. **Return.** The reply arrives at the baseband, the operating system finds the matching table entry, swaps the address back and sends the packet over Wi-Fi to the laptop.

All of this adds a few milliseconds of processing, plus the time for the Wi-Fi hop. Most of the delay still comes from the cellular link and the internet itself.

### What the translation table looks like

The NAT table is the heart of the arrangement. Here is an illustration with made-up addresses to show the idea:

| Laptop sends from | Phone rewrites to | Destination |
| --- | --- | --- |
| 192.168.49.12, port 51022 | 10.64.18.7, port 51022 | 203.0.113.9, port 443 |
| 192.168.49.12, port 51030 | 10.64.18.7, port 51030 | 203.0.113.9, port 443 |
| 192.168.49.20, port 40318 | 10.64.18.7, port 40318 | 198.51.100.4, port 443 |

Two different devices share one outside address, and the port numbers keep their conversations separate. This is the mechanism described in RFC 3022 ([Traditional IP Network Address Translator](https://www.rfc-editor.org/rfc/rfc3022)). The same arrangement runs inside every home router.

## The addresses a hotspot hands out

A hotspot uses *private* address ranges, which are reserved for local networks and are not routed on the public internet. The reserved blocks are defined in RFC 1918 ([Address Allocation for Private Internets](https://www.rfc-editor.org/rfc/rfc1918)): 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16. [Private IP addresses and local networks](/blog/private-ip-addresses-and-local-networks/) goes into more depth.

Which range your phone uses is not fixed, and it varies by maker and software version. As commonly reported, an iPhone Personal Hotspot hands out addresses in the 172.20.10.x block with a small subnet, while Android phones have used ranges such as 192.168.x.x, with the exact block differing across versions and manufacturers. If you need the real value, check the connected device's network details instead of assuming. Apple does not document the address pool or promise that it stays the same.

Two points follow from this:

- The subnet is small. A hotspot is meant for a handful of devices, and phone makers cap the number. Google's help page says a Wi-Fi hotspot can share mobile data with up to 10 other devices, and Apple says the number of simultaneous devices depends on your carrier and iPhone model.
- If the hotspot's range happens to match another network the laptop is attached to, for example a VPN or a second Wi-Fi network, routing can get confused. This is rare, but it is the reason a manual look at the address details is worth doing when a hotspot connects but nothing loads.

## Doing it at the same time as using Wi-Fi

Most people use the phone's Wi-Fi as a client at home and then turn on the hotspot elsewhere, but some phones can do both at once. Android added concurrent station and access point operation in version 9. The [Android documentation](https://source.android.com/docs/core/connect/wifi-sta-ap-concurrency) notes that on phones with dual-band simultaneous support the hotspot can run without disconnecting the phone's own Wi-Fi connection. It also warns that when the two share a band but use different channels, some chips time-share one radio, which can cause a severe drop in performance.

That has a practical meaning: if a phone is connected to Wi-Fi and also serving a hotspot on a different channel, the single radio switches between the two and every device sees lower speed and extra delay. Phones avoid this by moving the hotspot to the same channel or to a different band. See [Wi-Fi channels and channel width](/blog/wifi-channels-and-channel-width/) for why a shared radio costs airtime. Whether any of this is available depends on the phone, and in most cases the hotspot simply uses the cellular modem as its source.

## Which band does the hotspot use?

The access point can use the 2.4 GHz band or 5 GHz, and on newer phones sometimes 6 GHz. As in any Wi-Fi network, 2.4 GHz reaches farther and works with older devices, while 5 GHz is faster in the same room. Many phones let you pick a preferred band, and some choose automatically. The names of those settings vary by manufacturer and version, so look in the hotspot settings for something about band, frequency or compatibility. The trade-off is explained in [Wi-Fi bands compared](/blog/wifi-bands-2-4-5-6-ghz/).

## Battery and heat

A hotspot keeps three power-hungry parts active at once: the cellular radio at high throughput, the Wi-Fi radio acting as an access point (which must stay awake to hear clients), and the processor doing the translation. That is why phones get warm and drain quickly during a hotspot session. Google's help page recommends plugging in devices while tethering, turning tethering off when you are finished and, where the option exists, enabling a setting that turns the hotspot off automatically when nothing is connected.

Heat also feeds back into speed. Phones reduce radio and processor performance when they get hot to protect themselves, which can show up as slower transfers on a long session. [Why phone hotspots are slow](/blog/why-phone-hotspots-are-slow/) covers this.

## What the connected devices see

From the laptop's point of view, the phone looks like any other router:

- A Wi-Fi network named after the hotspot. On iPhone, Apple notes the hotspot name matches the device name.
- A gateway address that is the phone.
- Internet access that appears to come from a single address, which is the phone's cellular address, shared by all connected devices.

The carrier sees one subscriber using data, and many carriers treat tethered data separately in their plans. The websites you visit see the carrier's outward-facing address, not your laptop's. Because many carriers add their own address translation behind the phone, there can be two layers of NAT, which is one reason incoming connections to a laptop on a hotspot generally do not work. That matters for peer-to-peer tools, covered in [STUN, TURN and ICE](/blog/stun-turn-ice-explained/).

## What this means for sending files between your own devices

A hotspot creates a small local network, even though its purpose is internet sharing. Two devices that join the same hotspot are on the same private subnet, so they can in principle exchange files directly with each other over Wi-Fi without that traffic ever touching the cellular link or using mobile data. A direct transfer between two devices on the hotspot passes through the phone's access point only as a Wi-Fi relay, so it is limited by Wi-Fi speed and not by your mobile connection.

There are two caveats. First, phone makers do not promise that clients can see one another; an Apple engineer wrote on the [Apple Developer Forums](https://developer.apple.com/forums/thread/79141) that Personal Hotspot was designed solely as a way to connect client devices to the internet and does not guarantee other kinds of connectivity. Some devices also block client-to-client traffic, a feature explained in [client isolation and guest networks](/blog/client-isolation-guest-networks-and-device-visibility/). Second, the phone you are using as the hotspot is a poor place to run the transfer app, because it is busy doing translation. The follow-up post, [transferring files over a hotspot without internet](/blog/transfer-files-over-a-hotspot-without-internet/), covers the offline case.

## Common questions

### Does a hotspot use the phone's Wi-Fi or mobile data?

It uses mobile data for the internet side and the Wi-Fi chip for the local side. The connected devices reach the internet through the phone's cellular modem, so their usage counts against your mobile plan, even though they connect to the phone over Wi-Fi.

### Can I use a hotspot while my phone is connected to Wi-Fi?

It depends on the phone. Some Android phones support running the hotspot and a Wi-Fi connection at the same time, and the shared radio can slow both. On many phones, turning the hotspot on disconnects the phone from other Wi-Fi networks. Check the hotspot settings on your model.

### Is a phone hotspot secure?

It uses the same Wi-Fi encryption as any router (WPA2 or WPA3 where supported), so a strong password matters. Google's help page notes that you can remove the password by setting security to none, which lets anyone nearby join, so leave the password on.

### Why does my hotspot have a different IP address range from my home router?

The phone's operating system picks its own private range, which is usually different from your home router's. Both ranges are reserved private addresses, so either is valid. The range does not affect speed.

### Do the devices on a hotspot share one IP address?

On the internet side, yes: the websites see the phone's cellular address, and NAT keeps each device's connections apart. On the local side, each device has its own private address.

## Key takeaways

- A hotspot combines the phone's cellular modem (internet side), its Wi-Fi chip in access-point mode (local side) and an operating-system router that handles DHCP, DNS forwarding and NAT.
- Every connected device shares the phone's single cellular connection, so that link is usually the bottleneck.
- Hotspots hand out private addresses; the exact range depends on the maker and version.
- Running a hotspot while using Wi-Fi at the same time can be slow when one radio is shared.
- Battery drain and heat are normal because the modem, Wi-Fi radio and processor all work at once.
- Devices on the same hotspot form a local network, but the phone is not guaranteed to let them reach one another.

## Sources

- Android Open Source Project: [Tethering module](https://source.android.com/docs/core/ota/modular-system/tethering)
- Android Open Source Project: [Wi-Fi STA/AP concurrency](https://source.android.com/docs/core/connect/wifi-sta-ap-concurrency)
- Google Android Help: [Share a mobile connection by hotspot or tethering on Android](https://support.google.com/android/answer/9059108)
- Apple Support: [Personal Hotspot on iPhone and iPad](https://support.apple.com/en-us/111785)
- IETF: [RFC 3022, Traditional IP Network Address Translator](https://www.rfc-editor.org/rfc/rfc3022)
- IETF: [RFC 1918, Address Allocation for Private Internets](https://www.rfc-editor.org/rfc/rfc1918)
