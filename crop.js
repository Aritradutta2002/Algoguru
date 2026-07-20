import { Jimp } from 'jimp';

async function crop() {
  try {
    const image = await Jimp.read('public/algoguru-logo.png');
    const height = image.bitmap.height;
    console.log(`Original image: ${image.bitmap.width}x${height}`);
    
    // We assume the icon is on the far left and fits in a square with side = height
    // Maybe the aspect ratio is such that we can crop a square from the left edge.
    // Let's crop a square:
    image.crop({ x: 0, y: 0, w: height, h: height });
    
    await image.write('public/algoguru-icon.png');
    console.log(`Cropped successfully to ${height}x${height}`);
  } catch (err) {
    console.error("Error cropping image:", err);
  }
}

crop();
