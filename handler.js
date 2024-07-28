const AWS = require('aws-sdk');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const s3 = new AWS.S3();
const ses = new AWS.SES();

module.exports.processDocument = async (event) => {
const bucketName = event.Records[0].s3.bucket.name;
const objectKey = event.Records[0].s3.object.key;

// Get document metadata
const metadata = await s3.headObject({
Bucket: bucketName,
Key: objectKey
}).promise();

const { ContentType: type, ContentLength: size } = metadata;

// Read email template
const templatePath = path.join(__dirname, 'templates', 'emailTemplate.html');
const template = fs.readFileSync(templatePath, 'utf-8');

const emailHtml = template
.replace('{{filename}}', objectKey)
.replace('{{size}}', size)
.replace('{{type}}', type);

// Set up email transport
const transporter = nodemailer.createTransport({
SES: ses
});

const emailParams = {
from: 'sender@example.com',
to: 'recipient@example.com',
subject: 'New Document Upload Notification',
html: emailHtml
};

await transporter.sendMail(emailParams);

return {
statusCode: 200,
body: JSON.stringify({
message: 'Email sent successfully!',
input: event,
}),
};
};