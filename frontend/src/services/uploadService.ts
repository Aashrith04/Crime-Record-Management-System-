import { api } from "./api";
import { StandardApiResponse } from "@/types";

export interface UploadResponseData {
  file_name: string;
  saved_filename: string;
  file_url: string;
  file_size: number;
  content_type: string;
}

export const uploadService = {
  uploadFile: async (file: File): Promise<StandardApiResponse<UploadResponseData>> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/uploads", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
};
