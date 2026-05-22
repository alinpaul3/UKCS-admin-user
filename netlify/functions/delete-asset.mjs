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

export async function handler(event) {
  if (event.httpMethod !== 'DELETE') {
    return json(405, { error: 'Method not allowed' });
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return json(500, { error: 'Cloudinary environment variables are not configured' });
  }

  try {
    const { public_id } = JSON.parse(event.body || '{}');
    if (!public_id) return json(400, { error: 'Missing public_id' });

    const result = await cloudinary.uploader.destroy(public_id, { resource_type: 'auto' });
    return json(200, result);
  } catch (error) {
    console.error('Netlify delete error:', error);
    return json(500, { error: 'Failed to delete from Cloudinary' });
  }
}
