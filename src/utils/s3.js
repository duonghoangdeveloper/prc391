const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

const uploadFileS3 = ({
  body,
  folder = 'avatar',
  filename = 'avatar',
  contentType = 'image/png',
}) => {
  const key = `${folder.toLowerCase()}/${filename.toLowerCase()}-${Date.now()}`;
  const params = {
    Bucket: 'prc391',
    Body: body,
    Key: key,
    ContentType: contentType,
    ACL: 'public-read',
  };

  return new Promise(function(resolve, reject) {
    s3.upload(params, function(err, data) {
      // handle error
      if (err) {
        reject(err);
      }
      // success
      if (data) {
        resolve(data);
      }
    });
  });
};

const deleteFileS3 = key => {
  const params = {
    Bucket: 'prc391',
    Key: key,
  };

  return new Promise(function(resolve, reject) {
    s3.deleteObject(params, function(err, data) {
      // handle error
      if (err) {
        reject(err);
      }
      // success
      if (data) {
        resolve(data);
      }
    });
  });
};

const getFileS3 = key => {
  const params = {
    Bucket: 'prc391',
    Key: key,
  };

  return new Promise(function(resolve, reject) {
    s3.headObject(params, function(err, data) {
      // handle error
      if (err) {
        reject(err);
      }
      // success
      if (data) {
        resolve(data);
      }
    });
  });
};

module.exports = {
  uploadFileS3,
  deleteFileS3,
  getFileS3,
};
