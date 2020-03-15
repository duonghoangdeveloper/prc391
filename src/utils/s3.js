const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

const BUCKET = 'prc391'

const uploadFileS3 = ({
  body,
  folder = 'missing',
  filename = 'missing',
  contentType = 'image/png',
}) => {
  const key = `${process.env.NODE_ENV || 'missing'}/${folder.toLowerCase()}/${filename.toLowerCase()}`;
  const params = {
    Bucket: BUCKET,
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
    Bucket: BUCKET,
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
    Bucket: BUCKET,
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

const emptyS3Directory = async (dir) => {
  const listParams = {
    Bucket: BUCKET,
    Prefix: dir
  };

  const listedObjects = await s3.listObjectsV2(listParams).promise();

  if (listedObjects.Contents.length === 0) return;

  const deleteParams = {
    Bucket: BUCKET,
    Delete: { Objects: [] }
  };

  listedObjects.Contents.forEach(({ Key }) => {
    deleteParams.Delete.Objects.push({ Key });
  });

  await s3.deleteObjects(deleteParams).promise();

  if (listedObjects.IsTruncated) await emptyS3Directory(dir);
}

module.exports = {
  uploadFileS3,
  deleteFileS3,
  getFileS3,
  emptyS3Directory
};
