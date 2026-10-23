---
title: "How a Router Works: DHCP, DNS and NAT Explained Step by Step"
description: "Follow one laptop opening a web page: it gets an address from DHCP, looks up a name with DNS, and has its traffic rewritten by NAT. See each step and the table."
topic: "routers-and-networks"
order: 2
publishDate: 2026-10-23
heroImage: "./images/diagram.svg"
heroAlt: "Diagram of a laptop, a router and a web server, with the router's translation table showing private addresses and ports mapped to one public address with different ports"
related:
  - "private-ip-addresses-and-local-networks"
  - "modem-vs-router-vs-access-point"
  - "stun-turn-ice-explained"
  - "client-isolation-guest-networks-and-device-visibility"
---

Before a laptop can load a single web page, your router does three small jobs for it. It lends the laptop an address (DHCP), helps it turn a website name into a number (DNS), and then rewrites every outgoing packet so that dozens of devices at home can share the one public address your provider gave you (NAT). The same rewriting also explains why strangers on the internet cannot simply connect in.

**Short answer:** DHCP assigns each device a private address and tells it where the router and DNS server are. DNS converts names like a website's domain into IP addresses. NAT keeps a table that maps each device's private address and port to the router's public address and a unique port, and only traffic that matches the table is allowed back in.

## The setting: a laptop joins your network

Take a laptop that has just joined your home Wi-Fi. At the radio level it is connected (see [how Wi-Fi works](/blog/how-wifi-works/)), but at the network level it has no identity yet. It does not know its own IP address, who else is on the network, or where the exit to the internet is. The router, which sits at the border between your home network and your provider (see [modem vs router vs access point](/blog/modem-vs-router-vs-access-point/)), supplies all three.

The addresses in this walkthrough are illustrative. The "public" ones come from ranges that are reserved for examples in documentation, so they will not match any real service.

## Step 1: DHCP gives the laptop an address

DHCP stands for Dynamic Host Configuration Protocol, defined in [RFC 2131](https://www.rfc-editor.org/rfc/rfc2131). It works as a four-message conversation, often remembered by the letters DORA:

1. **Discover.** The laptop has no address, so it broadcasts a message to everyone on the local network: "is there a DHCP server?" It sends this from the placeholder address 0.0.0.0 to the broadcast address 255.255.255.255, using UDP port 68 to reach port 67.
2. **Offer.** The router, which runs the DHCP server, replies with a proposal: an address that is not in use, plus the other settings.
3. **Request.** The laptop broadcasts that it accepts the offer. Broadcasting this step tells any other DHCP server that its offer was declined.
4. **Acknowledge.** The router confirms, and the laptop can now use the address.

The offer carries more than an address. A typical lease says:

| Setting | Example value | What it is for |
| --- | --- | --- |
| IP address | 192.168.1.23 | The laptop's identity on the local network |
| Subnet mask | 255.255.255.0 | Which addresses count as "local" (see [private IP addresses](/blog/private-ip-addresses-and-local-networks/)) |
| Default gateway | 192.168.1.1 | The router, the exit for everything that is not local |
| DNS server | 192.168.1.1 | Where to ask name questions |
| Lease time | 24 hours | How long the laptop may keep the address |

The word *lease* is deliberate. The address is borrowed, not owned. The laptop starts asking to renew it when half of the lease has passed, and if the original server is silent it broadcasts a more urgent request later, at 87.5 percent of the lease. This is why the same device usually keeps the same address from day to day: it keeps renewing, and the router tends to hand the same address back when the device returns.

## Step 2: ARP finds the router's hardware address

The laptop now knows it should send non-local traffic to 192.168.1.1, but on a local network frames are delivered by hardware address, not IP address. It broadcasts a question, "who has 192.168.1.1?", using ARP (Address Resolution Protocol, [RFC 826](https://www.rfc-editor.org/rfc/rfc826)), and the router answers with its MAC address. The laptop remembers the answer for a while. [MAC addresses](/blog/mac-address-and-private-wifi-addresses/) are explained in their own guide.

## Step 3: DNS turns a name into a number

You typed a name, but networks route numbers. DNS, the Domain Name System, is the lookup service that connects them. Your laptop sends a small UDP query, usually to port 53 on the DNS server it was told about, asking for the address of, say, `www.example.com`.

In most homes the DNS server in the lease is the router itself. The router does not own the answer. It acts as a *forwarder*: it passes the question on to a resolver run by your provider or a public service you have configured, and the resolver does the work of asking the internet's name servers. The answer comes back to the router, which remembers it for a short time (its *cache*) and relays it to the laptop. Ask again a minute later, and the router can answer from memory without bothering anyone.

Say the answer is 203.0.113.80. The name has become an address, and the laptop can start a connection.

## Step 4: NAT rewrites the packet

The laptop opens a connection to 203.0.113.80 on port 443 (the standard port for secure websites). It picks a random source port for its end, say 52144, and sends the first packet from 192.168.1.23:52144. A packet leaving the building like that would be useless. Addresses beginning 192.168 are private and appear in millions of homes, so no router on the internet would know which one to send replies to.

This is where NAT, network address translation ([RFC 3022](https://www.rfc-editor.org/rfc/rfc3022)), steps in. The common form used at home is called *NAPT* or *PAT* (port address translation), because it translates the port as well as the address. When the packet reaches the router:

1. The router checks its translation table and finds no entry for this connection, so it creates one.
2. It replaces the source address with its own public address, 198.51.100.17, and the source port with a free one, say 40211.
3. It forwards the rewritten packet to the internet.

The table now looks like this:

| Inside (private) | Outside (public) | Remote end | Protocol |
| --- | --- | --- | --- |
| 192.168.1.23:52144 | 198.51.100.17:40211 | 203.0.113.80:443 | TCP |
| 192.168.1.31:49822 | 198.51.100.17:40212 | 203.0.113.80:443 | TCP |
| 192.168.1.23:57003 | 198.51.100.17:40213 | 198.51.100.200:53 | UDP |

Look at the first two rows. Two devices (a laptop and a phone) are talking to the same web server, yet the server sees two connections from the same public address, told apart only by port numbers 40211 and 40212. That is the trick that lets a whole household share one address. A port is a 16-bit number, so there are at most 65,535 of them, which is plenty for a home.

When the web server replies, it sends the packet to 198.51.100.17:40211. The router looks that up, finds the first row, rewrites the destination back to 192.168.1.23:52144 and delivers it. The laptop never knows any of this happened.

## Step 5: the stateful firewall and unsolicited traffic

The table does double duty as a security feature. A router that tracks connections like this is called *stateful*. It remembers which conversations your devices started, and it lets replies to those, and only those, back in.

Now imagine a stranger sends a packet to 198.51.100.17:40300. No row matches, so the router has no idea which device it is for. The only safe answer is to drop it. That is the reason a home network is hard to reach from outside by default. It is not that a rule says "block strangers"; there is simply no inside device the packet could be translated to.

Entries expire. For UDP, which has no built-in notion of a connection, the router guesses that a conversation is over when it has been silent for a while. The IETF's recommendations for NAT behavior ([RFC 4787](https://www.rfc-editor.org/rfc/rfc4787)) say the timer should not be shorter than two minutes, and recommend five minutes or more by default. Outgoing packets refresh the timer, which is why applications that must keep a path open send small "keepalive" packets every so often.

There are two deliberate ways to open the door. **Port forwarding** is a permanent row that you add by hand: "anything arriving at public port 25565 goes to 192.168.1.50:25565". **UPnP** (Universal Plug and Play) lets a program on your network request such a row automatically, if the router supports it and it has not been turned off. Both are exceptions to the default protection, and worth knowing about because they are how games and servers become reachable.

## What NAT means for peer-to-peer connections

NAT creates an awkward situation when two people at different homes want to connect straight to each other. Each is behind a router, and each router only lets in replies to connections that were started from inside. If both sides simply wait for the other to call, nothing happens.

The standard solution is for both sides to send packets toward each other at roughly the same moment, so that each router creates an outgoing row, which the other side's packets then match. This is called *hole punching*, and it is one of the jobs of ICE, STUN and TURN, which we cover in [STUN, TURN and ICE explained](/blog/stun-turn-ice-explained/). It generally depends on the router reusing the same outside port for the same inside device regardless of destination, a behavior that RFC 4787 calls *endpoint-independent mapping*. Routers that assign a different outside port for every destination can defeat it, and then a relay server has to carry the traffic instead.

## What this means for sending files between your own devices

None of this machinery is involved when both devices are on the same Wi-Fi. NAT applies only when traffic crosses the router's border. A phone sending a photo to a laptop on the same network sends it to the laptop's private address, which is on the local side, so there is no translation, no outgoing row and no firewall decision. The router acts as a simple switch.

This has a useful consequence for how nearby sharing works. The first obstacle between two devices at home is not NAT but *discovery*: how does one device learn the other's address? That is usually done with local broadcast or multicast messages (see [mDNS and Bonjour](/blog/mdns-bonjour-device-discovery/)), which a router does not forward off the network and which some Wi-Fi setups block (see [client isolation](/blog/client-isolation-guest-networks-and-device-visibility/)).

AnyAirDrop.com is our own tool, and it uses the same fact. When two devices are on the same network, the browsers can connect directly with their private addresses and no NAT hole punching is needed. When they are on different networks, such as a phone on mobile data and a laptop on home Wi-Fi, NAT is back in the picture, and the connection depends on the techniques above, with an encrypted relay as a last resort.

## Common questions

### What is the difference between DHCP and DNS?

DHCP gives a device its own address and its network settings when it joins. DNS answers a different question later: what number does this website name correspond to? DHCP happens once per lease, DNS happens every time you visit a new name, and the DHCP lease usually tells the device which DNS server to use.

### Does NAT protect me like a firewall?

It gives a side effect that looks like one, because inbound packets with no matching table row are dropped. But NAT is not designed as a security feature, and it does nothing about malware that connects out from inside, or about forwarded ports. Treat it as a useful default, not a complete defense.

### Why does my router show a different IP address than my laptop?

The router has a public (WAN) address assigned by your provider, and your laptop has a private (LAN) address from the router's DHCP server. Every device in your home appears to the internet as the router's public address. If the router's WAN address is itself a private-looking one, your provider is running NAT as well, as explained in [private IP addresses and local networks](/blog/private-ip-addresses-and-local-networks/).

### What happens when the DHCP lease runs out?

The device normally renews long before that, at about half the lease time. If the router is unreachable for the whole lease, the device must give up its address and ask again. If no DHCP server answers, many devices give themselves a self-assigned 169.254.x.x address, which allows local contact but not internet access.

### Why can't I just connect to my home PC from outside?

Because the router has no table row for an unsolicited connection. You would need port forwarding, a VPN into the network, or a service that makes an outgoing connection from home and acts as the meeting point.

## Key takeaways

- DHCP lends each device an address plus the gateway, subnet mask and DNS server, using a four-message exchange (discover, offer, request, acknowledge).
- A home router usually acts as the DNS forwarder, passing questions to a resolver and caching the answers.
- NAT (in its port-translating form) rewrites each outgoing connection to the router's public address and a unique port, and records it in a table so replies can find their way back.
- Because inbound packets need a matching table row, the default behavior blocks unsolicited connections from the internet.
- NAT is what makes direct connections between devices on different networks tricky, and it plays no part when two devices share one local network.

## Sources

- IETF: [RFC 2131, Dynamic Host Configuration Protocol](https://www.rfc-editor.org/rfc/rfc2131)
- IETF: [RFC 3022, Traditional IP Network Address Translator](https://www.rfc-editor.org/rfc/rfc3022)
- IETF: [RFC 4787, NAT Behavioral Requirements for Unicast UDP](https://www.rfc-editor.org/rfc/rfc4787)
- IETF: [RFC 826, An Ethernet Address Resolution Protocol](https://www.rfc-editor.org/rfc/rfc826)
- IETF: [RFC 1034, Domain Names: Concepts and Facilities](https://www.rfc-editor.org/rfc/rfc1034)
