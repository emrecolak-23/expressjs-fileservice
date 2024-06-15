import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { FilesService } from "../services/files";
import { S3UploadService } from "../services/aws";
import { NotFoundError } from "../errors/not-found-error";
import { Files } from "../models/files";
import SuccessResponse from "../responses/success-response";
import { i18n } from "../middlewares/translations";
import { FileStatus } from "../types/file-status";
import { UsersService } from "../services/users";
import { DownloadService } from "../services/download";
import { UserRole } from "../types/user-role";
import { NotAuthorizedError } from "../errors/not-authorized-error";
import { CompanyLogoPublisher } from "../events/publishers/exception-handler/CompanyLogoPublisher";
import { channel } from "..";
import ErrorResponse from "../responses/error-response";

class FilesController {
  filesService;
  s3UploadService;
  usersService;
  downloadService;

  constructor(
    filesService: FilesService,
    s3UploadService: S3UploadService,
    usersService: UsersService,
    downloadService: DownloadService
  ) {
    this.filesService = filesService;
    this.s3UploadService = s3UploadService;
    this.usersService = usersService;
    this.downloadService = downloadService;
  }

  async fileIsExist(req: Request, res: Response) {
    const userId = req.currentUser!.id;
    const { fileType, id } = req.body;

    const query = {
      _id: id,
      userId,
    };

    const file = await this.filesService.getFileInfoById(query);
    if (!file) {
      return res
        .status(200)
        .json(new SuccessResponse({ status: FileStatus.NOT_EXIST }));
    }

    if (file.fileType !== fileType) {
      return res
        .status(200)
        .json(new SuccessResponse({ status: FileStatus.NOT_EXIST }));
    }

    if (fileType === "COMPANY_LOGO" && file) {
      await Files.updateOne({ _id: id }, { $set: { isActive: true } });
      new CompanyLogoPublisher(channel).publish({
        messageId: uuidv4(),
        type: "COMPANY_LOGO_CREATED",
        body: {
          companyId: file.userId,
          url:
            process.env.AWS_S3_CDN_URL +
            "/" +
            process.env.AWS_S3_STATIC_BUCKET +
            "/" +
            file.path,
        },
      });
      return res
        .status(200)
        .json(new SuccessResponse({ status: FileStatus.EXIST }));
    }

    const currentDate = new Date();
    const fileDate = new Date(file.updatedAt);

    const timeDifferenceInMilliseconds =
      currentDate.getTime() - fileDate.getTime();
    const timeDifferenceInHours =
      timeDifferenceInMilliseconds / (1000 * 60 * 60);

    if (timeDifferenceInHours > 1) {
      return res
        .status(200)
        .json(new SuccessResponse({ status: FileStatus.EXPIRED }));
    }
    await Files.updateOne({ _id: id }, { $set: { isActive: true } });
    res.status(200).json(new SuccessResponse({ status: FileStatus.EXIST }));
  }

  async getFileUrl(req: Request, res: Response) {
    const userId = req.currentUser!.id;
    const userRole = req.currentUser!.role;
    const fileId = req.body.id;
    const query: { _id: string; userId?: number } = {
      _id: fileId,
    };

    if (
      userRole !== UserRole.ROLE_ADMIN &&
      userRole !== UserRole.ROLE_BACKOFFICE &&
      userRole !== UserRole.ROLE_INMIDI_BACKOFFICE_ADMIN
    ) {
      query.userId = userId;
    }

    const file = await this.filesService.getFileInfoById(query);

    if (!file) {
      throw new NotFoundError(i18n.__("file_not_found"));
    }

    const signedUrl = await this.s3UploadService.generateSignedUrl(
      file.path,
      3600
    );
    if (signedUrl) {
      await Files.updateOne({ _id: fileId }, { $set: { isActive: true } });
    }

    res.status(200).json(new SuccessResponse({ signedUrl, fileId }));
  }

  async deleteFileFromS3(req: Request, res: Response) {
    const fileId = req.params.fileId;
    const file = await Files.findOne({ _id: fileId });
    const { id: userId } = req.currentUser!;
    if (!file) {
      throw new NotFoundError(i18n.__("file_not_found"));
    }

    if (file.fileType === "PROFILE_PICTURE") {
      console.log(req.ip, req.connection.remoteAddress, "req.ip");
      console.log("Profile picture cannot be deleted.", userId);
      return res
        .status(400)
        .json(new ErrorResponse(i18n.__("profile_picture_cannot_be_deleted")));
    }

    const s3FileKey = file.path;

    await this.s3UploadService.deleteFileFromS3(s3FileKey);
    console.log("File deleted from S3 in endpoint");
    await Files.deleteOne({ _id: fileId });
    res.status(200).json(new SuccessResponse(fileId, i18n.__("file_deleted")));
  }

  async getStaticFileUrl(req: Request, res: Response) {
    const fileName = req.params.fileName;
    const s3FileKey = `static/${fileName}`;
    const existingDownload = await this.downloadService.getDownloadInfo(
      s3FileKey,
      req.currentUser!.id
    );
    if (existingDownload?.count === 100) {
      throw new NotAuthorizedError(i18n.__("download_limit_exceeded"));
    }
    const signedUrl = await this.s3UploadService.generateSignedUrl(
      s3FileKey,
      3600
    );
    await this.downloadService.updateDownloadCount(
      s3FileKey,
      req.currentUser!.id
    );

    res.status(200).json(new SuccessResponse(signedUrl));
  }

  async showUserProfilePicture(req: Request, res: Response) {
    const { fileId } = req.params;
    const file = await this.filesService.getFileById(fileId);

    if (!file) {
      throw new NotFoundError(i18n.__("file_not_found"));
    }

    const s3FileKey = file.path;

    const signedUrl = await this.s3UploadService.generateSignedUrl(
      s3FileKey,
      3600
    );

    res.status(200).json(new SuccessResponse(signedUrl));
  }
}

export { FilesController };
