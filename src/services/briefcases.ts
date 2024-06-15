import { ListBriefcaseDto } from "../dtos/list-briefcase.dto";
import { Briefcase } from "../models/briefcases";

class BriefcasesService {
    
    
    async getAllBriefcaseFiles(params: ListBriefcaseDto) {

        const query: { userId: number, $or?: any } = {
            userId: params.userId,
        }

        let searchQuery:any = {}
      

        if (params.search !== "") {
            const searchFields = ["title", "name", "description"];
            const regexOptions = "i";
            const orClauses = searchFields.map(field => ({ [field]: { $regex: params.search, $options: regexOptions } }));
			searchQuery = {
				$or: orClauses
			};
		}

        const pipeline = [
            {
                $match: query
            },
            {
                $unwind: {
                  path: "$files",
                }
              },
              {
                $lookup: {
                  from: "files",
                  localField: "files",
                  foreignField: "_id",
                  as: "filesInfo"
                }
              },
              {
                $unwind: {
                  path: "$filesInfo",
                }
              },
              {
                $project: {
                  _id: "$filesInfo._id",
                  name: "$filesInfo.name",
                  mime: "$filesInfo.mime",
                  title: "$filesInfo.title",
                  isDigital: "$filesInfo.isDigital",
                  description: "$filesInfo.description",
                  fileType: "$filesInfo.fileType",
                  createdAt: "$filesInfo.createdAt",
                  updatedAt: "$filesInfo.updatedAt"
                }
            },
            {
                $lookup: {
                    from: "filetypes",
                    localField: "fileType",
                    foreignField: "fileType",
                    as: "filesTypeInfo"
                    
                }
            },
            {
                $unwind: {
                    path: "$filesTypeInfo",
                
                }
            },
            {
                $addFields: {
                    type: "$filesTypeInfo.type"
                }
            },
            {
                $project: {
                    filesTypeInfo: 0
                }
            },
            {
                $match: searchQuery
            },
        ];
        
       
        const briefcaseFiles = await Briefcase.aggregate(pipeline).sort(params.sort).skip(params.skip).limit(params.pageSize)
        const count = (await Briefcase.aggregate(pipeline)).length
                                                    
        return {
            rows: briefcaseFiles || [],
            count: count,
            page: params.page,
            pageSize: params.pageSize,
            totalPage: Math.ceil((count || 0) / params.pageSize)
        }

    }


    async deleteBriefCaseFile(fileId: string, userId: number) {
                
                const briefcase = await Briefcase.findOne({ userId: userId })
                if (!briefcase) {
                    throw new Error('Briefcase not found')
                }
    
                await Briefcase.updateOne({ userId: userId }, { $pull: { files: fileId } })

    }
}

export { BriefcasesService }