---
title: "Wi-Fi Security Explained: WPA2 vs WPA3 and What Encryption Covers"
description: "How WEP, WPA2 and WPA3 differ, why WPA3's SAE resists offline password guessing, what a weak password costs, and what Wi-Fi encryption does not protect."
topic: "wifi-basics"
order: 7
publishDate: 2026-10-23
heroImage: "./images/diagram.svg"
heroAlt: "Diagram showing a phone and another device connected to a router by encrypted radio links, with encryption ending at the router and only HTTPS protecting traffic beyond it"
related:
  - "how-wifi-works"
  - "client-isolation-guest-networks-and-device-visibility"
  - "is-local-file-transfer-safe-encryption-explained"
  - "wifi-bands-2-4-5-6-ghz"
---

Wi-Fi security scrambles the radio link between your device and the router, so someone standing outside cannot read your traffic. WPA3 is the current protocol, WPA2 is still widely used and sound when the password is strong, and WEP and the original WPA are broken. What none of them does is protect your data beyond the router, or fully separate the devices that are already on your network.

**Short answer:** use WPA3 if all your devices support it, otherwise WPA2 with a long random passphrase, and turn off WPS. Wi-Fi encryption protects only the air between a device and the router. It does not make a website, a file server or another device on your network any safer.

## Four generations of Wi-Fi security

| Protocol | Introduced | How it encrypts | Status |
| --- | --- | --- | --- |
| WEP (Wired Equivalent Privacy) | 1999 | RC4 cipher with a 24-bit per-packet value | Broken since 2001; recoverable in minutes |
| WPA (Wi-Fi Protected Access) | 2003 | TKIP, a patch over RC4 for old hardware | Retired; do not use |
| WPA2 | 2004 | AES in CCMP mode | Still common; safe with a strong passphrase |
| WPA3 | 2018 | AES, with a new password exchange (SAE) | Current; mandatory for certified devices |

WEP failed because its 24-bit initialization value repeated quickly and its key handling leaked key bits; Fluhrer, Mantin and Shamir described the attack in 2001, and tools later made it routine. WPA was an emergency fix that ran on WEP-era chips. WPA2 replaced the cipher with AES, which remains sound. WPA3 keeps AES and changes how the password is turned into keys, which is where WPA2's weakness lay. The Wi-Fi Alliance states that [WPA3 is mandatory for Wi-Fi CERTIFIED devices](https://www.wi-fi.org/discover-wi-fi/security), so new devices increasingly support it.

WPA2 had one other well-known flaw, the 2017 KRACK attack, which exploited how the handshake could be made to reuse a key. It was fixed through software updates, a reminder that updating router and device firmware matters.

## How WPA2 turns a password into keys

In WPA2-Personal (also called WPA2-PSK, for pre-shared key), the passphrase is processed once into a 256-bit master key. The process, called PBKDF2, runs 4,096 rounds of a hash function and mixes in the network name (the SSID) as a *salt*, a value that makes precomputed tables useless across different network names.

Then comes the *four-way handshake*, which happens whenever a device joins:

1. The router sends a random number (the ANonce).
2. The device sends its own random number (the SNonce) and a code proving it knows the master key.
3. The router checks that code, then confirms and delivers a group key.
4. The device acknowledges. Both sides now use session keys derived from the master key, both random numbers and both devices' addresses.

The password is never transmitted. The weakness is subtler. Anyone in radio range who records the first two messages has everything needed to test a guess: pick a candidate passphrase, run the same derivation, and see whether the proof code matches. That check is done at the attacker's own computer, with no further contact with your network, so nothing limits the guess rate except computing power. This is an *offline* attack.

### What a weak password costs

The table below assumes an attacker who can test one million guesses per second. The real rate depends on hardware, and an attacker can use many graphics cards, so treat it as illustrative. The passwords are random; human-chosen ones, such as a pet's name followed by digits, fall far sooner because attackers try likely words first.

| Passphrase | Possibilities | Time at 1 million guesses/second |
| --- | --- | --- |
| 8 random digits | 10^8 = 100 million | about 100 seconds |
| 8 random lowercase letters | 26^8 ≈ 2.1 × 10^11 | about 2.4 days |
| 8 random letters and digits (62 symbols) | 62^8 ≈ 2.2 × 10^14 | about 6.9 years |
| 4 random words from a 7,776-word list | 7,776^4 ≈ 3.7 × 10^15 | about 116 years |
| 12 random lowercase letters | 26^12 ≈ 9.5 × 10^16 | about 3,000 years |

Length and randomness do the work. A 12-letter random passphrase beats an 8-character "complex" one. WPA2 allows passphrases of 8 to 63 characters, so there is room to use a long one.

## WPA3-Personal and SAE

WPA3-Personal replaces the password step with *Simultaneous Authentication of Equals* (SAE), a form of the Dragonfly key exchange described in [RFC 7664](https://www.rfc-editor.org/rfc/rfc7664). The RFC's abstract states that it is resistant to active attack, passive attack and offline dictionary attack.

Roughly, each side converts the password into a point on an elliptic curve, then contributes a fresh random value to a public exchange. Both arrive at the same shared secret only if they hold the same password, and the secret depends on random values that exist only for this session. A recording of the exchange does not let an attacker test guesses at home, because the transcript is not enough to confirm a candidate. Each guess requires a live exchange with the router, which makes the attack *online* and lets the router slow it down.

Two further benefits follow:

- **Forward secrecy.** Each session's keys come from fresh random values. If someone learns your password next year, they cannot decrypt traffic they recorded today. In WPA2, someone who recorded both the handshake and the traffic can.
- **Per-device separation.** In WPA2-PSK, an insider who knows the password and records another device's handshake can derive that device's session keys and read its traffic. In WPA3 they cannot.

SAE is not magic. In 2019 researchers published the Dragonblood findings, which showed implementation flaws such as timing leaks and downgrade tricks in early products, and these were addressed through updates. A short, guessable password is still guessable online. SAE removes the cheap offline route, not the need for a decent password.

## Protected management frames

Wi-Fi has *management frames* for housekeeping, such as "you are disconnected" (deauthentication). In older networks these were unauthenticated, so anyone nearby could forge one and kick a device off, which is also a step in some attacks. *Protected management frames* (PMF, from the 802.11w amendment) authenticate them so forged ones are ignored. The Wi-Fi Alliance says PMF is [required for all new certified devices](https://www.wi-fi.org/discover-wi-fi/security), and WPA3 mandates it. PMF does not stop plain jamming, which blocks the radio itself.

## Open networks and Enhanced Open (OWE)

An open network has no encryption at all, so anyone in range can read what is not otherwise protected. A shared password written on a café wall gives little more: in WPA2, everyone who knows it can potentially read the others' traffic.

*Opportunistic Wireless Encryption* (OWE), sold as Wi-Fi Enhanced Open, fixes the eavesdropping half of that without a password. During association each side sends a public key, they run a Diffie-Hellman exchange, and each device gets its own keys. [RFC 8110](https://www.rfc-editor.org/rfc/rfc8110) specifies it, and it states plainly that OWE provides no authentication: a client cannot verify that the access point is the real one, so an impersonating access point can still intercept traffic. OWE defends against passive snooping, not against a fake hotspot.

## Transition mode

Many routers offer *WPA2/WPA3 transition mode*, advertising both on one network name with one password. WPA3 devices use SAE and older devices use WPA2. It eases upgrades, but the WPA2 half still exposes the offline-guessing route, because an attacker can target that handshake, and a forced downgrade is possible in some setups. If every device supports WPA3, choose WPA3 only. Note too that the 6 GHz band only permits modern security; see [Wi-Fi bands compared](/blog/wifi-bands-2-4-5-6-ghz/).

## WPS: the setup shortcut to turn off

Wi-Fi Protected Setup (WPS) lets a device join by entering an 8-digit PIN or pressing a button. The PIN mode has a design flaw: the router confirms the first four digits separately from the next three, and the eighth is a checksum. CERT/CC's [vulnerability note VU#723755](https://www.kb.cert.org/vuls/id/723755) says this cuts the guesses needed from 10^8 to 10^4 + 10^3, or 11,000 attempts, and that many routers lacked a lockout. A strong Wi-Fi password does not help if WPS PIN entry is enabled. Disable it in the router's settings; where the option lives varies by brand.

## What Wi-Fi encryption protects, and what it does not

**It protects the air link.** Between your device and the router, an outsider sees scrambled data.

**It does not protect beyond the router.** The router decrypts your traffic, so it sees everything that is not otherwise encrypted, and anything on the internet side is protected only if the connection itself is encrypted, as HTTPS is for websites.

**It does not fully separate devices on the same network.** Everyone who joins is trusted to some degree. On a shared WPA2 password, members can try to read each other's traffic as described above. Even on WPA3, devices on one network can usually reach each other's open services, which is how printers and file shares work. [Client isolation and guest networks](/blog/client-isolation-guest-networks-and-device-visibility/) explains the router feature that blocks this.

**It does not protect the device.** Malware on a phone sees the data before encryption.

**It does not hide that you are communicating.** Observers can see that frames exist, their size and timing, and device addresses, which is the subject of [MAC addresses and private Wi-Fi addresses](/blog/mac-address-and-private-wifi-addresses/).

## Sending files over a network you share with other people

On your own home network, the router and the other household devices are the trusted parties, and Wi-Fi encryption keeps neighbors out. The risk rises on shared networks: a café, a hotel, a school or an office, where many strangers share one password or one open network. There, the Wi-Fi layer protects you only from people outside the network, and a file sent without its own encryption can be visible to others on it.

That makes the transfer method's own encryption the part that matters. Plain HTTP and FTP send files and logins readable; HTTPS, SFTP and similar protocols encrypt end to end. [Local file sharing protocols compared](/blog/local-file-sharing-protocols-smb-ftp-http-sftp/) goes through them, and [whether local file transfer is safe](/blog/is-local-file-transfer-safe-encryption-explained/) covers what end-to-end encryption protects.

AnyAirDrop.com is our own tool, and it sends files directly between two browsers using WebRTC, which encrypts the data between those two devices, and the receiver must tap Accept. That encryption is a separate layer from Wi-Fi security, so the file stays protected from other people on a shared network too, but treat the guarantee as the protocol's, not as a substitute for choosing a network you can trust.

## Common questions

### Is WPA2 still safe?

Yes, with a long random passphrase and up-to-date firmware. Its main weakness is that a weak password can be guessed offline from a recorded handshake. WPA3 removes that route, so prefer it when your devices support it.

### Should I switch to WPA3?

If your router and all your devices support it, yes. If some do not, use transition mode as a stopgap, or put old devices on a separate network. Support varies by device age, so check each device's specifications.

### Does hiding my network name make Wi-Fi safer?

No. A hidden network still appears in frames sent by connecting devices, and tools reveal it quickly. It can also make your devices broadcast the name when searching. The password and protocol are what protect you.

### Is public Wi-Fi with a password safe?

It is safer than an open network, but everyone sharing that password can try to read the others' traffic on WPA2, and you cannot verify the router. Use HTTPS-only sites and apps that encrypt end to end, or a trusted VPN.

### What is the difference between Personal and Enterprise?

Personal uses one shared password for everyone. Enterprise gives each user their own credentials checked by a server, so one person leaving does not mean changing the password for all. It is common in offices and universities.

## Key takeaways

- WEP and WPA are broken; WPA2 is acceptable with a strong passphrase; WPA3 is the best current choice.
- WPA2's weakness is that a recorded handshake lets attackers guess passwords offline; WPA3's SAE removes that and adds forward secrecy.
- Length and randomness decide password strength: 12 random lowercase letters outlast 8 random letters and digits by a wide margin.
- Disable WPS PIN entry, which reduces 10^8 guesses to 11,000.
- Wi-Fi encryption covers only the air link; use end-to-end encryption for what you send, especially on networks shared with strangers.

## Sources

- Wi-Fi Alliance: [Wi-Fi Security](https://www.wi-fi.org/discover-wi-fi/security)
- IETF: [RFC 7664, Dragonfly Key Exchange](https://www.rfc-editor.org/rfc/rfc7664)
- IETF: [RFC 8110, Opportunistic Wireless Encryption](https://www.rfc-editor.org/rfc/rfc8110)
- CERT/CC: [VU#723755, WiFi Protected Setup (WPS) PIN brute force vulnerability](https://www.kb.cert.org/vuls/id/723755)
