import { Article } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ExpertAdviceCardProps {
  article: Article & { expert: any };
}

export default function ExpertAdviceCard({ article }: ExpertAdviceCardProps) {
  const expertInitials = article.expert.fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  return (
    <Card className="bg-white rounded-lg shadow-card overflow-hidden">
      <div className="h-48 bg-gray-200 overflow-hidden">
        <img 
          className="h-full w-full object-cover" 
          src={article.imageUrl} 
          alt={article.title}
        />
      </div>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
        <p className="mt-2 text-sm text-gray-600 line-clamp-3">
          {article.content}
        </p>
        <div className="mt-4 flex items-center">
          <Avatar>
            <AvatarImage src={article.expert.profileImage} />
            <AvatarFallback>{expertInitials}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{article.expert.fullName}</p>
            <p className="text-xs text-gray-500">{article.expert.role}</p>
          </div>
        </div>
        <a href="#" className="mt-4 inline-flex items-center text-primary hover:text-primary-dark text-sm">
          Read Article
          <svg className="ml-1 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </a>
      </CardContent>
    </Card>
  );
}
