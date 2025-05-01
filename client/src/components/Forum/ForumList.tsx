import React, { useState } from 'react';
import { ForumPost, ForumCategory } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, Calendar } from 'lucide-react';
import { ForumPost as ForumPostComponent } from './ForumPost';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface ForumListProps {
  posts: ForumPost[];
  onVote: (postId: number, vote: 'like' | 'dislike') => void;
  onComment: (postId: number, content: string) => void;
  onApprove: (postId: number) => void;
  onReject: (postId: number, reason: string) => void;
}

export function ForumList({
  posts,
  onVote,
  onComment,
  onApprove,
  onReject,
}: ForumListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortBy, setSortBy] = useState<'date' | 'likes' | 'comments'>('date');
  const [showOnlyApproved, setShowOnlyApproved] = useState(false);
  const [showOnlyMyPosts, setShowOnlyMyPosts] = useState(false);

  const categories = ['all', ...new Set(posts.map(post => post.category))];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesDate = !dateRange || (
      new Date(post.createdAt) >= (dateRange.from || new Date(0)) &&
      new Date(post.createdAt) <= (dateRange.to || new Date())
    );
    const matchesApproval = !showOnlyApproved || post.approved;
    const matchesUser = !showOnlyMyPosts || post.userId === user?.id;

    return matchesSearch && matchesCategory && matchesDate && matchesApproval && matchesUser;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'likes':
        return (b.likes - b.dislikes) - (a.likes - a.dislikes);
      case 'comments':
        return b.comments.length - a.comments.length;
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Forum</CardTitle>
            {user && (
              <Button onClick={() => window.location.href = '/forum/new'}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau post
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'Toutes les catégories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Trier par</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="likes">Popularité</SelectItem>
                      <SelectItem value="comments">Commentaires</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Période</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, 'PPP', { locale: fr })} -{' '}
                              {format(dateRange.to, 'PPP', { locale: fr })}
                            </>
                          ) : (
                            format(dateRange.from, 'PPP', { locale: fr })
                          )
                        ) : (
                          <span>Choisir une période</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="approved"
                        checked={showOnlyApproved}
                        onCheckedChange={(checked) => setShowOnlyApproved(checked as boolean)}
                      />
                      <Label htmlFor="approved">Afficher uniquement les posts approuvés</Label>
                    </div>
                    {user && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="myPosts"
                          checked={showOnlyMyPosts}
                          onCheckedChange={(checked) => setShowOnlyMyPosts(checked as boolean)}
                        />
                        <Label htmlFor="myPosts">Afficher uniquement mes posts</Label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <ForumPostComponent
                  key={post.id}
                  post={post}
                  onVote={(vote) => onVote(post.id, vote)}
                  onComment={(content) => onComment(post.id, content)}
                  onReport={(reason) => onReject(post.id, reason)}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 