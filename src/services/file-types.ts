import { FileTypes } from "../models/file-types"
import { CreateFileTypeDto } from "../dtos/create-file-type.dto"

class FileTypesService {
    
    async createFileType(params: CreateFileTypeDto) {

        const fileType = FileTypes.build(params)

        await fileType.save()

        return fileType

    }

    async createManyFileTypes(params: CreateFileTypeDto[]) {
        const fileTypes = FileTypes.insertMany(params)        
        await FileTypes.insertMany(fileTypes)

        return fileTypes   

    }

}

export { FileTypesService }