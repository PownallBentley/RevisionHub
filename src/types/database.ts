export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'parent' | 'child';
  country: string | null;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  auth_user_id: string | null;
  name: string;
  year_group: string | null;
  exam_board: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  parent_id: string;
  child_id: string;
  code: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at: string;
}
