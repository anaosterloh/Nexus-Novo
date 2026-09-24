export type NotificationType = 'info' | 'warning' | 'urgent' | 'blocking';
export type NotificationStatus = 'unread' | 'read' | 'snoozed' | 'resolved' | 'archived';
export type NotificationScope = 'user' | 'role' | 'department' | 'company' | 'global';

export interface NotificationItem {
  id: string;
  company_id: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  scope: NotificationScope;
  target_user_id?: string | null;
  target_role?: string | null;
  target_department?: string | null;
  source_module?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  priority: number;
  requires_response: number | boolean;
  response_text?: string | null;
  created_by?: string | null;
  created_by_name?: string | null;
  read_at?: string | null;
  snoozed_until?: string | null;
  resolved_at?: string | null;
  archived_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationSummary {
  unread: number;
  urgent: number;
  blocking: number;
  snoozed: number;
  resolvedToday: number;
}
