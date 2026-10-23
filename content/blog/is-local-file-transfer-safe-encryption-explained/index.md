---
title: "Is Local File Transfer Safe? Encryption, Threats and Habits Explained"
description: "A practical threat model for sending files over local Wi-Fi: what encryption and Accept prompts protect, what they miss, and habits that close the gaps."
topic: "transfer-in-practice"
order: 3
publishDate: 2026-10-23
heroImage: "./images/diagram.svg"
heroAlt: "Diagram listing six risks of local file transfer and what covers each: encryption for eavesdropping and tampering, the user for wrong device and unwanted files, and nothing automatic for malware and photo location metadata"
related:
  - "wifi-security-wpa2-wpa3-explained"
  - "webrtc-data-channels-explained"
  - "devices-cant-find-each-other-troubleshooting"
  - "how-airdrop-works"
---

Sending a file to a device in the same room is generally a low-risk activity, but it is not a risk-free one, and the risks are not the ones people usually imagine. A stranger reading your photo out of the air is unlikely when the transfer is encrypted. The more realistic problems are sending to the wrong device, receiving something you did not ask for, opening a bad file, and sharing more information than you meant to.

**Short answer:** transport encryption (TLS or DTLS) keeps other people on the network from reading or changing a file while it travels. It does not tell you who is on the other end, whether the file is harmless, or what is hidden inside a photo. Those parts depend on a confirmation step you actually check, and a few habits.

## Start with a threat model

A threat model is just a list of "what could go wrong, and who could make it happen". For local transfers, the realistic list is short:

| Risk | What it means | What addresses it |
| --- | --- | --- |
| Eavesdropping | Another device on the same network reads the traffic | Encryption in transit |
| Tampering | Someone alters the file as it travels | Encryption with integrity checks |
| Wrong recipient | You send to a similar-looking device, or an impostor | Checking the device name or a pairing code |
| Unsolicited files | A stranger nearby sends you something | Receive settings and an Accept prompt |
| Malicious files | The file itself carries malware | Careful opening, updates, scanning |
| Hidden information | A photo carries location or device data | Removing metadata before sharing |
| Rogue network | You joined a network an attacker set up | Joining only networks you trust |

The first two are what encryption is for. The next two depend on you. The last three are outside what any transfer technology can promise. The diagram above shows the first six and groups them the same way.

## What transport encryption does

Most modern transfer methods encrypt data between the two devices. Web browsers use TLS (Transport Layer Security) for HTTPS pages, and WebRTC data channels use DTLS (Datagram Transport Layer Security), the packet-friendly variant. [RFC 8831](https://www.rfc-editor.org/rfc/rfc8831) says WebRTC data channels provide confidentiality, source authentication and integrity.

In plain words, that means three things.

- **Confidentiality:** the contents look like random noise to anyone who captures the packets.
- **Integrity:** if a single bit is changed on the way, the receiver detects it and rejects the data.
- **Authentication of the connection:** the receiving end can tell that packets belong to the same encrypted session it set up, and not injected by a third party.

The keys are created fresh for each session by a handshake between the two devices, so there is no password to guess for the transfer itself. This is why another person on the same Wi-Fi, even with a packet-capturing tool, sees only encrypted traffic and the addresses of the two devices, but not the file. That is true whether the Wi-Fi network is protected or not; the protection comes from the layer above it.

### How this differs from Wi-Fi encryption

Your Wi-Fi network has its own encryption, WPA2 or WPA3, between each device and the router ([WPA2 and WPA3 explained](/blog/wifi-security-wpa2-wpa3-explained/)). That protects the radio link. It is a different layer from transfer encryption, and the two complement each other.

One difference matters here. On a network that uses a shared password, everyone who knows that password is inside the same trust circle at the Wi-Fi level. With WPA2 and a shared passphrase, someone who has the passphrase and captures a device's connection handshake can derive that device's session keys and read its traffic, and WPA3 was designed to remove that weakness. Encryption on top of the Wi-Fi, in the transfer itself, means the file stays private even if the Wi-Fi layer is shared with people you do not fully trust, such as guests or a building's common network.

## What encryption does not do

Encryption answers the question "can anyone else read this on the way?" It does not answer these:

- **Who is the other end?** An encrypted connection to the wrong device is still an encrypted connection. The cryptography proves the two ends share keys, not that the other end is the person you meant.
- **Is the file safe?** A virus delivered over an encrypted channel arrives just as encrypted, and just as infected.
- **Should you accept it?** Nothing in the encryption can tell a holiday photo from an unwanted image.
- **What does the file contain?** Photos and documents can carry extra information inside them.

## Consent prompts: what they do and do not cover

Most nearby-sharing systems make the receiver tap Accept before a file lands. This is a real protection, because it stops files being pushed onto your device silently. But it only works if the prompt gives you something to decide with.

Unwanted files are a real issue in crowded places. Apple, for example, changed AirDrop so that the "Everyone" receive setting switches itself back after 10 minutes. [Apple Support](https://support.apple.com/en-us/119857) says that on iOS 16.2 and later, "Everyone for 10 Minutes" reverts to Contacts Only if you are signed in to an Apple Account, and to Receiving Off if you are not. Other systems have comparable visibility options, though the names and defaults vary by device and software version, so check what yours offers.

Good habits around the prompt:

- Decline anything you were not expecting, even if the preview looks harmless.
- If you are a receiver in a public place, keep your visibility set to the narrowest option that still works, and widen it only for the moment you need it.
- Treat the sender's name as a hint, not proof. Device names are chosen by their owners, and anyone can name a phone to look like someone you know.

## Why verifying the other device matters

When you send a file, the most common error is also the simplest: choosing the wrong recipient from a list. In a place with many devices, two can have nearly the same name. And when a tool lets you pair with a code or a QR code, the code is the verification. A short code or a scanned QR shows that both people are looking at the same pairing session at the same moment, which is much harder to fake than a name.

Why does this protect you? The connection setup (see [WebRTC data channels explained](/blog/webrtc-data-channels-explained/)) is the point where a third party would try to insert itself, by passing along its own connection details in place of the real ones. A code that you compare in person, or that was never sent through the same channel as the setup messages, is out of band: an impostor who controls the setup channel still cannot see it. This is a general principle in security, not a feature of a particular product. In practice it means: if a tool offers a code, a QR code or a confirmation of the device name, use it, and do it with the person in front of you.

AnyAirDrop.com is our own tool. The receiving person must tap Accept before anything arrives, files go directly between the two devices rather than to the site's server, and you can pair devices with a 6-digit code or a QR code instead of relying on a name alone.

## The risks encryption cannot fix

### Malicious files

Treat a file from a transfer as you would a download or an email attachment. Executable files (installers, scripts, some archives) and documents with macros are the usual carriers. Keep the operating system and apps up to date, open files from unknown senders only in a viewer you trust, and be careful with anything that asks you to "enable editing" or "enable content". Security software on your device may scan files once they are saved, depending on the system and settings; a transfer tool does not replace that.

### Metadata inside photos

Photos and videos usually contain extra data inside the file, called metadata. A common kind is EXIF, which can include the camera model and the time. If location is allowed for the Camera app, the coordinates of where a photo was taken are embedded too. [Apple's personal safety guide](https://support.apple.com/guide/personal-safety/manage-location-metadata-in-photos-ips0d7a5df82/web) describes this and explains that on iPhone you can open the share sheet for a photo, tap Options and turn off Location, which shares a copy without it. Android phones and desktop programs have their own settings, with different names, so look in the share options or the Camera's location setting.

This matters less when sending a photo to your own laptop, and more when forwarding it to other people. A file transfer tool moves the file as is. It does not remove metadata unless it says it does.

### A rogue or look-alike network

A file transfer cannot make a hostile network friendly. An attacker can set up a Wi-Fi network with the same name as a real one, sometimes called an "evil twin". The NSA's guidance on [securing wireless devices in public settings](https://media.defense.gov/2021/Jul/29/2002815141/-1/-1/0/CSI_SECURING_WIRELESS_DEVICES_IN_PUBLIC.PDF), which CISA [points readers to](https://www.cisa.gov/news-events/alerts/2021/07/30/nsa-releases-guidance-securing-wireless-devices-while-public), notes that attackers can mimic legitimate networks. End-to-end encrypted transfers still protect file contents on such a network, but a hostile network can block connections, watch which devices talk, or send you to fake sign-in pages for other services. If a network name appears unexpectedly or a login page asks for something odd, leave it.

## What this means for sending files between your own devices

At home, between your own phone and laptop on your own router, the practical risk is low. The people on the network are you and your household, the transfer is encrypted, and you are sitting next to both devices. The habit worth keeping is the same small check every time: confirm that the name on the receiving screen is your own device before you tap Accept.

The picture changes in shared places such as offices, cafes, hotels and apartment-building networks. There, you are not the only one on the network. Prefer a method that encrypts end to end, use the pairing code or QR step if there is one, and keep your receive visibility narrow. If the network blocks devices from seeing each other (client isolation, covered in [client isolation and guest networks](/blog/client-isolation-guest-networks-and-device-visibility/)), that is not a defect in the transfer tool but a deliberate protection, and a personal hotspot is a safer alternative than weakening it.

## A checklist of habits

1. Send only to a device you can see and identify, and check the name or code with the person in front of you.
2. Keep your receive visibility on the narrowest setting that works, and widen it only briefly.
3. Decline files you did not expect.
4. Treat received files like email attachments: update your system, and be cautious with installers, scripts and macro documents.
5. Remove location from photos before sending them to anyone else.
6. Join only networks you recognize; do not trust a network name alone.
7. Prefer transfers that encrypt end to end, and be wary of ones that route your files through an unknown server.
8. Delete transferred files you no longer need, particularly on shared computers.

## Common questions

### Can someone on my Wi-Fi see the files I send?

Not the contents, if the transfer is encrypted end to end. They may see that two devices exchanged a lot of data, since addresses and traffic volume are visible, but the file itself is scrambled. If a method is not encrypted, such as plain HTTP or old FTP, the contents could be read.

### Is a QR code or pairing code safer than a device name?

Generally yes, because a code is generated for one session and shown to you directly, while a name is just a label anyone can pick. A code confirms you are connecting to the session you intended, which a name cannot.

### Does an Accept button make a file safe?

No. It only means you agreed to receive it. The file can still be unwanted or malicious. Accept what you expected from someone you know, and treat everything else with suspicion.

### Are local transfers safer than cloud upload?

They are different. A local transfer keeps the file within your network and away from a third party's storage, which reduces exposure. A cloud service has its own security, and may be the better choice for backups or remote recipients. [Local transfer vs cloud upload](/blog/local-transfer-vs-cloud-upload/) compares them.

### Should I worry about AirDrop-style spam?

It is worth a simple precaution: leave visibility on a contacts-only or equivalent setting, and decline unknown requests. If you do receive an unwanted request, declining it is the right response. See [how AirDrop works](/blog/how-airdrop-works/) for how Apple's system handles discovery.

## Key takeaways

- Transport encryption (TLS or DTLS) protects a file from being read or changed in transit, even on a shared network.
- It does not prove who the other end is, and it does not make a file harmless.
- Check the device name or use a pairing code or QR code, and decline anything unexpected.
- Photos can carry location metadata; remove it before sharing them with other people.
- Treat received files like email attachments, and keep your devices updated.

## Sources

- IETF: [RFC 8831, WebRTC Data Channels](https://www.rfc-editor.org/rfc/rfc8831)
- Apple Support: [Use AirDrop on your iPhone or iPad](https://support.apple.com/en-us/119857)
- Apple Support: [Manage location metadata in Photos](https://support.apple.com/guide/personal-safety/manage-location-metadata-in-photos-ips0d7a5df82/web)
- NSA: [Securing Wireless Devices in Public Settings](https://media.defense.gov/2021/Jul/29/2002815141/-1/-1/0/CSI_SECURING_WIRELESS_DEVICES_IN_PUBLIC.PDF)
- CISA: [NSA Releases Guidance on Securing Wireless Devices While in Public](https://www.cisa.gov/news-events/alerts/2021/07/30/nsa-releases-guidance-securing-wireless-devices-while-public)
