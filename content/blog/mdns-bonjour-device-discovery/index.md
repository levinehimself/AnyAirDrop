---
title: "mDNS and Bonjour Explained: How Devices Find Each Other on a Network"
description: "Multicast DNS lets devices announce and find services on a local network with no server. See the packets, the addresses, and why it stops at the router."
topic: "local-transfer-tech"
order: 6
publishDate: 2026-10-23
heroImage: "./images/diagram.svg"
heroAlt: "Diagram of a laptop sending a multicast query to 224.0.0.251 on UDP port 5353, a printer replying with its name, port and address, and a router that blocks the query from reaching a second network"
related:
  - "devices-cant-find-each-other-troubleshooting"
  - "client-isolation-guest-networks-and-device-visibility"
  - "how-a-router-works-nat-dhcp-dns"
  - "how-airdrop-works"
---

When your laptop lists a printer or a TV without you typing an address, the likely reason is multicast DNS (mDNS): the laptop asks the whole local network "who offers this service?" and the device that does answers directly. No server keeps a list. The system is called Bonjour on Apple devices and Avahi on Linux, and it is the reason nearby devices often appear in a list as if by magic.

**Short answer:** mDNS reuses the normal DNS message format but sends it by multicast to a fixed address (224.0.0.251 for IPv4, FF02::FB for IPv6) on UDP port 5353, so every device on the same network segment hears it. A companion standard, DNS-SD (DNS-Based Service Discovery), defines how services are named so a device can ask for "all printers" or "all file-sharing services". Because the messages are link-local, they do not cross routers.

## The problem: finding a device with no address and no server

To talk to a device over a network you need its IP address. Normally a person provides it, or a DNS server translates a name into it. At home, though, addresses are handed out automatically by the router's DHCP service (see [how a router works](/blog/how-a-router-works-nat-dhcp-dns/)) and can change. Typing `192.168.1.42` for a printer works only until the router gives that address to something else.

mDNS removes the need for both a person and a server. According to [RFC 6762](https://www.rfc-editor.org/rfc/rfc6762), the standard that defines it, multicast DNS provides the ability to do DNS-like operations on the local link in the absence of any conventional Unicast DNS server. Every device acts as its own tiny DNS server for its own names and services.

## Layer one: names with .local

mDNS handles *names*. A device that calls itself `office-printer` answers questions about `office-printer.local`. The `.local` ending is special: RFC 6762 says names ending in `.local.` have only local significance, meaning they are meaningful only on the link where they originate. They are not looked up in the public DNS.

When your computer wants `office-printer.local`, it sends a DNS question to the mDNS multicast address. The RFC says queries for `.local` names go to the IPv4 link-local multicast address 224.0.0.251 or the IPv6 address FF02::FB, using UDP port 5353. The printer, which is listening on that address, answers with an address record, and everyone else ignores the question.

### How a device claims a name

Because there is no central registry, two devices might choose the same name. RFC 6762 handles this with probing and announcing:

1. **Probe.** Before using a name, a device sends three probe queries about 250 milliseconds apart, asking whether anyone already has it.
2. **Wait.** If nobody answers, nothing conflicts.
3. **Announce.** The device sends at least two unsolicited responses, one second apart, telling the network the name now exists so that caches are updated.
4. **Conflict.** If another device does answer, the newcomer picks a different name, which is why you sometimes see "printer-2.local".

Claiming a name therefore takes roughly three quarters of a second: three probes at 250 ms spacing is 3 × 250 ms = 750 ms.

## Layer two: DNS-SD describes services

Names alone do not say what a device does. DNS-SD, defined in [RFC 6763](https://www.rfc-editor.org/rfc/rfc6763), adds a naming pattern for services using ordinary DNS record types. It uses three:

- **PTR** (pointer): a list of the instances of a service type. Asking for `_ipp._tcp.local` (the IPP printing service over TCP) returns the names of printers.
- **SRV** (service): for one instance, which host and which port to connect to.
- **TXT** (text): small extra details written as key=value pairs, such as the printer's model or a path.

The service type names, such as `_ipp._tcp` or `_http._tcp`, are registered with IANA, as Android's documentation also notes. A client asks for the PTR list, as if browsing a directory, then fetches the SRV and TXT records for the instance the user picks.

### A sample exchange

This is an illustrative exchange for a made-up printer. It shows the content of the DNS records rather than the raw bytes.

A laptop sends a UDP datagram to 224.0.0.251, port 5353:

```
Question:  _ipp._tcp.local.   type PTR   class IN
```

The printer replies, also by multicast:

```
_ipp._tcp.local.                  PTR  Office Printer._ipp._tcp.local.
Office Printer._ipp._tcp.local.   SRV  0 0 631 office-printer.local.
Office Printer._ipp._tcp.local.   TXT  "rp=ipp/print" "ty=Example Model"
office-printer.local.             A    192.168.1.42
```

Reading it from the top: the service type has one instance, called Office Printer; that instance is reachable at the host `office-printer.local` on port 631 (a port used for IPP); some extra details follow; and the host's IPv4 address is 192.168.1.42. The first two numbers on the SRV line are priority and weight, both zero when there is only one choice. The laptop can now open a TCP connection to 192.168.1.42 port 631 with no manual setup.

Several details keep the multicast chatter manageable. A querier can include records it already knows so responders do not repeat them (known-answer suppression). RFC 6762 gives host-name records a default lifetime of 120 seconds and most other records 75 minutes (4,500 seconds), so devices re-ask only occasionally. A device that is leaving can announce that its records are expiring, so lists update when something is switched off.

## Bonjour, Avahi and Android's service discovery

The same protocols appear under different brand names:

- **Bonjour** is Apple's name for zero-configuration networking. [Apple describes it](https://developer.apple.com/bonjour/) as automatic discovery of devices and services on a local network using industry standard IP protocols, and it runs on macOS and iOS, with versions for Windows. Many printers and consumer devices include it.
- **Avahi** is the open source counterpart used on most Linux distributions. [Avahi's site](https://avahi.org/) calls it a service discovery system based on mDNS and DNS-SD.
- **Android Network Service Discovery (NSD)** implements DNS-SD for apps. In [Android's guide](https://developer.android.com/develop/connectivity/wifi/use-nsd), an app registers a service with a type such as `_nsdchat._tcp`, discovers others by type, then resolves a found service to get its host and port.

Because they follow the same standards, a Mac, a Linux box and an Android app can see each other's services on the same network.

## Why it stops at the edge of the network

The multicast addresses used by mDNS are link-local: the address range 224.0.0.0/24 is reserved for traffic that is meant to stay on one network segment, and routers do not forward it. RFC 6762 adds a second safeguard, since responses are supposed to be sent with an IP TTL of 255, and some queriers discard packets with any other TTL. A router that did forward a packet would reduce its TTL, so it would fail that check.

That behavior is deliberate, but it causes familiar problems:

- **Different subnets.** If your laptop is on the main network and the printer is on a separate subnet or VLAN, the question never reaches it. Fixes are a "multicast DNS repeater", "reflector" or "gateway" feature on the router or on an Avahi host, or bridging the networks.
- **Guest and isolated Wi-Fi.** Many guest networks and some access points use client isolation, which stops devices on the same Wi-Fi from talking to each other at all, multicast included. See [client isolation and guest networks](/blog/client-isolation-guest-networks-and-device-visibility/).
- **Wi-Fi power saving.** Multicast frames on Wi-Fi are delivered at special times, and phones that sleep may skip them or filter them out to save battery. Android, for example, offers apps a "multicast lock" for this reason.
- **Switch filtering.** Some managed switches limit multicast, so a device on a different switch port may go unheard.
- **VPNs.** A VPN often sends your traffic through a remote network instead of the local one, so local discovery may stop working while it is connected.

If a device is missing from a list, the question in this post is where the answer was lost. [Troubleshooting devices that cannot find each other](/blog/devices-cant-find-each-other-troubleshooting/) turns this into a checklist.

## How it differs from SSDP, UPnP and LLMNR

mDNS is not the only local discovery protocol.

| Protocol | Multicast address and port | How it asks | Typical use |
| --- | --- | --- | --- |
| mDNS / DNS-SD | 224.0.0.251 and FF02::FB, UDP 5353 | DNS questions for names and service types | Printers, Apple devices, casting devices, file-sharing apps |
| SSDP (part of UPnP) | 239.255.255.250, UDP 1900 | HTTP-style text messages (M-SEARCH) over UDP | Media servers, smart TVs, routers |
| LLMNR (RFC 4795) | 224.0.0.252 and FF02::1:3, UDP 5355 | DNS-format queries for a single host name | Resolving computer names on Windows networks |

SSDP (Simple Service Discovery Protocol) is defined in the UPnP Device Architecture. The [UPnP specification](https://openconnectivity.org/upnp-specs/UPnP-arch-DeviceArchitecture-v2.0-20200417.pdf) shows a search request as an `M-SEARCH * HTTP/1.1` message sent to 239.255.255.250 port 1900, and devices announce themselves to the same address. LLMNR (Link-Local Multicast Name Resolution), described in [RFC 4795](https://www.rfc-editor.org/rfc/rfc4795), resolves host names only: its abstract says it operates only on the local link and cannot be considered a substitute for DNS, and the RFC is an informational memo, not an Internet standard. In short, mDNS discovers names and services, SSDP discovers UPnP devices with an HTTP-flavored message, and LLMNR resolves the name of one machine.

## Where file-transfer tools use it

Nearby-sharing systems use these building blocks. The USENIX Security 2019 study of Apple's AirDrop found that the sender uses mDNS and DNS-SD over the direct Wi-Fi link to look for AirDrop service instances; [how Apple's AirDrop works](/blog/how-airdrop-works/) follows the whole sequence. One community reverse-engineering effort documents Quick Share advertising an mDNS service when two Android devices are on the same Wi-Fi network, as covered in [how Quick Share works](/blog/how-quick-share-works/).

## What this means for sending files between your own devices

Discovery is the first half of every transfer: before bytes can move, one device has to learn the other's address and port. On a single home Wi-Fi network without isolation, mDNS makes that effortless. On a guest network, a hotel network or a work network with separated segments, it quietly fails, and "I can't see my other device" is the usual symptom.

A web page cannot send raw multicast packets itself, so browser-based tools introduce devices in other ways, such as a short code, a QR code, or a rendezvous point reachable over the internet. AnyAirDrop.com is our own tool and works like this: devices on the same Wi-Fi are found automatically, or you can pair them with a 6-digit code or QR code when automatic discovery is blocked. Underneath, [WebRTC](/blog/webrtc-data-channels-explained/) then sets up the direct connection.

## Common questions

### What port does mDNS use?

UDP port 5353. RFC 6762 specifies it, together with the multicast addresses 224.0.0.251 (IPv4) and FF02::FB (IPv6).

### Is Bonjour the same as mDNS?

Bonjour is Apple's implementation and brand name for zero-configuration networking, and it uses mDNS and DNS-SD. The terms are often used interchangeably, but mDNS is the protocol and Bonjour is a product.

### Why can't my devices find each other on guest Wi-Fi?

Guest networks often enable client isolation or place guests on a separate segment, and multicast does not cross either. The devices can still reach the internet but not each other. Connecting both to the main network, or to a network without isolation, usually fixes it.

### Does mDNS work across different subnets or VLANs?

Not by default. The multicast traffic is link-local, so it stays on one segment. A repeater, reflector or gateway feature on the router, or an Avahi reflector, can copy it between segments if you want discovery to cross them.

### Is mDNS secure?

The base protocol has no authentication, so on an untrusted network anyone on the same segment can announce a service or answer a query, and a device may expose more than you expect by announcing itself. Use it on networks you trust, and see [is local file transfer safe?](/blog/is-local-file-transfer-safe-encryption-explained/) for how transfers themselves are protected.

## Key takeaways

- mDNS sends DNS-format questions by multicast to 224.0.0.251 or FF02::FB on UDP port 5353, so devices find each other without a server.
- DNS-SD names services with PTR, SRV and TXT records, so one query lists every printer or file-sharing service on the network.
- Bonjour, Avahi and Android's NSD are implementations of the same ideas.
- Multicast is link-local, so mDNS stops at routers, and client isolation, guest networks, VLANs and some VPNs break it.
- SSDP and LLMNR are different protocols with different addresses and ports.
- Discovery is the first step of local transfer; when it fails, a code or QR pairing step can replace it.

## Sources

- IETF: [RFC 6762, Multicast DNS](https://www.rfc-editor.org/rfc/rfc6762)
- IETF: [RFC 6763, DNS-Based Service Discovery](https://www.rfc-editor.org/rfc/rfc6763)
- IETF: [RFC 4795, Link-Local Multicast Name Resolution (LLMNR)](https://www.rfc-editor.org/rfc/rfc4795)
- Open Connectivity Foundation: [UPnP Device Architecture 2.0](https://openconnectivity.org/upnp-specs/UPnP-arch-DeviceArchitecture-v2.0-20200417.pdf)
- Apple Developer: [Bonjour](https://developer.apple.com/bonjour/)
- Avahi: [Avahi service discovery](https://avahi.org/)
