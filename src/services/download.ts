import { Download } from "../models/downloads";


class DownloadService {
   
    async createDownload(fileKey:string, userId:number) {
        const download = Download.build({ fileKey, count: 1, userId });
        await download.save();
        return download;
    }
    async getDownloadInfo(fileKey: string, userId: number) {
        const download = await Download.findOne({ fileKey, userId });
        return download;
    }
    async updateDownloadCount(fileKey:string, userId:number) {
        const download = await this.getDownloadInfo(fileKey, userId);
        if (!download) {
            this.createDownload(fileKey, userId);
            return
        }
        download.count++;
        await download.save();
        return download;
    }
}

export { DownloadService }