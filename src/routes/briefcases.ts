
import express, { Router } from "express"
import { BriefcasesController } from "../controllers/briefcases"
import { BriefcasesService } from "../services/briefcases"
import { S3UploadService } from "../services/aws"
import { CategoriesService } from "../services/categories"

function briefcasesRoutes(): Router {

    const router = express.Router()

    const categoriesService = new CategoriesService()
    const s3UploadService = new S3UploadService()
    const briefcasesService = new BriefcasesService()
    const briefcasesController = new BriefcasesController(briefcasesService, s3UploadService, categoriesService)

    router.post('/', briefcasesController.getAllBriefcaseFiles.bind(briefcasesController))
    router.patch('/', briefcasesController.deleteBriefCaseFile.bind(briefcasesController))
   
    return router
}


export { briefcasesRoutes }