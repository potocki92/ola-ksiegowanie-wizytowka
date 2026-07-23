import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const INPUT = "public/logo.webp";
const OUT = "public";

// 1) Sample the background color from a corner pixel (solid navy).
const corner = await sharp(INPUT).extract({ left: 3, top: 3, width: 6, height: 6 }).raw().toBuffer();
const bg = { r: corner[0], g: corner[1], b: corner[2] };
console.log("Kolor tla:", `rgb(${bg.r},${bg.g},${bg.b})`, "->", "#" + [bg.r, bg.g, bg.b].map((v) => v.toString(16).padStart(2, "0")).join(""));

// 2) Trim the uniform navy border to get a tight bounding box of the "AP" mark.
const trimmedMeta = await sharp(INPUT).trim({ threshold: 14 }).toBuffer({ resolveWithObject: true });
console.log("AP po przycieciu:", trimmedMeta.info.width + "x" + trimmedMeta.info.height);
const trimmedBuf = trimmedMeta.data;

// 3) Render a square icon of side N: navy canvas + centered AP with padding.
async function renderPng(size, inner = 0.78) {
	const target = Math.round(size * inner);
	const mark = await sharp(trimmedBuf)
		.resize(target, target, { fit: "contain", background: bg })
		.toBuffer();
	return sharp({ create: { width: size, height: size, channels: 3, background: bg } })
		.composite([{ input: mark, gravity: "center" }])
		.png({ compressionLevel: 9 })
		.toBuffer();
}

const sizes = { 16: "favicon-16.png", 32: "favicon-32.png", 48: "favicon-48.png", 180: "apple-touch-icon.png" };
const pngBuffers = {};
for (const [size, name] of Object.entries(sizes)) {
	const buf = await renderPng(Number(size));
	pngBuffers[size] = buf;
	await writeFile(`${OUT}/${name}`, buf);
	console.log("zapisano", name, `(${size}x${size}, ${buf.length} B)`);
}

// 4) Pack 16/32/48 PNGs into a multi-resolution ICO (PNG-in-ICO, Vista+).
function pngToIco(images) {
	const count = images.length;
	const header = Buffer.alloc(6);
	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(count, 4);
	const dir = Buffer.alloc(16 * count);
	let offset = 6 + 16 * count;
	images.forEach((img, i) => {
		const e = i * 16;
		dir.writeUInt8(img.size >= 256 ? 0 : img.size, e + 0);
		dir.writeUInt8(img.size >= 256 ? 0 : img.size, e + 1);
		dir.writeUInt8(0, e + 2);
		dir.writeUInt8(0, e + 3);
		dir.writeUInt16LE(1, e + 4);
		dir.writeUInt16LE(32, e + 6);
		dir.writeUInt32LE(img.buffer.length, e + 8);
		dir.writeUInt32LE(offset, e + 12);
		offset += img.buffer.length;
	});
	return Buffer.concat([header, dir, ...images.map((i) => i.buffer)]);
}

const ico = pngToIco([
	{ size: 16, buffer: pngBuffers[16] },
	{ size: 32, buffer: pngBuffers[32] },
	{ size: 48, buffer: pngBuffers[48] },
]);
await writeFile(`${OUT}/favicon.ico`, ico);
console.log("zapisano favicon.ico", `(${ico.length} B, 16+32+48)`);
