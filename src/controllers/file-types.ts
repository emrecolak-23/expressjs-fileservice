
import { Request, Response } from "express"
import { FileTypesService } from "../services/file-types"
import SuccessResponse from "../responses/success-response"
import { CreateFileTypeDto } from "../dtos/create-file-type.dto"

class FileTypesController {

    constructor(private fileTypesService: FileTypesService) {
        this.fileTypesService = fileTypesService
    }

    async createFileType(req: Request, res: Response) {

        const params = req.body as CreateFileTypeDto

        const fileType = await this.fileTypesService.createFileType(params)

        res.status(201).json(new SuccessResponse({ fileType }))

    }

    async createManyFileTypes(req: Request, res: Response) {
            
        const params = req.body as CreateFileTypeDto[]
    
        const fileTypes = await this.fileTypesService.createManyFileTypes(params)

        res.status(201).json(new SuccessResponse({ fileTypes }))
    
    }

}

export { FileTypesController }