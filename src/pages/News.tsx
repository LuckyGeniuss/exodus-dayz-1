import { useParams, Link } from "react-router-dom";
import { useNews, useNewsPost } from "@/hooks/useNews";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Pin, Newspaper, User } from "lucide-react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

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

// News List Page
export const NewsListPage = () => {
  const { news, isLoading } = useNews();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Newspaper className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Новини та оновлення</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : news.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <Newspaper className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-semibold mb-2">Новин поки немає</h2>
              <p className="text-muted-foreground">Слідкуйте за оновленнями!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          {format(new Date(post.published_at), 'dd MMM yyyy', { locale: uk })}
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
        )}
      </main>
      <Footer />
    </div>
  );
};

// Single News Post Page
export const NewsPostPage = () => {
  const { id } = useParams<{ id: string }>();
  const { post, isLoading } = useNewsPost(id || '');

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 text-center">
          <Newspaper className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Новину не знайдено</h1>
          <p className="text-muted-foreground mb-4">Ця публікація не існує або була видалена</p>
          <Link to="/news">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              До списку новин
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Link to="/news" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад до новин
        </Link>

        <article>
          <div className="flex items-center gap-3 mb-4">
            <Badge 
              variant="outline" 
              className={`${getCategoryColor(post.category)}`}
            >
              {getCategoryLabel(post.category)}
            </Badge>
            {post.is_pinned && (
              <Badge className="bg-yellow-500/90 text-yellow-950">
                <Pin className="h-3 w-3 mr-1" />
                Закріплено
              </Badge>
            )}
          </div>

          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            {post.published_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(post.published_at), 'dd MMMM yyyy, HH:mm', { locale: uk })}
              </span>
            )}
          </div>

          {post.image && (
            <div className="aspect-video overflow-hidden rounded-lg bg-muted mb-8">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="prose prose-lg dark:prose-invert max-w-none">
            {post.content.split('\n').map((paragraph, index) => (
              <p key={index} className="text-foreground leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default NewsListPage;
