const QRCode = require('qrcode');
const path = require('path');

// Load environment variables if not already loaded
if (!process.env.FRONTEND_URL || process.env.FRONTEND_URL === 'http://192.168.0.106:3000') {
  try {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  } catch (e) {
    // dotenv might already be loaded
  }
}

// Get FRONTEND_URL from environment, remove trailing slash if present
const getFrontendUrl = () => {
  // console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
  const url = (process.env.FRONTEND_URL || 'http://192.168.0.106:3000').replace(/\/$/, '');
  return url;
};

const FRONTEND_URL = getFrontendUrl();
const FRONTEND_PORT = process.env.FRONTEND_PORT || '3000';

// Log the URL being used (for debugging)
console.log('🔗 QR Code Frontend URL:', FRONTEND_URL);

/**
 * Generate QR code data URL for a table
 * @param {string} tableSlug - Table slug/number (e.g., "T-01")
 * @returns {Promise<string>} QR code data URL (base64 image)
 */
async function generateQRCodeDataURL(tableSlug) {
  const frontendUrl = getFrontendUrl();
  const url = `${frontendUrl}?table=${encodeURIComponent(tableSlug)}`;
  
  try {
    const qrDataURL = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#563315',  // Cafe dark brown
        light: '#FFFFFF', // White background
      },
      width: 300,
    });
    
    return qrDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate QR code SVG for a table
 * @param {string} tableSlug - Table slug/number
 * @returns {Promise<string>} QR code SVG string
 */
async function generateQRCodeSVG(tableSlug) {
  const frontendUrl = getFrontendUrl();
  const url = `${frontendUrl}?table=${encodeURIComponent(tableSlug)}`;
  
  try {
    const qrSVG = await QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#563315',
        light: '#FFFFFF',
      },
      width: 300,
    });
    
    return qrSVG;
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw error;
  }
}

/**
 * Get the order URL for a table
 * @param {string} tableSlug - Table slug/number
 * @returns {string} Full URL
 */
function getTableOrderURL(tableSlug) {
  const frontendUrl = getFrontendUrl();
  return `${frontendUrl}?table=${encodeURIComponent(tableSlug)}`;
}

module.exports = {
  generateQRCodeDataURL,
  generateQRCodeSVG,
  getTableOrderURL,
};

