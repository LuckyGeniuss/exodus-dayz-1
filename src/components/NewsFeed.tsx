import { useNews } from "@/hooks/useNews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Newspaper, Pin, ArrowRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";

interface NewsFeedProps {
  limit?: number;
  showTitle?: boolean;
}

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    update: 'Оновлення',
    event: 'Подія',
    promo: 'Акція',
    news: 'Новина',
    announcement: 'Анонс'
  };
  return labels[category] || category;
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    update: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    event: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    promo: 'bg-green-500/20 text-green-400 border-green-500/30',
    news: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    announcement: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  };
  return colors[category] || 'bg-muted text-muted-foreground border-border';
};

const NewsFeed = ({ limit = 3, showTitle = true }: NewsFeedProps) => {
  const { news, isLoading } = useNews(limit);

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-12">
        {showTitle && (
          <div className="flex items-center gap-3 mb-8">
            <Newspaper className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold">Новини</h2>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (news.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12">
      {showTitle && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Newspaper className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold">
              Останні <span className="text-primary">новини</span>
            </h2>
          </div>
          <Link to="/news">
            <Button variant="ghost" className="gap-2">
              Всі новини
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {news.map((post) => (
          <Link key={post.id} to={`/news/${post.id}`}>
            <Card className="overflow-hidden h-full hover:border-primary/50 transition-all duration-300 hover:shadow-lg group">
              <CardHeader className="p-0 relative">
                {post.image ? (
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Newspaper className="h-12 w-12 text-primary/50" />
                  </div>
                )}
                
                {post.is_pinned && (
                  <Badge className="absolute top-3 left-3 bg-yellow-500/90 text-yellow-950">
                    <Pin className="h-3 w-3 mr-1" />
                    Закріплено
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`${getCategoryColor(post.category)} text-xs`}
                  >
                    {getCategoryLabel(post.category)}
                  </Badge>
                  {post.published_at && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(post.published_at), { addSuffix: true, locale: uk })}
                    </span>
                  )}
                </div>

                <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>

                {post.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.summary}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default NewsFeed;
