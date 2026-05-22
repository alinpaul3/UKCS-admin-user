import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const getBoundary = (contentType = '') => {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  return match?.[1] || match?.[2] || '';
};

const parseMultipartFile = (bodyBuffer, boundary) => {
  const marker = Buffer.from(`--${boundary}`);
  const parts = [];
  let cursor = bodyBuffer.indexOf(marker);

  while (cursor !== -1) {
    const next = bodyBuffer.indexOf(marker, cursor + marker.length);
    if (next === -1) break;
    parts.push(bodyBuffer.subarray(cursor + marker.length, next));
    cursor = next;
  }

  for (const rawPart of parts) {
    let part = rawPart;
    if (part.subarray(0, 2).toString() === '\r\n') {
      part = part.subarray(2);
    }

    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd === -1) continue;

    const header = part.subarray(0, headerEnd).toString('utf8');
    if (!/name="file"/i.test(header)) continue;

    const filename = header.match(/filename="([^"]*)"/i)?.[1] || 'certificate';
    const contentType = header.match(/Content-Type:\s*([^\r\n]+)/i)?.[1] || 'application/octet-stream';
    let data = part.subarray(headerEnd + 4);

    if (data.subarray(data.length - 2).toString() === '\r\n') {
      data = data.subarray(0, data.length - 2);
    }

    return { filename, contentType, data };
  }

  return null;
};

const uploadBuffer = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'ukcs_certificates',
        resource_type: 'auto',
        filename_override: file.filename,
      },
      (error, result) => {
        if (error || !result) reject(error || new Error('Cloudinary upload failed'));
        else resolve(result);
      },
    );

    stream.end(file.data);
  });

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return json(500, { error: 'Cloudinary environment variables are not configured' });
  }

  try {
    const boundary = getBoundary(event.headers['content-type'] || event.headers['Content-Type']);
    if (!boundary) return json(400, { error: 'Missing multipart boundary' });

    const bodyBuffer = Buffer.from(event.body || '', event.isBase64Encoded ? 'base64' : 'utf8');
    const file = parseMultipartFile(bodyBuffer, boundary);
    if (!file) return json(400, { error: 'No file uploaded' });

    const result = await uploadBuffer(file);

    return json(200, {
      secure_url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
    });
  } catch (error) {
    console.error('Netlify upload error:', error);
    return json(500, { error: 'Failed to upload file successfully' });
  }
}
