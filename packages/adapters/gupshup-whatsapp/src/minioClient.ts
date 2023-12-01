import * as Minio from 'minio';
// import {FusionAuthClient} from '@fusionauth/typescript-client';
import configService from './gupshupWhatsappAdapterServiceConfig';
// let fusionAuth = new FusionAuthClient(configService.getConfig('fusionAuthAppID') || 'bf69486b-4733-4470-a592-f1bfce7af580', configService.getConfig('fusionAuthUrl') || 'https://local.fusionauth.io');

  // const minioLoginId = configService.getConfig('CDN_MINIO_LOGIN_ID') || '';
  // let minioPassword = configService.getConfig('CDN_MINIO_PASSWORD') || '';
  // let minioAppId = configService.getConfig('CDN_MINIO_APPLICATION_ID') || '';
  let minioBucketId = configService.getConfig('CDN_MINIO_BUCKET_ID') || '';
  let minioUrl = configService.getConfig('CDN_MINIO_URL') || '';
  // let minioFAKey = configService.getConfig('CDN_MINIO_FA_KEY') || '';
  // let minioFAUrl = configService.getConfig('CDN_MINIO_FA_URL') || '';

// const loadDefaultObjects = (): void => {
  // console.log(`Minio details, loginID: ${minioLoginId}, password: ${minioPassword}, appId: ${minioAppId}, bucketId: ${minioBucketId}, faKey: ${minioFAKey}, faUrl: ${minioFAUrl}, url: ${minioUrl}`);
  
  // let appID: string | null = null;

  // if (minioAppId !== null) {
  //   appID = minioAppId;
  // }

  // if (!fusionAuth) {
  //   fusionAuth = new FusionAuthClient(minioFAKey, minioFAUrl);
  // }
// };

const getFileSignedUrl = (name: string): string => {
  if (minioUrl.length === 0 || minioBucketId.length === 0) {
    console.error(`Minio URL or Minio Bucket was null. Minio URL: ${minioUrl}, Minio Bucket: ${minioBucketId}`);
    return '';
  }

  if (name.length === 0) {
    console.error('Passed filename was empty.');
    return '';
  }

  // Trim last '/' if present
  if (minioUrl.charAt(minioUrl.length - 1) === '/') {
    minioUrl = minioUrl.substring(0, minioUrl.length - 1);
  }
  if (minioBucketId.charAt(minioBucketId.length - 1) === '/') {
    minioBucketId = minioBucketId.substring(0, minioBucketId.length - 1);
  }

  // For public files {cdn_url}/{bucket}/{filename} can be directly accessed
  return `${minioUrl}/${minioBucketId}/${name}`;
};

export async function uploadFileFromPath(filePath: string, name: string): Promise<string> {
  try {
    /* Load default objects */
    // loadDefaultObjects();

    const minioClient = new Minio.Client({
      endPoint: minioUrl,
      port: 9000,
      useSSL: true,
      accessKey: 'Q3AM3UQ867SPQQA43P2F',
      secretKey: 'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG',
    })
    if (minioClient !== null) {
      console.log(`uploadFileFromPath:: filePath: ${filePath} Name : ${name}`);
      await minioClient.fPutObject(
        minioBucketId,
        name,
        filePath,
        (err: Error | null) => {
          if (err) {
            console.error(`Error uploading file: ${err.message}`);
          } else {
            console.log(`File uploaded successfully`);
          }
        }
      );

      return getFileSignedUrl(name);
    } else {
      console.error(`uploadFileFromPath:: Minio client is null`);
    }
  } catch (ex) {
    console.error(`Exception in minio uploadFileFromPath: ${ex}`);
  }

  return '';
}