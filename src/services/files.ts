import { Files } from "../models/files";

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
}

export { FilesService };
