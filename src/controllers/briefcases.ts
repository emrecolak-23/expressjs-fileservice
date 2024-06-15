import { Request, Response } from "express";
import { BriefcasesService } from "../services/briefcases";
import { ListBriefcaseDto } from "../dtos/list-briefcase.dto";
import { S3UploadService } from "../services/aws";
import { CategoriesService } from "../services/categories";
import { Files } from "../models/files";
import SuccessResponse from "../responses/success-response";
import { i18n } from "../middlewares/translations";
import { NotFoundError } from "../errors/not-found-error";
class BriefcasesController {
  constructor(
    private briefcasesService: BriefcasesService,
    private s3UploadServie: S3UploadService,
    private categoriesService: CategoriesService
  ) {}

  async getAllBriefcaseFiles(req: Request, res: Response) {
    const {
      pageSize = 20,
      page = 1,
      search = "",
      sort = { createdAt: -1 },
    } = req.body;
    const skip = (page - 1) * pageSize;
    const userId = req.currentUser!.id;
    const token = req.token;

    const params: ListBriefcaseDto = {
      page,
      pageSize,
      search,
      skip,
      userId,
      sort,
    };
    const briefcaseFiles = await this.briefcasesService.getAllBriefcaseFiles(
      params
    );
    const updatedRows = await Promise.all(
      briefcaseFiles.rows.map(async (row: any) => {
        try {
          const category = await this.categoriesService.getFileTypes(
            token,
            row.type
          );

          return {
            ...row,
            category: category.value,
          };
        } catch (error) {
          console.error(
            `Error fetching category for row with type ${row.type}:`,
            error
          );
          return row;
        }
      })
    );

    briefcaseFiles.rows = updatedRows;

    res.status(200).json(new SuccessResponse(briefcaseFiles));
  }

  async deleteBriefCaseFile(req: Request, res: Response) {
    const { fileId } = req.body;
    const userId = req.currentUser!.id;

    await this.briefcasesService.deleteBriefCaseFile(fileId, userId);
    const file = await Files.findOne({ _id: fileId });

    if (!file) {
      throw new NotFoundError(i18n.__("file_not_found"));
    }

    const s3FileKey = file.path;
    console.log("File deleted from S3 in endpoint with briefcase");
    await this.s3UploadServie.deleteFileFromS3(s3FileKey);
    await Files.deleteOne({ _id: fileId });

    res.status(200).json(new SuccessResponse(fileId, i18n.__("file_deleted")));
  }
}

export { BriefcasesController };
