import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Große, klickbare Kachel für die öffentliche Navigation (Stufe, Bereich, Thema).
export function TileLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description?: string;
}) {
  return (
    <Link href={href} className="block">
      <Card className="hover:border-primary h-full transition-colors">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      </Card>
    </Link>
  );
}
