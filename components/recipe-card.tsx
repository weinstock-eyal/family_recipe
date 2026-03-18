import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Heart, UtensilsCrossed, ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
type RecipeCardProps = {
  id: number;
  title: string;
  uploadedBy: string;
  createdAt: Date;
  imageUrl: string | null;
  tags: string[] | null;
  hasIngredients: boolean;
  likes: number;
};

export function RecipeCard({
  id,
  title,
  uploadedBy,
  createdAt,
  imageUrl,
  tags,
  hasIngredients,
  likes,
}: RecipeCardProps) {

  return (
    <Link href={`/recipes/${id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        {imageUrl ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-t-xl bg-muted">
            <ImageIcon className="size-10 text-muted-foreground/50" />
          </div>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold leading-tight line-clamp-2">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>מאת {uploadedBy}</span>
            <span>{format(createdAt, "dd/MM/yyyy")}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {hasIngredients && (
              <Badge variant="outline" className="gap-1 border-success/30 bg-success/10 text-success">
                <UtensilsCrossed className="size-3" />
                מרכיבים
              </Badge>
            )}
            {tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {likes > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Heart className="size-3.5 fill-current text-pink-500" />
              {likes}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
