---
title: "WebRTC Data Channels Explained: How a Browser Sends a File Directly"
description: "A browser can send a file straight to another browser. See how WebRTC data channels, signaling, chunking and backpressure make that work."
topic: "transfer-in-practice"
order: 1
publishDate: 2026-10-23
heroImage: "./images/diagram.svg"
heroAlt: "Diagram of two browsers connected by a direct encrypted data channel, with a signaling server above them that only relays setup messages such as the offer, the answer and ICE candidates"
related:
  - "stun-turn-ice-explained"
  - "is-local-file-transfer-safe-encryption-explained"
  - "local-transfer-vs-cloud-upload"
  - "devices-cant-find-each-other-troubleshooting"
---

A web page can send a file to another browser without the file ever visiting a server in the middle. The feature that makes this possible is called a WebRTC data channel: an encrypted pipe that two browsers open directly between themselves, which can carry any bytes, including the slices of a photo or a video.

**Short answer:** WebRTC (Web Real-Time Communication) lets two browsers set up a direct, encrypted connection. A small server, called a signaling server, only introduces them by relaying a few setup messages. After that the file moves browser to browser in small chunks, and the sending code watches a buffer so it never pushes data faster than the network can carry it.

## What WebRTC is, and what a data channel adds

WebRTC began as a way to do video calls in a browser without plugins. It is defined by a set of web APIs (the [W3C WebRTC specification](https://www.w3.org/TR/webrtc/)) and a set of network protocols from the IETF. Most of the API centers on one object, `RTCPeerConnection`, which represents the link between your browser and one other browser, called a *peer*.

Audio and video travel over that link as media streams. But the same link can also carry arbitrary data through an [`RTCDataChannel`](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel). According to [MDN's page for its `send()` method](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/send), a channel can send strings, `Blob` objects (the browser's type for file-like data), `ArrayBuffer`s, typed arrays and `DataView`s. A file picked from your device is a `Blob`, so it fits naturally.

Data channels are a standard feature of the major desktop and mobile browsers, but small details, especially the maximum message size, differ between browsers and versions. A careful implementation reads the limits at run time instead of assuming them, as shown below.

## The protocol stack under a data channel

A data channel is not a single protocol. [RFC 8831](https://www.rfc-editor.org/rfc/rfc8831), titled "WebRTC Data Channels", describes a stack of three layers:

1. **UDP** (User Datagram Protocol) at the bottom. It sends individual packets with no built-in delivery guarantees. The connection-finding steps described in [STUN, TURN and ICE explained](/blog/stun-turn-ice-explained/) work on UDP packets, and the reliability is added by the layers above.
2. **DTLS** (Datagram Transport Layer Security) in the middle. This is the encryption layer. It is the same idea as the TLS that protects websites, adapted for packets that can arrive out of order or go missing. RFC 8831 says the stack provides confidentiality, source authentication and integrity.
3. **SCTP** (Stream Control Transmission Protocol) on top. It gives the channel its behavior: it keeps message boundaries, can deliver messages in order, and resends lost packets so the data arrives complete.

The result is something that feels like TCP to the programmer (reliable, ordered, congestion-aware) but is built from UDP packets, and is always encrypted. A web page cannot opt out of the encryption.

## Why a server is still needed: signaling

Two browsers cannot find each other out of thin air. Each one knows only its own network addresses, and neither knows the other exists. WebRTC solves this by handing the job to *you*, the web developer: the standard deliberately does not say how the two sides exchange their first messages. As [MDN's signaling guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling) puts it, you can use anything from a WebSocket to a plain HTTP request. That exchange is called *signaling*, and the server doing it is a signaling server.

Two kinds of message pass through it:

- **Session descriptions.** The first browser creates an **offer**, a block of text in a format called SDP (Session Description Protocol). It lists what the browser wants to do, including that it wants a data channel, and carries a fingerprint of the browser's certificate for the DTLS handshake. The second browser replies with an **answer** in the same format.
- **ICE candidates.** Each browser gathers a list of addresses where it might be reachable, and sends them one at a time. The sequence below shows where they fit, and [STUN, TURN and ICE explained](/blog/stun-turn-ice-explained/) covers how they are tested.

### What the signaling server does and does not see

The signaling server sees the setup messages: that two clients want to connect, the SDP text, and the candidate addresses (which can include IP addresses). It does not see the file. The file is encrypted with keys that the two browsers negotiate between themselves in the DTLS handshake, and the data does not travel through the signaling server at all.

There is one limit on what that protects. The certificate fingerprints travel through the signaling channel, so a signaling channel that is itself dishonest could in principle try to swap them. That is why the signaling connection should be protected too, and why apps that care about this let users compare a short code or confirm the other device by name. We cover that in [the safety guide to local transfer](/blog/is-local-file-transfer-safe-encryption-explained/).

## From offer to open channel: the sequence

Here is the order of events when browser A wants to send a file to browser B:

1. A creates an `RTCPeerConnection` and calls `createDataChannel()`. Creating the channel before the offer matters, because the offer must mention that a data channel is wanted.
2. A calls `createOffer()` and `setLocalDescription()`. This also starts gathering ICE candidates.
3. A sends the offer, and then each candidate as it appears, through the signaling server to B.
4. B calls `setRemoteDescription()` with the offer, then `createAnswer()` and `setLocalDescription()`, and sends the answer back.
5. A calls `setRemoteDescription()` with the answer. Candidates keep flowing in both directions and are added with `addIceCandidate()`.
6. The browsers test candidate pairs until one works (ICE), run the DTLS handshake over it, and start the SCTP association on top.
7. The channel's `readyState` becomes `open`, and the `open` event fires on both sides. B receives the channel through the `datachannel` event.

On a home network, step 6 often finishes in a fraction of a second, but nothing in the standard promises a time. If you have not seen ICE before, the key point is that it picks the best working route, and on the same Wi-Fi network that route is usually direct.

## Sending a file: chunking and message size

You cannot hand a 2 GB video to `send()` in one call. Two limits stand in the way.

First, a data channel sends *messages*, and the receiver must be prepared to hold a whole message before it delivers it. Browsers publish a limit for this: the `maxMessageSize` property of the connection's `sctp` object ([MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/RTCSctpTransport/maxMessageSize)). Each side can declare the largest message it will accept with the `max-message-size` attribute in the SDP ([RFC 8841](https://www.rfc-editor.org/rfc/rfc8841)). According to [MDN's guide to data channels](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels), a default of 64 kilobytes is assumed when the attribute is absent, and most modern browsers can send messages of at least 256 kilobytes.

Second, big messages cause head-of-line blocking. MDN explains that, without a feature called message interleaving (defined in RFC 8260), one large message on a channel can delay messages on other channels that share the same SCTP connection. RFC 8831 therefore says that, as long as interleaving is not supported, the sender should limit messages to 16 KB. In code, that is usually written as 16 KiB (16,384 bytes), which is why it is a common chunk size in file-transfer tools: it is a size the RFC itself treats as safe across implementations.

### A worked example

Take a file of exactly 1 GiB, which is 1,073,741,824 bytes, and a chunk size of 16 KiB, which is 16,384 bytes.

- Number of chunks: 1,073,741,824 ÷ 16,384 = 65,536.
- Each chunk is then split by SCTP into network packets. RFC 8831 says the path MTU (the largest packet the network will carry) at the IP layer should not start above 1,200 bytes for IPv4. The IP, UDP, DTLS and SCTP headers use part of each packet, so less than 1,200 bytes of your data fit in one. A 16 KiB chunk therefore needs at least 14 packets (16,384 ÷ 1,200 ≈ 13.7, rounded up), and a few more in practice. The exact count depends on the implementation.

The sender also needs to tell the receiver what is coming. A basic design sends a first message describing the file (name, size, type), then the numbered chunks, then a final message saying it is done. Because the channel is ordered by default, the chunks arrive in the order they were sent, and the receiver can append them one after another.

![A 1 GiB file of 1,073,741,824 bytes divided into 16 KiB chunks of 16,384 bytes gives 65,536 chunks. Each chunk needs at least 14 packets, and a paused sender keeps about 64 chunks queued.](./images/figure.svg)
*Chunking turns one large file into tens of thousands of small messages, so the sender has to watch its queue instead of sending everything at once.*

## Backpressure: not sending faster than the link allows

If your code calls `send()` 65,536 times in a loop, the calls return almost at once, because the browser queues the data in an internal buffer instead of waiting for the network. The `bufferedAmount` property reports how many bytes are waiting. The loop finishes in a moment, but the data now sits in memory while the network slowly drains it, which can be enough to exhaust a phone's memory. If the buffer has a size limit and it fills, `send()` throws an `OperationError`, according to [MDN's send() page](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/send), and the transfer breaks partway through. The limit is up to the browser, so code cannot rely on it.

The remedy is *backpressure*: the sender pauses when the buffer is getting full and resumes when it empties. Two features support this. According to [MDN](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel), `bufferedAmount` returns "the number of bytes of data currently queued to be sent", and the `bufferedamountlow` event fires when the queue drains to the level set by `bufferedAmountLowThreshold` (the default is 0). The [W3C specification](https://www.w3.org/TR/webrtc/) is exact about the timing: the event fires when `bufferedAmount` decreases from above the threshold to equal or below it.

Here is a short sketch of a sender. It is simplified: it assumes the channel is already open, and it leaves out error handling and a way for the receiver to cancel.

```js
const CHUNK = 16 * 1024;          // 16 KiB per message
const HIGH_WATER = 1024 * 1024;   // pause above 1 MiB queued

async function sendFile(file, channel) {
  channel.bufferedAmountLowThreshold = 256 * 1024;
  channel.send(JSON.stringify({ name: file.name, size: file.size }));

  for (let offset = 0; offset < file.size; offset += CHUNK) {
    if (channel.bufferedAmount > HIGH_WATER) {
      await new Promise((resolve) =>
        channel.addEventListener("bufferedamountlow", resolve, { once: true })
      );
    }
    const chunk = await file.slice(offset, offset + CHUNK).arrayBuffer();
    channel.send(chunk);
  }
  channel.send(JSON.stringify({ done: true }));
}
```

The pause works because the high-water mark (1 MiB) is above the threshold (256 KiB): once the queue is above 1 MiB, it has to fall through 256 KiB as it drains, and that fires the event. With a 1 MiB high-water mark and 16 KiB chunks, the queue never holds much more than 1 MiB (about 64 chunks), whether the file is 10 MB or 10 GB. Reading with `file.slice()` also helps: it asks for one small piece of the file at a time instead of loading all of it.

## Reliability, ordering and memory

A data channel can be configured when it is created. The defaults are what a file transfer wants: `ordered` is `true`, and no retransmission limit is set (`maxRetransmits` is `null`), so lost packets are resent until they arrive. The same options can be loosened for things like game state, where an old update is worthless: setting `ordered: false` or limiting `maxRetransmits` or `maxPacketLifeTime` trades completeness for lower delay. For a file, do not loosen them, because a missing chunk would corrupt the result.

The receiving side has the harder memory problem. The simple approach is to collect every chunk in an array and build one `Blob` at the end, which means the whole file lives in memory until it is saved. That is fine for a photo and risky for a multi-gigabyte video on a phone. Some browsers offer APIs that let a page write incoming chunks straight to a file on disk, but support differs by browser and platform, so well-built tools check what is available and fall back gracefully.

## Why a direct data channel can keep a transfer inside your home

Because the data channel is a direct, encrypted browser-to-browser link, a transfer between two of your own devices on the same Wi-Fi can stay inside your home. The file itself never leaves. The traffic that does go out is the small signaling messages, plus any lookups the browsers make to a STUN server. The file's speed is then limited by your local network, not by your internet plan's upload speed, a difference we quantify in [local transfer vs cloud upload](/blog/local-transfer-vs-cloud-upload/).

Two things still have to work for that to happen. The devices need a way to find each other, whether by being on the same network, by a short code, or by a QR code. And the network must let the packets through; some guest networks and office networks block device-to-device traffic, which we describe in [client isolation and guest networks](/blog/client-isolation-guest-networks-and-device-visibility/).

AnyAirDrop.com is our own tool, and it uses this approach: it runs in the browser with no install or account, and files go from device to device over WebRTC, encrypted, rather than being uploaded to the site's server. An encrypted relay is used only when a direct connection is impossible, and the page says so.

## Common questions

### Is a WebRTC data channel encrypted?

Yes. Every data channel is carried over DTLS, so encryption is not optional and cannot be switched off by a web page. The signaling messages that set it up are a separate channel, which the app should also protect with HTTPS or an equivalent.

### Does WebRTC upload my file to a server?

Not in the normal case. The file goes directly from one browser to the other. A server is involved only for signaling, and for relaying when a direct path cannot be found. A relay forwards encrypted packets that it cannot read, but it does carry the traffic, so the transfer is no longer purely local. [STUN, TURN and ICE](/blog/stun-turn-ice-explained/) explains when that happens.

### What is the file size limit of a data channel?

There is no fixed file size limit in the protocol, because a file is split into many messages. The limits that exist are per message (negotiated, and at least 256 kilobytes in most modern browsers, according to MDN, with 16 KB as the conservative choice) and practical, such as the receiver's memory and the device's storage.

### Why does my transfer sometimes go through the internet?

If the two devices cannot reach each other directly, for example because a network blocks device-to-device traffic or one device is behind a restrictive NAT (network address translation), WebRTC can fall back to a relay called a TURN server. That works, but it depends on your internet connection and may be slower.

### Do both people need the same app?

They need software that speaks the same signaling and chunking rules. WebRTC defines the connection, but not how a file is named, split or resumed. Two different web apps will not normally interoperate unless they agree on those rules.

## Key takeaways

- A WebRTC data channel carries data directly between two browsers over SCTP, inside DTLS, over UDP, and is always encrypted.
- A signaling server is still needed to relay the offer, the answer and ICE candidates. It never receives the file.
- Files are split into chunks, with 16 KiB being a common size because RFC 8831 advises 16 KB messages when message interleaving is not available.
- Backpressure, using `bufferedAmount` and the `bufferedamountlow` event, stops the sender from filling memory faster than the network drains.
- Defaults (ordered, fully reliable) suit file transfer; relaxing them risks corrupt files.

## Sources

- IETF: [RFC 8831, WebRTC Data Channels](https://www.rfc-editor.org/rfc/rfc8831)
- IETF: [RFC 8841, SDP-Based Data Channel Negotiation (max-message-size)](https://www.rfc-editor.org/rfc/rfc8841)
- MDN Web Docs: [Using WebRTC data channels](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels)
- MDN Web Docs: [RTCDataChannel](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel)
- MDN Web Docs: [RTCDataChannel.send()](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel/send)
- MDN Web Docs: [RTCSctpTransport.maxMessageSize](https://developer.mozilla.org/en-US/docs/Web/API/RTCSctpTransport/maxMessageSize)
- MDN Web Docs: [Signaling and video calling](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling)
- W3C: [WebRTC 1.0: Real-Time Communication Between Browsers](https://www.w3.org/TR/webrtc/)
