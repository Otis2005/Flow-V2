// Lightweight ZIP writer for browser. We only need to:
// - add string + Uint8Array files
// - create empty folders that contain files at sub-paths
// - generate a Blob of type "application/zip"
//
// Implements the deflate-stored variant of the .zip format (i.e. files are
// stored uncompressed). DOCX files don't require compression to open
// correctly in Word/Pages/LibreOffice, so this keeps the implementation
// tiny and zero-dependency.

const TE = new TextEncoder();

function crc32(buf) {
  let c;
  if (!crc32.table) {
    crc32.table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      crc32.table[n] = c;
    }
  }
  c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crc32.table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function dosTime(date = new Date()) {
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const dt =
    ((date.getFullYear() - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();
  return { time, dt };
}

function u16(n) { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, n, true); return b; }
function u32(n) { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, n >>> 0, true); return b; }

function concat(arrays) {
  let total = 0;
  for (const a of arrays) total += a.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const a of arrays) { out.set(a, o); o += a.length; }
  return out;
}

class JSZipShim {
  constructor(parent = null, prefix = '') {
    this.entries = parent ? parent.entries : [];
    this.prefix = prefix;
  }

  file(name, data) {
    const fullName = this.prefix + name;
    let bytes;
    if (typeof data === 'string') bytes = TE.encode(data);
    else if (data instanceof Uint8Array) bytes = data;
    else throw new Error('Unsupported data type for zip file');
    this.entries.push({ name: fullName, bytes });
    return this;
  }

  folder(name) {
    const newPrefix = this.prefix + name + '/';
    return new JSZipShim(this, newPrefix);
  }

  async generateAsync({ type } = { type: 'blob' }) {
    const localChunks = [];
    const central = [];
    let offset = 0;
    const { time, dt } = dosTime();

    for (const entry of this.entries) {
      const nameBytes = TE.encode(entry.name);
      const crc = crc32(entry.bytes);
      const size = entry.bytes.length;

      // Local file header
      const localHeader = concat([
        u32(0x04034b50),
        u16(20),         // version
        u16(0),          // flags
        u16(0),          // compression = stored
        u16(time), u16(dt),
        u32(crc),
        u32(size), u32(size),
        u16(nameBytes.length),
        u16(0)           // extra length
      ]);
      localChunks.push(localHeader, nameBytes, entry.bytes);

      // Central directory header
      const centralHeader = concat([
        u32(0x02014b50),
        u16(20), u16(20),
        u16(0), u16(0),
        u16(time), u16(dt),
        u32(crc),
        u32(size), u32(size),
        u16(nameBytes.length),
        u16(0), u16(0),
        u16(0), u16(0),
        u32(0),
        u32(offset)
      ]);
      central.push(centralHeader, nameBytes);

      offset += localHeader.length + nameBytes.length + entry.bytes.length;
    }

    const centralBytes = concat(central);
    const eocd = concat([
      u32(0x06054b50),
      u16(0), u16(0),
      u16(this.entries.length), u16(this.entries.length),
      u32(centralBytes.length),
      u32(offset),
      u16(0)
    ]);

    const blobParts = [...localChunks, centralBytes, eocd];

    if (type === 'blob' || type === undefined) {
      return new Blob(blobParts, { type: 'application/zip' });
    }
    return concat(blobParts.map(b => b instanceof Uint8Array ? b : new Uint8Array(b)));
  }
}

export default JSZipShim;
