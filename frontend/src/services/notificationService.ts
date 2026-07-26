import { api } from "./api";
import { StandardApiResponse } from "@/types";

export interface NotificationItem {
  id: number;
  public_id: string;
  user_id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export const notificationService = {
  getNotifications: async (limit: number = 20): Promise<StandardApiResponse<{ items: NotificationItem[]; unread_count: number }>> => {
    const res = await api.get("/notifications", { params: { limit } });
    return res.data;
  },

  getUnreadCount: async (): Promise<StandardApiResponse<{ unread_count: number }>> => {
    const res = await api.get("/notifications/unread-count");
    return res.data;
  },

  markAsRead: async (notificationId: number): Promise<StandardApiResponse<NotificationItem>> => {
    const res = await api.patch(`/notifications/${notificationId}/read`);
    return res.data;
  },

  markAllAsRead: async (): Promise<StandardApiResponse<{ user_id: number }>> => {
    const res = await api.post("/notifications/read-all");
    return res.data;
  },
};
