---
title: "Private IP Addresses and Local Networks: Why 192.168.x.x Is Everywhere"
description: "Three address blocks are reserved for private use. See how a subnet mask decides local or not, what 169.254 and 100.64 addresses mean, and the IPv6 equivalents."
topic: "routers-and-networks"
order: 3
publishDate: 2026-10-23
heroImage: "./images/diagram.svg"
heroAlt: "Diagram showing how a device at 192.168.1.23 with a 24-bit mask compares the first three numbers of a destination to decide whether to deliver locally or send to the router"
related:
  - "how-a-router-works-nat-dhcp-dns"
  - "mac-address-and-private-wifi-addresses"
  - "client-isolation-guest-networks-and-device-visibility"
  - "modem-vs-router-vs-access-point"
---

A private IP address is one from a block set aside for use inside homes, offices and campuses, and it is never routed across the public internet. Your router hands them out, which is why so many devices around the world share the same ones. The address 192.168.1.23 exists in millions of homes at once, and that is not a conflict, because each home is its own separate network.

**Short answer:** three ranges are reserved for private use (10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16). A device compares the first part of any destination address with its own, using the subnet mask, to decide whether to deliver directly on the local network or hand the packet to the router. Two devices on the same private network send each other data directly, without it ever reaching the internet.

## What an IP address is

An IPv4 address is a 32-bit number, written as four 8-bit pieces separated by dots, such as 192.168.1.23. Each piece is a number from 0 to 255, so the whole address is 4 bytes. There are about 4.3 billion possible values (2 to the power 32), which sounded like plenty in the 1980s and turned out not to be.

Every address has two parts: a *network* part that says which network it is on, and a *host* part that says which device on that network it is. The question is where the dividing line falls, and that is the job of the subnet mask.

## The three private ranges

The internet's rules for private addressing are written in [RFC 1918](https://www.rfc-editor.org/rfc/rfc1918). It reserves three blocks that anyone may use inside their own organization, as long as they are not announced to the wider internet:

| Block | Range | Addresses | Where you see it |
| --- | --- | --- | --- |
| 10.0.0.0/8 | 10.0.0.0 to 10.255.255.255 | 16,777,216 | Large offices, campuses, some routers |
| 172.16.0.0/12 | 172.16.0.0 to 172.31.255.255 | 1,048,576 | Mid-sized networks, some container tools |
| 192.168.0.0/16 | 192.168.0.0 to 192.168.255.255 | 65,536 | Almost every home router |

The slash notation, called CIDR (classless inter-domain routing), counts how many of the 32 bits belong to the network part. In 192.168.0.0/16, the first 16 bits (192.168) are fixed and the remaining 16 bits are free, giving 2 to the power 16, or 65,536, addresses. In 10.0.0.0/8, only 8 bits are fixed, which leaves 24 free bits and over 16 million addresses.

The RFC's central idea is that these addresses "will only be unique within the enterprise". Because they never leave the local network, two organizations can use the same one without clashing, and nobody needs to ask permission or register them.

### Why 192.168.x.x is everywhere

There is no rule saying home routers must use 192.168. It is convention: router makers picked it as the factory default, usually with the router itself at 192.168.0.1 or 192.168.1.1, and the habit stuck because every new product copied the defaults of the last. It suits homes because a /24 inside it (254 usable addresses, see below) is far more than a household needs, and the numbers are short to type. Some routers and many corporate networks use 10.x.x.x instead, and you may meet 172.16 to 172.31 in container and virtual-machine tools.

## The subnet mask: how a device decides "local or not"

Here is the question every device asks for every packet it sends: is the destination on my own network, or does it need to go through the router?

The subnet mask answers it. A mask of 255.255.255.0 is the same as /24: in binary, 24 ones followed by 8 zeros. Where the mask has a one, the bit belongs to the network part. Where it has a zero, the bit belongs to the host part.

The test is a bitwise AND of the address with the mask. Here is the full arithmetic for a laptop at 192.168.1.23 with mask 255.255.255.0:

- The laptop's own network: 192.168.1.23 AND 255.255.255.0 gives **192.168.1.0**.
- Destination A, 192.168.1.40: AND with the mask gives **192.168.1.0**. This matches, so the destination is local. The laptop finds its hardware address with ARP (see [MAC addresses](/blog/mac-address-and-private-wifi-addresses/)) and sends the data directly.
- Destination B, 203.0.113.80: AND with the mask gives **203.0.113.0**. No match, so the laptop sends the packet to its default gateway, 192.168.1.1, and lets the router figure out the rest.

Because only the last octet is the host part, a /24 holds 2 to the power 8, or 256, addresses. Two are reserved: the first (192.168.1.0) names the network itself, and the last (192.168.1.255) is the broadcast address meaning "everyone on this network". That leaves **254 usable device addresses**, from .1 to .254.

Change the mask and the answer changes. If the same network were 192.168.0.0/23 (mask 255.255.254.0), the network part would stop one bit earlier, covering 512 addresses from 192.168.0.0 to 192.168.1.255. A device at 192.168.0.5 would treat 192.168.1.40 as local, while a device with a /24 mask at the same address would send it to the router.

That last point is a common cause of confusing behavior. If two devices have different masks, or one is on 192.168.1.x and the other on 192.168.2.x, they disagree about what is local, and a perfectly healthy network can seem broken.

## Special ranges you may spot

A few other ranges turn up in network settings and tell you something useful.

### 169.254.x.x: DHCP failed

Addresses in 169.254.0.0/16 are *link-local*, defined in [RFC 3927](https://www.rfc-editor.org/rfc/rfc3927). If a device asks for an address with DHCP and nobody answers, it picks a random address in this block and sends several ARP queries to check that nobody else is using it. If none arrives, it keeps the address. Link-local addresses work only on the same local network and are never routed. If your phone or laptop shows 169.254 something, it means the router did not hand out an address, so the device can reach neighbors in the same state but not the internet. Windows has historically called this feature *APIPA*, short for automatic private IP addressing.

### 100.64.0.0/10: carrier-grade NAT

The block 100.64.0.0/10, from 100.64.0.0 to 100.127.255.255, is called *shared address space* ([RFC 6598](https://www.rfc-editor.org/rfc/rfc6598)). Providers use it to number the connections between their own big NAT equipment and customer routers. If your router's WAN address (the outside address, shown on its status page) lies in this range, or is a private address of any kind, your provider is doing a second round of NAT, called *CGNAT* (carrier-grade NAT). Connections to your home from outside will not work without help, and you share a public address with other customers. Your local network is unaffected.

This also gives a simple check: compare the WAN address shown on your router's status page with the address that "what is my IP" websites report. If they differ, there is another NAT in between, either your provider's or another router of your own, as in the double-NAT case from [modem vs router vs access point](/blog/modem-vs-router-vs-access-point/).

### 127.0.0.1: the device itself

Addresses beginning with 127 loop back to the same device. They are used when a program on a machine talks to another program on the same machine.

## Public versus private

A *public* address is one that is unique across the whole internet and can be routed to. Your router has one (or sometimes a CGNAT address) on its WAN side. Everything else on your network borrows it, using NAT as explained in [how a router works](/blog/how-a-router-works-nat-dhcp-dns/). Private addresses stay private by agreement: providers and internet routers are expected to drop them, so a packet addressed to 192.168.1.23 from the outside never reaches your laptop.

This is also why you cannot look at a device's address and know where it is. All that 192.168.1.23 tells you is that it is the device a particular router numbered 23 in its own network.

## IPv6 has private-style addresses too

IPv6 addresses are 128 bits long, written in hexadecimal groups with colons, which gives so many addresses that every device can have a globally unique one. The home equivalents of the ranges above are:

- **Link-local, fe80::/10.** Every IPv6 interface has one automatically. Routers must not forward packets with link-local addresses to other links ([RFC 4291](https://www.rfc-editor.org/rfc/rfc4291)). They are used for basic housekeeping on the local network.
- **Unique local, fc00::/7.** Defined in [RFC 4193](https://www.rfc-editor.org/rfc/rfc4193), these are the counterpart to RFC 1918, meant for use inside a site and not routed on the global internet. In practice they usually begin with fd.
- **Global unicast.** The addresses that do route across the internet. Many home IPv6 networks give each device one of these as well, and rely on the router's firewall rather than NAT to keep unwanted inbound traffic out.

A device on a modern home network may therefore have an IPv4 private address, an IPv6 link-local address and one or more IPv6 global addresses at the same time.

## Why two devices on the same network never touch the internet

When your laptop sends something to 192.168.1.40, the destination test above says "local". The laptop builds a frame addressed to that device's hardware address and sends it out. On Wi-Fi it travels to the access point and is relayed to the other device; on Ethernet, it passes through a switch. The router's WAN port, the modem and your internet provider are never involved. The packet uses the router's local side only, and in the Wi-Fi case that side is the access point plus a built-in switch.

This is why local transfers continue to work when your internet connection is down, and why they are unaffected by your provider's upload speed. [Local transfer vs cloud upload](/blog/local-transfer-vs-cloud-upload/) puts numbers on that difference.

## What this means for sending files between your own devices

For two devices to talk directly, three things must hold. They must be on the same subnet (the same network part), nothing in between may block them (see [client isolation and guest networks](/blog/client-isolation-guest-networks-and-device-visibility/)), and one must know the other's address.

The first condition is the one people most often miss. A phone on 192.168.1.x and a laptop on 192.168.2.x are on different networks even if both show the same Wi-Fi name, which happens with extenders that run their own network and with guest networks. In that case their packets must go through a router, and discovery that relies on local broadcast does not cross it.

A quick check works on any phone or computer. Open the Wi-Fi details and compare the addresses of the two devices. If the first three numbers match and the mask is 255.255.255.0, they are on the same network. AnyAirDrop.com is our own tool, and when devices share a network like this, its browsers can reach each other directly using these private addresses, with the transfer staying inside your home.

## Common questions

### Is 192.168.0.1 or 192.168.1.1 my router?

On most home networks, yes, one of them is your router's LAN address, because makers use the first address of the block as the default gateway. Your device's network settings list the actual gateway, which is the reliable answer.

### Can two devices have the same private IP address?

Not on the same network. Two devices with the same address on one network cause conflicts, so DHCP avoids handing out duplicates and devices that set addresses by hand should pick ones outside the DHCP range. Two devices on different networks can share an address without any problem.

### Why does my device show 169.254?

Because it asked for an address and nobody answered. Check that the router is on, that you are connected to the right network, and that DHCP is enabled on the router. Restarting the router or reconnecting usually fixes it.

### Is my private IP address a privacy problem?

Not much. It is only meaningful inside your own network and is hidden from the internet by NAT. What websites see is your router's public address, which is a separate thing.

### What does /24 mean?

It means the first 24 bits of the address are the network part. It is the same as the subnet mask 255.255.255.0 and leaves 8 bits for devices, so 254 usable addresses.

## Key takeaways

- Three blocks, 10.0.0.0/8, 172.16.0.0/12 and 192.168.0.0/16, are reserved for private networks and are never routed across the internet.
- The subnet mask splits an address into network and host parts; a device compares destination and own network parts to decide between direct delivery and the router.
- A /24 network has 256 addresses, of which 254 are usable by devices.
- 169.254.x.x means DHCP failed, and 100.64.0.0/10 on your router's WAN side means your provider is using carrier-grade NAT.
- Devices on the same private network exchange data without the traffic touching the internet, provided they share a subnet and nothing blocks them.

## Sources

- IETF: [RFC 1918, Address Allocation for Private Internets](https://www.rfc-editor.org/rfc/rfc1918)
- IETF: [RFC 3927, Dynamic Configuration of IPv4 Link-Local Addresses](https://www.rfc-editor.org/rfc/rfc3927)
- IETF: [RFC 6598, IANA-Reserved IPv4 Prefix for Shared Address Space](https://www.rfc-editor.org/rfc/rfc6598)
- IETF: [RFC 4193, Unique Local IPv6 Unicast Addresses](https://www.rfc-editor.org/rfc/rfc4193)
- IETF: [RFC 4291, IP Version 6 Addressing Architecture](https://www.rfc-editor.org/rfc/rfc4291)
