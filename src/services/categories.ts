import axios from "axios";

class CategoriesService {
  async getFileTypes(token: string, type: string) {
    try {
      const baseUri = process.env.CATEGORY_SERVICE_URI;
      const response = await axios.get(`${baseUri}/fileKind/${type}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error);
    }
  }
}

export { CategoriesService };
