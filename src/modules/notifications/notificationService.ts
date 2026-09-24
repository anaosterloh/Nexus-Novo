import { NotificationItem, NotificationSummary } from './types';

class NotificationService {
  private baseUrl = '/api/notifications';

  async listNotifications(params: { companyId: string; userId?: string; role?: string; department?: string }): Promise<NotificationItem[]> {
    const searchParams = new URLSearchParams(params as any);
    const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  }

  async getNotificationSummary(params: { companyId: string; userId?: string; role?: string; department?: string }): Promise<NotificationSummary> {
    const searchParams = new URLSearchParams(params as any);
    const response = await fetch(`${this.baseUrl}/summary?${searchParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch summary');
    return response.json();
  }

  async createNotification(data: Partial<NotificationItem>): Promise<NotificationItem> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create notification');
    return response.json();
  }

  async markAsRead(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}/read`, { method: 'PATCH' });
    if (!response.ok) throw new Error('Failed to mark as read');
  }

  async markAsUnread(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}/unread`, { method: 'PATCH' });
    if (!response.ok) throw new Error('Failed to mark as unread');
  }

  async snoozeNotification(id: string, date: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}/snooze`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snoozed_until: date })
    });
    if (!response.ok) throw new Error('Failed to snooze');
  }

  async resolveNotification(id: string, response_text: string, companyId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}/resolve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response_text, companyId })
    });
    if (!response.ok) throw new Error('Failed to resolve');
  }

  async archiveNotification(id: string, companyId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}/archive`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId })
    });
    if (!response.ok) throw new Error('Failed to archive');
  }
}

export const notificationService = new NotificationService();
