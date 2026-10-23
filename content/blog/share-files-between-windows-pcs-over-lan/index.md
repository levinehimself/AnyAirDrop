---
title: "How to Share Files Between Two Windows PCs Over a Local Network"
description: "Four ways to move files between Windows PCs on one network or one cable: shared folders, nearby sharing, a direct Ethernet link and robocopy."
topic: "transfer-in-practice"
order: 4
publishDate: 2026-10-23
heroImage: "./images/diagram.svg"
heroAlt: "Diagram of three ways to connect two Windows PCs: a shared folder through a router, nearby sharing over Bluetooth and Wi-Fi, and a direct Ethernet cable between the two PCs"
related:
  - "local-file-sharing-protocols-smb-ftp-http-sftp"
  - "wifi-vs-ethernet-for-local-transfers"
  - "private-ip-addresses-and-local-networks"
  - "devices-cant-find-each-other-troubleshooting"
---

Two Windows PCs on the same network can exchange files without the internet in at least four ways: a shared folder reached by a path like `\\OFFICE-PC\Share`, the built-in nearby sharing feature, a plain Ethernet cable run directly between them, or a command-line copy with robocopy. They differ in setup effort, speed and what they need from the network, and most failures come from the same small set of causes.

**Short answer:** for a one-off file, nearby sharing or any browser-based tool is least effort. For a lot of data or a regular job, a shared folder over a wired connection is the fastest and most dependable, and robocopy handles big, interruptible copies better than File Explorer. If there is no router at all, a single Ethernet cable between the two PCs works too. For the first two methods, Windows must treat the network as Private for sharing to work.

A note on wording: Windows 10 and Windows 11 label some of these settings differently, and Microsoft has changed them between releases. [Microsoft's file sharing guide](https://support.microsoft.com/en-us/windows/experience/connectivity-networking/file-sharing-over-a-network-in-windows) notes that Windows 10 support ended on October 14, 2025. Where this article names a menu, treat it as a pointer and use Windows' search box in Settings if the wording differs on your PC.

## Method 1: a shared folder (SMB)

Windows file sharing uses a protocol called SMB (Server Message Block). One PC publishes a folder as a *share*, and the other reaches it by network path. We compare SMB with FTP, SFTP and HTTP in [local file-sharing protocols](/blog/local-file-sharing-protocols-smb-ftp-http-sftp/); here is the Windows side.

### Set it up on the PC that holds the files

1. Right-click the folder and choose the option for giving access to specific people. On Windows 11 it is under the "Show more options" menu, according to Microsoft. Choose a user, or "Everyone" for all network users.
2. In Settings, find "advanced sharing settings." Under Private networks, turn on network discovery and file and printer sharing.
3. Set the network itself to Private (see the next section).

Microsoft's guide also describes turning off password-protected sharing under All Networks, which lets anyone on the network in without an account. That is a convenience trade-off: on a home network of people you trust it may be acceptable, but on any shared network, leave password protection on and use a user account on the PC that holds the files.

### Reach it from the other PC

Find the sharing PC's name with `hostname` in a Command Prompt window, or its IPv4 address with `ipconfig`. Then, in File Explorer's address bar on the other PC, type:

```
\\OFFICE-PC\Share
```

where `OFFICE-PC` is the computer name and `Share` is the share name. The address form `\\192.168.1.42\Share` works too, which helps when name lookup fails. Windows will ask for a username and password of an account on the sharing PC.

The `net view` command lists computers it can see, and `net view \\OFFICE-PC` lists the shares on one of them. On modern Windows, the list is often empty even when sharing works, because it depends on discovery services. If it shows nothing, typing the path directly is the more reliable test.

### Why the Private profile matters

Windows keeps a *network profile* for each network and gives each profile its own firewall rules. A Public profile is meant for places like cafes, so it hides the PC and blocks inbound connections such as file sharing. A Private profile assumes a trusted network and allows discovery and sharing. Microsoft's guide says that if you are on a Wi-Fi network, you should set it to Private, and that network discovery and file sharing require the Private profile.

The setting lives in Settings under Network & internet, on the page for the Wi-Fi or Ethernet connection. Do this only for networks you trust, such as your own home network, since it lowers the PC's guard. If a PC that can reach the internet fine cannot be reached by another PC on the same router, the profile is the first thing to check.

## Method 2: nearby sharing

Windows has a built-in nearby sharing feature for sending files to PCs close by. [Microsoft's troubleshooting page](https://support.microsoft.com/en-us/windows/experience/connectivity-networking/fix-problems-with-nearby-sharing-in-windows) lists its requirements: both PCs need Bluetooth 4.0 or higher with Low Energy support, and Wi-Fi turned on. For Wi-Fi transfers, both devices should be on the same network, and the network profile must be Private. The setting itself is under System in Settings, where you choose between "Everyone nearby" and "My devices only"; on Windows 10 (version 1803) it was under "Shared experiences" instead.

Think of it as a quick way to move a few files, not as a replacement for a share. It sends what you select from File Explorer or the Share menu, and you do not set up folders or accounts. But it depends on Bluetooth discovery working on both PCs, and the exact behavior depends on the Windows version, so check the Microsoft page for what applies today.

## Method 3: a direct Ethernet cable

If two PCs sit side by side and you have no router, or the router is slow, you can connect them with a single Ethernet cable. This is a *direct link*.

**Do I need a special crossover cable?** Almost certainly not. Modern network ports use a feature called auto-MDI/MDI-X, which lets the port work out the wiring on its own, so an ordinary patch cable works. Very old or unusual hardware may lack it, but that is rare today.

**How do the PCs get addresses?** With no router, nothing hands out addresses with DHCP (the service explained in [how a router works](/blog/how-a-router-works-nat-dhcp-dns/)). Two choices:

- **Wait for link-local addresses.** [RFC 3927](https://www.rfc-editor.org/rfc/rfc3927) defines a fallback in which each PC picks an address from 169.254.0.0/16, checks with a broadcast that nobody else is using it, and then keeps it. This can take a short while after the cable is plugged in. Traffic using these addresses stays on the cable; routers must not forward it.
- **Set addresses by hand.** Give one PC 192.168.50.1 and the other 192.168.50.2, both with subnet mask 255.255.255.0, no gateway. These are ordinary private addresses ([private IP addresses](/blog/private-ip-addresses-and-local-networks/)).

Then share a folder as in Method 1 and use the other PC's address in the path, e.g. `\\169.254.12.34\Share`. Windows may classify a cable with no router as an unidentified network and label it Public; set it to Private if you trust the other PC.

### What speed to expect from a cable

A wired link has a fixed raw rate, and you can work out the ceiling. Take a gigabit Ethernet port, which carries 1,000 megabits per second.

- Each standard frame holds up to 1,500 bytes of payload, plus 38 bytes of Ethernet overhead (preamble, header, checksum and the required gap between frames).
- Inside the payload, IPv4 and TCP headers take about 40 bytes, leaving 1,460 bytes for data.
- Efficiency is 1,460 ÷ 1,538 ≈ 0.949, so the best case is about 949 Mbps, or roughly 119 megabytes per second (949 ÷ 8 ≈ 118.7).

On paper, a 1 GB (one billion byte) file would then take about 8.4 seconds. The actual time is usually longer, since the disks at both ends, SMB's own overhead and other work on the PCs also count. A slow mechanical hard drive can be the bottleneck rather than the cable. This is a calculation from the standard, not a measurement, and [wired versus wireless transfer](/blog/wifi-vs-ethernet-for-local-transfers/) explains why a cable usually has the edge over Wi-Fi.

## File Explorer or robocopy?

Dragging files in File Explorer is simple and fine for a handful of files. Robocopy is a command-line tool built into Windows that suits large or interrupted copies. [Microsoft documents it](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/robocopy) with this form:

```
robocopy <source> <destination> [options]
```

A practical example, copying a folder to a share with subfolders, a log, and short retries:

```
robocopy C:\Photos \\OFFICE-PC\Backup\Photos /E /R:2 /W:5 /LOG:C:\Temp\copy.log
```

What the options do:

- `/E` copies subfolders, including empty ones.
- `/R:2 /W:5` retries a failed file twice, waiting 5 seconds between tries. Without them, the default is one million retries with a 30-second wait, which can look like the copy has frozen when a file is locked or the link drops.
- `/Z` copies in restartable mode, so an interrupted large file resumes rather than starting over.
- `/MT:n` copies with several threads; the default is 8 if you give `/MT` without a number. Microsoft notes you should redirect output to a log with this option.
- `/LOG:file` writes results to a file you can check afterward.

Two cautions. Robocopy's exit codes are not the usual "0 means success": codes below 8 mean no failure, with 1 meaning files were copied, while 8 or higher means at least one failure. And `/MIR` (mirror) deletes files in the destination that are not in the source, which is dangerous if you swap source and destination by mistake. Run with `/L` first, which only lists what would happen.

## What this means for sending files between your own devices

For two PCs you own, the choice mostly depends on how often you do it. If it is a one-off, use nearby sharing or a browser-based method. If it is regular, set up a share once and put a shortcut to `\\PC-NAME\Share` where you can reach it. If the PCs are next to each other and the data is big, a cable beats any wireless route on speed and stability, since Wi-Fi shares its airtime ([how Wi-Fi works](/blog/how-wifi-works/)).

If the PCs are on different kinds of networks, or if one of them is a phone, none of the Windows-only methods apply. For that, see [transferring files between a PC and a phone](/blog/transfer-files-between-pc-and-phone-over-wifi/). AnyAirDrop.com is our own tool, and since it runs in the browser with no install or account, it is one option that does not need either PC to be configured for sharing; the receiver has to tap Accept.

## Common questions

### How do I find my computer's name on a Windows network?

Open Command Prompt and type `hostname`. It prints the computer name, which you can use in a path like `\\NAME\Share`. The About page in Settings also shows it as the device name.

### Why can't my PC see the other PC in the Network folder?

Usually the network profile is Public, network discovery is off, or the PCs are on different networks, for example one on a guest Wi-Fi. Set the profile to Private, turn on discovery and file sharing, and try the direct path `\\IP-ADDRESS\Share` instead of browsing.

### Can I connect two PCs with just an Ethernet cable?

Yes. A normal Ethernet cable is enough because ports negotiate the wiring themselves. Wait for the PCs to assign themselves 169.254.x.x addresses, or set matching static addresses by hand, then share a folder.

### Is robocopy faster than File Explorer?

It can be for many files, because `/MT` copies several at once, but a single large file is limited by the disks and the link, not the tool. Its bigger advantages are restartable copies, retries you control, and a log.

### Is it safe to share a folder on my network?

On a home network you trust, with sharing limited to specific folders and accounts, the risk is low. Do not share on a Public profile, avoid giving "Everyone" write access, and stop sharing when you are done. [Local transfer safety](/blog/is-local-file-transfer-safe-encryption-explained/) covers the wider picture.

## Key takeaways

- Windows shares use SMB and are reached with a path such as `\\COMPUTER\Share`; `hostname` and `ipconfig` give you the name and address.
- File sharing works only when the network profile allows it, which means Private; Public hides the PC on purpose.
- Nearby sharing needs Bluetooth 4.0 LE or higher, Wi-Fi, and a Private network, but exact menus differ between Windows versions.
- A direct Ethernet cable works without a router, using ordinary cables and either 169.254.x.x or hand-set private addresses.
- Robocopy gives restartable copies, controlled retries and logs; set `/R` and `/W` yourself, and be careful with `/MIR`.

## Sources

- Microsoft Support: [File sharing over a network in Windows](https://support.microsoft.com/en-us/windows/experience/connectivity-networking/file-sharing-over-a-network-in-windows)
- Microsoft Support: [Fix problems with nearby sharing in Windows](https://support.microsoft.com/en-us/windows/experience/connectivity-networking/fix-problems-with-nearby-sharing-in-windows)
- Microsoft Learn: [robocopy](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/robocopy)
- IETF: [RFC 3927, Dynamic Configuration of IPv4 Link-Local Addresses](https://www.rfc-editor.org/rfc/rfc3927)
