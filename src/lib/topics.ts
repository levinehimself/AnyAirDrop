/** The five topics the blog covers. The key is used in frontmatter and in /blog/topic/<key>/. */
export const TOPICS = {
  'wifi-basics': {
    name: 'How Wi-Fi works',
    summary: 'Radio, standards, bands, channels, and why the speed printed on the box is never the speed you get.',
  },
  'routers-and-networks': {
    name: 'Routers, modems and home networks',
    summary: 'What each box does, how addresses are handed out, and why devices on one network sometimes cannot see each other.',
  },
  'phones-as-modems': {
    name: 'Phones as modems',
    summary: 'The modem inside every phone, hotspots and tethering on Android and iPhone, and what cellular speed really depends on.',
  },
  'local-transfer-tech': {
    name: 'How local file transfer works',
    summary: 'The technology behind nearby sharing: Bluetooth, NFC, Wi-Fi Direct, device discovery and file-sharing protocols.',
  },
  'transfer-in-practice': {
    name: 'Transferring files in practice',
    summary: 'Browser-to-browser transfer, PC and phone methods, encryption, and fixing devices that cannot find each other.',
  },
} as const;

export type TopicKey = keyof typeof TOPICS;
export const TOPIC_KEYS = Object.keys(TOPICS) as [TopicKey, ...TopicKey[]];
