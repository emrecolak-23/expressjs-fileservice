import express, { Router } from "express"
import { requireAuth } from "../middlewares/require-auth"
import { FileTypesService } from "../services/file-types"
import { FileTypesController } from "../controllers/file-types"
import validate from "../middlewares/validate"
import { createFileTypeValidation, createManyFileTypeValidation } from "../validations/file-types"
import { isAdmin } from "../guards/isAdmin"

function fileTypesRoutes(): Router {

    const router = express.Router()

    const fileTypesService = new FileTypesService()
    const fileTypesController = new FileTypesController(fileTypesService)

    router.post('/', requireAuth, validate(createFileTypeValidation), isAdmin, fileTypesController.createFileType.bind(fileTypesController))
    router.post('/many', requireAuth, validate(createManyFileTypeValidation), isAdmin, fileTypesController.createManyFileTypes.bind(fileTypesController))
   
    return router
}


export { fileTypesRoutes }