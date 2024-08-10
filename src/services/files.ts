import { Files } from "../models/files";
import { FileType } from "../types/file-types";
import axios from "axios";

class FilesService {
  async getFileInfoById(query: { _id: string; userId?: number }) {
    const file = await Files.findOne({
      _id: query._id,
      ...(query.userId && { userId: query.userId }),
    });
    return file;
  }

  async getFileById(fileId: string) {
    const file = await Files.findById(fileId);
    return file;
  }

  async getAllUsersFiles(userId: number) {
    const files = await Files.find({
      userId,
      fileType: {
        $in: [
          FileType.ASSOCIATE_DIPLOMA,
          FileType.BACHELOR_DIPLOMA,
          FileType.CERTIFICATION,
          FileType.HIGH_SCHOOL_DIPLOMA,
          FileType.MASTER_DIPLOMA,
          FileType.PHD_DIPLOMA,
          FileType.CERTIFICATION,
        ],
      },
    });
    return files;
  }

  async getUserInfoById(userId: number, token: string) {
    const userInfo = await axios.get(
      `https://test.isteyim.com/gateway/reviews/applicants/${userId}?email=true&phone=true`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return userInfo.data;
  }
}

export { FilesService };
