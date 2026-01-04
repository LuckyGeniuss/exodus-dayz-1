import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface NewsPost {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  image: string | null;
  category: string;
  is_published: boolean;
  is_pinned: boolean;
  author_id: string;
  published_at: string | null;
  created_at: string;
}

export const useNews = (limit?: number) => {
  const { data: news = [], isLoading } = useQuery({
    queryKey: ['news', limit],
    queryFn: async () => {
      let query = supabase
        .from('news_posts')
        .select('*')
        .eq('is_published', true)
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as NewsPost[];
    }
  });

  return { news, isLoading };
};

export const useNewsPost = (id: string) => {
  const { data: post, isLoading } = useQuery({
    queryKey: ['news-post', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_posts')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return data as NewsPost;
    },
    enabled: !!id
  });

  return { post, isLoading };
};
