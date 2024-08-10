import express, { Router } from "express";
import { requireAuth } from "../middlewares/require-auth";
import { FilesService } from "../services/files";
import { FilesController } from "../controllers/files";
import { S3UploadService } from "../services/aws";
import { UsersService } from "../services/users";
import { DownloadService } from "../services/download";
import validate from "../middlewares/validate";
import { fileIsExist, createFileUrl, getAllFiles } from "../validations/files";
import { isValidUser } from "../guards/isValidUser";
import { isAdmin } from "../guards/isAdmin";
import { consulInstance } from "..";

function filesRoutes(): Router {
  const router = express.Router();
  const downloadService = new DownloadService();
  const filesService = new FilesService();
  const s3UploadService = new S3UploadService();
  const usersService = new UsersService();

  const filesController = new FilesController(
    filesService,
    s3UploadService,
    usersService,
    downloadService
  );

  router.post(
    "/",
    requireAuth,
    isValidUser,
    validate(createFileUrl),
    filesController.getFileUrl.bind(filesController)
  );

  router.post(
    "/user/cv",
    requireAuth,
    isValidUser,
    filesController.getUsersCv.bind(filesController)
  );

  router.post(
    "/all/files",
    requireAuth,
    isAdmin,
    validate(getAllFiles),
    filesController.getAllUsersFiles.bind(filesController)
  );

  router.post(
    "/isExist",
    requireAuth,
    isValidUser,
    validate(fileIsExist),
    filesController.fileIsExist.bind(filesController)
  );
  router.delete(
    "/:fileId",
    requireAuth,
    isValidUser,
    filesController.deleteFileFromS3.bind(filesController)
  );
  router.get(
    "/:fileId",
    requireAuth,
    filesController.showUserProfilePicture.bind(filesController)
  );
  return router;
}

export { filesRoutes };
