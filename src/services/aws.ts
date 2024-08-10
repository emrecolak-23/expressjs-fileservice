import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { InternalServerError } from "../errors/internal-server-error";
import { BadRequestError } from "../errors/bad-request-error";
import { Readable } from "stream";

class S3UploadService {
  s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || "",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
      endpoint: process.env.AWS_S3_ENDPOINT,
    });
  }

  async uploadFileToS3(fileKey: string, fileContent: Buffer): Promise<any> {
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: fileKey,
          Body: fileContent,
        },
      });

      const result = await upload.done();
      console.log(`File "${fileKey}" uploaded successfully.`);
      return result;
    } catch (error: any) {
      console.error(error);
      console.error("Error: File upload failed.");
      throw new InternalServerError(error.message);
    }
  }

  async deleteFileFromS3(fileKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
    });

    try {
      await this.s3Client.send(command);
      console.log(`File "${fileKey}" deleted successfully.`);
    } catch (error: any) {
      console.error(error);
      console.error(`Error deleting file "${fileKey}" from S3.`);
      throw new InternalServerError(error.message);
    }
  }

  async generateSignedUrl(objectKey: string, expireSeconds: number = 3600) {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: objectKey,
    });

    try {
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expireSeconds,
      });
      return signedUrl;
    } catch (error: any) {
      console.error("Error creating signed URL", error);
      throw new InternalServerError(error.message);
    }
  }

  async listFiles() {
    const command = new ListObjectsV2Command({ Bucket: "isteyim-testbucket" });

    const { Contents } = await this.s3Client.send(command);
    const files = Contents!.map((file) => ({
      key: file.Key,
      size: file.Size,
      lastModified: file.LastModified,
      eTag: file.ETag,
    }));

    return files;
  }

  async getFileStream(key: string): Promise<any> {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    };

    try {
      const command = new GetObjectCommand(params);
      const data = await this.s3Client.send(command);

      const stream = data.Body as Readable;
      if (!(stream instanceof Readable)) {
        throw new BadRequestError("Expected Body to be a Readable stream");
      }

      const buffer = await this.streamToBuffer(stream);

      return buffer;
    } catch (error) {
      console.error("Error fetching file from S3:", error);
    }
  }

  private streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  }
}

export { S3UploadService };
