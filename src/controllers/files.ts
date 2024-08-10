import { Request, Response } from "express";
import * as path from "path";
import fs from "fs";
import * as tmp from "tmp";
import { exec } from "child_process";
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
import parsePhoneNumber from "libphonenumber-js";
import { PDFDocument } from "pdf-lib";
import ejs from "ejs";
import { consulInstance } from "..";

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

  async getAllUsersFiles(req: Request, res: Response) {
    const { userId } = req.body;
    const files = await this.filesService.getAllUsersFiles(userId);

    const result = await Promise.all(
      files.map(async (file) => {
        const signedUrl = await this.s3UploadService.generateSignedUrl(
          file.path,
          3600
        );

        return {
          id: file._id,
          fileType: file.fileType,
          signedUrl,
        };
      })
    );

    return res.status(200).json(new SuccessResponse(result));
  }

  async getUsersCv(req: Request, res: Response) {
    const { userId } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    const userInfo = await this.filesService.getUserInfoById(userId, token!);
    console.log(userInfo, "userInfo");
    const files = await this.filesService.getAllUsersFiles(userId);

    const phoneNumber = parsePhoneNumber(userInfo.phoneNumber);

    const htmlTemplatePath = path.join(
      __dirname,
      "..",
      "..",
      "resume-page.ejs"
    );

    let kvConfig = `config/file-service/cv-template`;
    let consulCvTemplate: any;
    const consulClient = consulInstance.getConsulClient();
    consulCvTemplate = await consulClient.kv.get(kvConfig);
    console.log(consulCvTemplate.Value, "consulCvTemplate");
    let htmlContent = "";
    try {
      htmlContent = ejs.render(consulCvTemplate.Value, {
        fullName: `${userInfo.name} ${userInfo.surname}`,
        email: userInfo.email,
        phoneNumber: phoneNumber?.formatInternational() || "",
        profession: userInfo.profession.profession,
        photoUrl: userInfo.photoUrl,
        education: [
          ...(userInfo?.highSchool
            ? [
                {
                  date: `${new Date(
                    userInfo.highSchool.startDate
                  ).getFullYear()} - ${new Date(
                    userInfo.highSchool.endDate
                  ).getFullYear()}`,
                  faculty: userInfo.highSchool.highSchoolType,
                  university: userInfo.highSchool.name,
                  department: userInfo.highSchool.department,
                  grade: null,
                  gradingSystem: null,
                },
              ]
            : []),
          ...(userInfo?.associate
            ? userInfo.associate.map((associate: any) => {
                const startYear = new Date(associate.startDate).getFullYear();
                const endYear = new Date(associate.endDate).getFullYear();
                return {
                  date: `${startYear} - ${endYear}`,
                  grade: associate.grade,
                  gradingSystem: associate.gradingSystem,
                  university: associate.university,
                  faculty: associate.faculty,
                  department: associate.department,
                };
              })
            : []),
          ...(userInfo?.bachelors
            ? userInfo.bachelors.map((bachelor: any) => {
                const startYear = new Date(bachelor.startDate).getFullYear();
                const endYear = new Date(bachelor.endDate).getFullYear();
                return {
                  date: `${startYear} - ${endYear}`,
                  grade: bachelor.grade,
                  gradingSystem: bachelor.gradingSystem,
                  university: bachelor.university,
                  faculty: bachelor.faculty,
                  department: bachelor.department,
                };
              })
            : []),
          ...(userInfo?.master
            ? userInfo.master.map((master: any) => {
                const startYear = new Date(master.startDate).getFullYear();
                const endYear = new Date(master.endDate).getFullYear();
                return {
                  date: `${startYear} - ${endYear}`,
                  grade: master.grade,
                  gradingSystem: master.gradingSystem,
                  university: master.university,
                  faculty: master.faculty,
                  department: master.department,
                };
              })
            : []),
          ...(userInfo?.doctorate
            ? userInfo.doctorate.map((doctorate: any) => {
                const startYear = new Date(doctorate.startDate).getFullYear();
                const endYear = new Date(doctorate.endDate).getFullYear();
                return {
                  date: `${startYear} - ${endYear}`,
                  grade: doctorate.grade,
                  gradingSystem: doctorate.gradingSystem,
                  university: doctorate.university,
                  faculty: doctorate.faculty,
                  department: doctorate.department,
                  level: "Bachelor", // Yeni eklenen alan
                };
              })
            : []),
        ],
        workExperience: userInfo.experiences.map((experience: any) => {
          const startYear = new Date(experience.startDate).getFullYear();
          const endYear = new Date(experience.endDate).getFullYear();
          return {
            date: `${startYear} - ${endYear}`,
            position: experience.profession,
            company: experience.company,
          };
        }),
        certificates: userInfo.courses.map((course: any) => {
          const year = new Date(course.date).getFullYear();
          return {
            date: year,
            certificate: course.institution,
            title: course.courseName,
          };
        }),
        references: userInfo.references.map((reference: any) => {
          return {
            name: reference.fullName,
            email: reference.email,
            phone: reference.phoneNumber || "",
            position: reference.position,
            company: reference.company,
          };
        }),
        fieldsToWork: userInfo.willingProfessions.map((profession: any) => {
          return {
            field: profession.profession,
            experienceYears: profession.experience,
          };
        }),
        languages: userInfo.foreignLanguages.map((language: any) => {
          return {
            language: language.language,
            level: language.languageLevel,
          };
        }),
        documents: [],
        about: userInfo?.about,
      });
    } catch (error) {
      console.log(error, "error");
    }
    console.log(htmlContent, "htmlContent");

    const tempHtmlFilePath = await new Promise<string>((resolve, reject) => {
      tmp.file(
        {
          discardDescriptor: true,
          prefix: "resume-",
          postfix: ".html",
          mode: parseInt("0600", 8),
        },
        (err, filePath, fd, cleanupCallback) => {
          if (err) return reject(err);

          fs.writeFileSync(filePath, htmlContent);
          resolve(filePath);
        }
      );
    });
    const tempPdfFileName = path.basename(tempHtmlFilePath, ".html") + ".pdf";
    const tempPdfFilePath = path.join(
      path.dirname(tempHtmlFilePath),
      tempPdfFileName
    );

    exec(
      `wkhtmltopdf --zoom 0.9 ${tempHtmlFilePath} ${tempPdfFilePath}`,
      async (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }

        const cvFile = fs.readFileSync(tempPdfFilePath);

        fs.unlinkSync(tempHtmlFilePath);

        const fileBuffers = await Promise.all(
          files.map(async (file) => {
            try {
              const buffer = await this.s3UploadService.getFileStream(
                file.path
              );
              if (buffer instanceof Buffer) {
                return buffer;
              } else {
                console.error(`Expected buffer but received ${typeof buffer}`);
                return Buffer.alloc(0);
              }
            } catch (error) {
              console.error(`Error fetching file from S3: ${error}`);
              return Buffer.alloc(0);
            }
          })
        );

        const mergedPdf = await PDFDocument.create();

        for (const pdfBytes of [cvFile, ...fileBuffers]) {
          const pdf = await PDFDocument.load(pdfBytes);
          const copiedPages = await mergedPdf.copyPages(
            pdf,
            pdf.getPageIndices()
          );
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();
        fs.writeFileSync(tempPdfFilePath, mergedPdfBytes);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=resume.pdf");
        res.download(tempPdfFilePath, "resume.pdf");
      }
    );
  }
}

export { FilesController };
