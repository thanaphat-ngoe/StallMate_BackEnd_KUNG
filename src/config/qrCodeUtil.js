const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const s3Client = require('./s3Client');
const { Menu } = require('../models/menuSchema');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Generate QR code, upload it to S3, and save the URL in the menu schema.
 * @param {ObjectId} userId 
 * @returns {Promise<string>} 
 */
async function generateAndSaveQRCode(userID) {
    try {
        // const menuUrl = `http://ec2-13-215-252-79.ap-southeast-1.compute.amazonaws.com:3000/auth/customer/google?redirectTo=/dashboard/stallowner/${userID}/menu`;
        const menuUrl = `${process.env.FRONT_END_BASE_URL}/requestMenu/${userID}`;
        const qrCodeDataUrl = await QRCode.toDataURL(menuUrl);
        const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        const s3Params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `qrcodes/${userID}-${uuidv4()}.png`,
            Body: buffer,
            ContentEncoding: 'base64',
            ContentType: 'image/png',
        };

        const command = new PutObjectCommand(s3Params);
        await s3Client.send(command);
        const qrCodeUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Params.Key}`;

        let menu = await Menu.findOne({ seller: userID });
        
        if (!menu) {
            menu = new Menu({
                seller: userID,
                items: [],
                qrcode_url: qrCodeUrl,
            });
        } else {
            menu.qrcode_url = qrCodeUrl;
        }

        console.log('Before saving menu:', menu);
 
        await menu.save();

        return qrCodeUrl;
    } catch (err) {
        console.error('Error generating or saving QR code:', err);
        throw err;
    }
}

module.exports = { generateAndSaveQRCode };