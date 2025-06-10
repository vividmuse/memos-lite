import { AwsClient } from 'aws4fetch';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

export class R2ApiClient {
  private client: AwsClient;
  private config: R2Config;

  constructor(config: R2Config) {
    this.config = config;
    this.client = new AwsClient({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: 'auto',
      service: 's3'
    });
  }

  // 上传文件到 R2
  async putObject(key: string, body: ArrayBuffer, contentType: string, metadata: Record<string, string> = {}) {
    const url = `https://${this.config.accountId}.r2.cloudflarestorage.com/${this.config.bucketName}/${key}`;
    
    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };

    // 添加自定义元数据
    Object.keys(metadata).forEach(metaKey => {
      headers[`X-Amz-Meta-${metaKey}`] = metadata[metaKey];
    });

    const request = new Request(url, {
      method: 'PUT',
      headers,
      body,
    });

    const signedRequest = await this.client.sign(request);
    const response = await fetch(signedRequest);

    if (!response.ok) {
      throw new Error(`R2 upload failed: ${response.status} ${response.statusText}`);
    }

    return {
      key,
      etag: response.headers.get('ETag'),
      url: `${this.config.publicUrl}/${key}`,
      size: body.byteLength
    };
  }

  // 删除文件
  async deleteObject(key: string) {
    const url = `https://${this.config.accountId}.r2.cloudflarestorage.com/${this.config.bucketName}/${key}`;
    
    const request = new Request(url, {
      method: 'DELETE',
    });

    const signedRequest = await this.client.sign(request);
    const response = await fetch(signedRequest);

    if (!response.ok && response.status !== 404) {
      throw new Error(`R2 delete failed: ${response.status} ${response.statusText}`);
    }

    return response.ok || response.status === 404;
  }

  // 获取对象信息
  async headObject(key: string) {
    const url = `https://${this.config.accountId}.r2.cloudflarestorage.com/${this.config.bucketName}/${key}`;
    
    const request = new Request(url, {
      method: 'HEAD',
    });

    const signedRequest = await this.client.sign(request);
    const response = await fetch(signedRequest);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`R2 head failed: ${response.status} ${response.statusText}`);
    }

    return {
      key,
      contentType: response.headers.get('Content-Type'),
      contentLength: parseInt(response.headers.get('Content-Length') || '0'),
      etag: response.headers.get('ETag'),
      lastModified: response.headers.get('Last-Modified')
    };
  }
}

// 创建R2客户端实例的工厂函数
export function createR2Client(env: any): R2ApiClient {
  const config: R2Config = {
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucketName: env.R2_BUCKET_NAME,
    publicUrl: env.R2_PUBLIC_URL
  };

  // 验证配置
  const requiredFields = ['accountId', 'accessKeyId', 'secretAccessKey', 'bucketName', 'publicUrl'];
  for (const field of requiredFields) {
    if (!config[field as keyof R2Config]) {
      throw new Error(`R2 configuration missing: ${field}`);
    }
  }

  return new R2ApiClient(config);
} 