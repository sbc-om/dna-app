'use client';

import { RegisteredResource } from '@/lib/access-control/permissions';
import { Dictionary } from '@/lib/i18n/getDictionary';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export interface ResourcesTableProps {
  resources: RegisteredResource[];
  dictionary: Dictionary;
}

export function ResourcesTable({ resources, dictionary }: ResourcesTableProps) {
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      page: dictionary.resources.page,
      module: dictionary.resources.module,
      entity: dictionary.resources.entity,
    };
    return labels[type] || type;
  };

  if (resources.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {dictionary.resources.noResources}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{dictionary.resources.resourceKey}</TableHead>
            <TableHead>{dictionary.resources.resourceType}</TableHead>
            <TableHead>{dictionary.resources.defaultActions}</TableHead>
            <TableHead>{dictionary.resources.registered}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((resource) => (
            <TableRow key={resource.key}>
              <TableCell className="font-medium">{resource.key}</TableCell>
              <TableCell>
                <Badge variant="outline">{getTypeLabel(resource.type)}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {resource.defaultActions.map((action) => (
                    <Badge key={action} variant="secondary" className="text-xs">
                      {dictionary.permissions[action as keyof typeof dictionary.permissions] || action}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(resource.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
