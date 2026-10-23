---
title: "Client Isolation, Guest Networks and Why Devices on Wi-Fi Can't See Each Other"
description: "Client isolation, guest VLANs and filtered multicast stop devices on the same Wi-Fi from finding each other. Here is how to test for it and what you can do."
topic: "routers-and-networks"
order: 5
publishDate: 2026-10-23
heroImage: "./images/diagram.svg"
heroAlt: "Side-by-side diagram of a normal Wi-Fi network where the access point relays traffic between two phones, and an isolated network where it blocks phone-to-phone traffic"
related:
  - "devices-cant-find-each-other-troubleshooting"
  - "mdns-bonjour-device-discovery"
  - "private-ip-addresses-and-local-networks"
  - "stun-turn-ice-explained"
---

Two phones can show the same Wi-Fi name and still be unable to reach each other, because the network may deliberately forbid it. Hotels, cafés, offices, schools and "guest" networks commonly switch on client isolation, which makes the access point drop every frame that would travel from one wireless device to another. The devices can still reach the internet; they just cannot see their neighbors.

**Short answer:** isolation is a rule in the access point or router that blocks device-to-device traffic. Guest networks add a second layer by putting visitors on a separate subnet (often through a VLAN) with a firewall in front of your main network. Discovery protocols such as mDNS also fail across subnets, because they use multicast messages that routers do not forward. You can test for isolation with a simple ping, and your options are to switch networks, pair by code, use a relay or create a hotspot.

## What client isolation does

On an ordinary Wi-Fi network, the access point acts as a bridge. When phone A sends a frame addressed to phone B, the access point receives it over the air and sends it out again to phone B, as described in [how Wi-Fi works](/blog/how-wifi-works/). Nothing special is needed. All devices on the network are peers.

*Client isolation* (also called AP isolation, wireless isolation, station isolation or "guest isolation", depending on the manufacturer) changes one thing: the access point refuses to relay frames from one wireless client to another. The open-source router firmware OpenWrt describes its version of the option plainly: it isolates wireless clients from each other. The setting normally allows the client to talk to the router itself and to the internet, which is all a guest needs, and nothing more.

The diagram at the top shows the two cases. On the left the access point relays between phones. On the right it drops client-to-client frames, so phone A can still reach the router and the internet, but phone B has effectively disappeared.

Isolation is applied at the link layer, below IP. That means a device on an isolated network may have a perfectly normal IP address in the same range as everybody else, and the mask test in [private IP addresses and local networks](/blog/private-ip-addresses-and-local-networks/) says "local, deliver directly", yet the delivery silently fails. This is why the problem is so confusing: every setting looks right.

Some systems also isolate clients on different radios or from wired devices. Whether Wi-Fi clients can reach cabled devices on the same router varies by product, so test rather than assume.

## Guest networks and VLANs

A guest network is a second Wi-Fi name that shares your internet connection but is kept away from your own devices. There are two typical ways to build one.

The simple way is client isolation on a second SSID (network name), plus a rule that blocks access to the router's management page. The guest network may still use the same address range as your main network.

The stronger way uses a **VLAN**, a virtual LAN. The standard that defines VLAN tagging is IEEE 802.1Q. A switch or access point attaches a small tag with a VLAN number to every frame, and devices in one VLAN cannot exchange frames with devices in another unless a router connects them. The tag has a 12-bit number field, which allows IDs up to 4094 for ordinary use. Each VLAN is normally given its own subnet. For example:

| Network | VLAN | Subnet | Can reach |
| --- | --- | --- | --- |
| Main | 1 | 192.168.1.0/24 | Everything at home and the internet |
| Guest | 20 | 192.168.20.0/24 | The internet only |

A phone on the guest network gets an address like 192.168.20.14. A laptop on the main network is 192.168.1.23. These addresses fail the "same network" test, so each device sends traffic for the other to its router, and the router's firewall refuses to forward it. The effect is the same as isolation, but it is enforced at the router instead of at the radio. Meanwhile devices in the *guest* VLAN may or may not be isolated from each other, which depends on whether client isolation is also enabled.

Guest networks are a good security practice. If a visitor's phone carries malware, or a smart device of doubtful quality joins the guest SSID, it cannot scan your laptops and file shares. The trade-off is that your own phone, if it ends up on the guest network by accident, also cannot find your printer or computer.

## Why discovery fails across subnets

Even without isolation, devices on different subnets cannot find each other automatically. The reason has to do with how discovery works.

To find nearby devices without asking you to type an address, software sends a message to *everyone* on the local network, and anyone interested answers. Two common mechanisms:

- **mDNS (multicast DNS),** defined in [RFC 6762](https://www.rfc-editor.org/rfc/rfc6762), sends name queries to the IPv4 multicast address 224.0.0.251 on UDP port 5353 (the IPv6 equivalent is ff02::fb). The RFC designates names ending in `.local` as meaningful only on the link where they originate. Apple's Bonjour and many printers and media devices use it. The details are in our guide to [mDNS and Bonjour](/blog/mdns-bonjour-device-discovery/).
- **SSDP (Simple Service Discovery Protocol),** used by UPnP devices such as smart TVs, sends to 239.255.255.250 on UDP port 1900.

Both use *link-local* multicast. By design, routers do not forward it to other networks. A router sitting between the main network and a guest VLAN therefore stops these messages at the boundary. A phone on the guest side asks "who is a printer?" and nobody on the main side ever hears.

Two more things make multicast unreliable on Wi-Fi even within one subnet:

1. **Airtime cost.** Multicast and broadcast frames are typically sent at a low basic data rate so that every device can decode them, and they are not acknowledged. A single multicast frame may therefore take far more airtime than the same payload sent as a normal unicast frame. Many access points and routers filter or convert multicast to protect the network, especially in places with many devices.
2. **Power saving.** Phones that are asleep do not listen to every frame, so multicast messages may be missed. Access points batch them and announce them at set intervals, which adds delay.

The result is a hierarchy of failures: isolation blocks all device-to-device traffic, separate subnets block discovery and direct delivery, and multicast filtering blocks only discovery while leaving direct connections working. In the third case, typing the other device's IP address still works.

## Where you meet isolation

- **Hotels and holiday rentals.** Isolation is nearly universal, so guests cannot see each other's devices or the room's cast targets. Some hotels deliberately put each room on its own VLAN, so you can see your own devices but not the neighbors'.
- **Cafés, airports and public networks.** Isolation protects customers from each other.
- **Offices and schools.** Corporate networks separate staff, guests and devices into VLANs with firewall rules, and often disable multicast on Wi-Fi to save airtime.
- **Universities and dormitories.** Large campus networks may isolate wireless clients or segment them by building or room.
- **Home guest networks and some mesh systems.** Many routers isolate the guest SSID by default, and a "smart home" or "IoT" network may be isolated for security reasons.
- **Provider-supplied gateways.** Some give you a second network or an isolation toggle in an app.

In your own home, the usual cause is that one device joined the guest network or the other band's separate network by mistake. Check which network each device is on before changing anything.

## How to tell whether isolation is your problem

You can test without special software, using ping, a tool that sends a small echo request and waits for a reply. Ping is built into Windows, macOS and Linux, and phone apps for network tools can do the same.

1. Find both devices' IP addresses in their Wi-Fi details. Compare them. If the first three numbers differ (for example 192.168.1.x and 192.168.20.x) they are on **different subnets**, which is the likely explanation and not isolation as such.
2. If the first three numbers match, ping the router from one device (usually the gateway address, ending in .1). It should reply. This confirms the Wi-Fi connection works.
3. Ping the other device's IP address from the first one. A reply means direct device-to-device traffic works, so isolation is not the cause, and discovery is the problem. "Request timed out" or "no reply" suggests isolation, a firewall on the other device, or both.
4. A cautionary note: some devices, especially phones with power saving, and computers with their firewall on, ignore pings even on a healthy network. A failed ping is a clue, not proof. If you can, connect one device by Ethernet to the same router and repeat. If a wired device can reach the phone but another phone cannot, wireless-to-wireless isolation is the likely cause.
5. A cleaner comparison is to attach both devices to a different network, such as one you control, and see if the problem disappears. If it does, the first network is the cause.

The walk-through in [devices can't find each other](/blog/devices-cant-find-each-other-troubleshooting/) takes the same ideas further.

## What you can do about it

If it is a network you control, look in the router's wireless settings for options with names like AP isolation, client isolation, guest isolation or "allow guests to see each other and the local network". The wording differs by manufacturer. Turn it off for the network your own devices use, and keep it on for the real guest network. Make sure both devices join the same network and band. If your router offers a separate IoT or smart-home network, check whether it needs a rule to be reachable from your phone.

If it is a network you do not control, you cannot change the rules, and the realistic options are these:

1. **Use a different network.** Another Wi-Fi name at the same location, such as a staff or room network, if you are authorized, or a personal router or travel router.
2. **Create a hotspot.** A phone hotspot is a small network that you control. Connect both devices to it and they will usually see each other, though hotspot behavior varies by phone and carrier plan. The mechanics are covered in the phones-as-modems articles, starting with [how a phone hotspot works](/blog/how-phone-hotspot-works/).
3. **Use a cable.** Two computers can be connected directly or through a switch, and some phones can use a USB Ethernet adapter, depending on the model and software.
4. **Pair through a rendezvous.** Tools that do not rely on local discovery let you enter a code or scan a QR code to find the other device. This fixes the *discovery* problem only. If isolation blocks the direct connection as well, the data must travel by another path, such as an internet relay, which is slower and needs internet access. [STUN, TURN and ICE](/blog/stun-turn-ice-explained/) explain how that decision is made, and MDN's page on [WebRTC connectivity](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity) describes how browsers try direct candidates first and fall back to a relay.

## What this means for sending files between your own devices

Isolation is the single most common reason that "same Wi-Fi" nearby sharing fails on a network you do not own. Two points are worth keeping in mind.

First, the failure has two layers, and they need different fixes. If discovery fails but a direct connection would work, a code or QR fixes it. If the network blocks device-to-device traffic, no amount of pairing will let the devices talk directly, and the data has to go around through a relay or another network. The honest diagnosis is a test, not a guess.

Second, being on the same network name is not the same as being on the same network. Mesh systems, extenders in router mode and guest SSIDs create different subnets with the same-looking name, which is why the address comparison in step 1 is the most informative test.

AnyAirDrop.com is our own tool. Devices on the same Wi-Fi find one another automatically, and others can pair with a 6-digit code or QR code. It uses an encrypted relay only when a direct connection is impossible, and the page says so when that happens.

## Common questions

### What is the difference between client isolation and a guest network?

Client isolation stops wireless devices on one network from talking to each other. A guest network is a separate network for visitors, which may or may not use client isolation. A well-built guest network usually has both, plus a firewall rule that keeps guests away from your main devices.

### Why can my phone see the printer on my home Wi-Fi but not at the office?

At home the phone and printer are usually on the same subnet with no filtering, so multicast discovery works. At an office the printer may be on a wired VLAN that the Wi-Fi network cannot reach, or multicast may be blocked. The network is behaving as designed.

### Does turning off client isolation make my network unsafe?

On your own main network it is the normal state, and everyday devices rely on it. The risk grows when untrusted devices join, so keep isolation on for a real guest network, and use a strong password and current encryption (see [WPA2 and WPA3](/blog/wifi-security-wpa2-wpa3-explained/)) on the main one.

### Can two devices on a guest network share files?

Only if the guest network does not isolate clients. Many guest networks do, so device-to-device traffic is blocked even though both can browse the internet.

### Does a VPN fix client isolation?

Not by itself. A VPN encrypts traffic to a server and does not create a path between two local devices. A VPN that connects both devices into a common virtual network could allow them to talk, but only through the VPN's server or mesh, which works like a relay rather than a local link.

## Key takeaways

- Client isolation makes an access point drop frames between wireless devices, while still allowing internet access.
- Guest networks usually put visitors on a separate subnet or VLAN, and a firewall blocks traffic from them to the main network.
- Discovery protocols use link-local multicast, which routers do not forward, so they fail across subnets and are often filtered on Wi-Fi.
- Compare the devices' IP addresses, then ping the router and the other device, to separate "different networks" from "isolation" from "discovery only".
- If you cannot change the network, switch networks, use a hotspot or a cable, or pair by code and accept that the data may take a relay path.

## Sources

- IETF: [RFC 6762, Multicast DNS](https://www.rfc-editor.org/rfc/rfc6762)
- OpenWrt Project: [Wireless configuration, basic options (including the isolate option)](https://openwrt.org/docs/guide-user/network/wifi/basic)
- MDN Web Docs: [WebRTC connectivity](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity)