export type ExpertService = {
  name: string;
  price_fcfa: number | null;
  on_quote?: boolean;
};

export type Expert = {
  id: string;
  user_id: string | null;
  display_name: string;
  avatar_url: string | null;
  specialty: string;
  bio: string | null;
  city: string | null;
  rating: number;
  services: ExpertService[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
