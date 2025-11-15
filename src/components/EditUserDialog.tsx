'use client';

import { useState } from 'react';
import { User } from '@/lib/db/repositories/userRepository';
import { Role } from '@/lib/access-control/permissions';
import { Dictionary } from '@/lib/i18n/getDictionary';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { updateUserAction } from '@/lib/actions/userActions';

export interface EditUserDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dictionary: Dictionary;
  roles: Role[];
  onUserUpdated: (user: User) => void;
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  dictionary,
  roles,
  onUserUpdated,
}: EditUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: user.email,
    username: user.username,
    password: '',
    fullName: user.fullName || '',
    phoneNumber: user.phoneNumber || '',
    groupIds: user.groupIds,
    isActive: user.isActive,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updateData: any = {
      email: formData.email,
      username: formData.username,
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      groupIds: formData.groupIds,
      isActive: formData.isActive,
    };

    if (formData.password) {
      updateData.password = formData.password;
    }

    const result = await updateUserAction(user.id, updateData);

    setIsSubmitting(false);

    if (result.success && result.user) {
      onUserUpdated(result.user);
      onOpenChange(false);
    } else {
      alert(result.error || 'Failed to update user');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{dictionary.users.editUser}</DialogTitle>
            <DialogDescription>{dictionary.users.userDetails}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{dictionary.common.email}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username">{dictionary.common.username}</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">{dictionary.common.password}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave empty to keep current password"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fullName">{dictionary.common.fullName}</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">{dictionary.common.phoneNumber}</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">{dictionary.users.role}</Label>
              <Select
                value={formData.groupIds[0] || ''}
                onValueChange={(value) =>
                  setFormData({ ...formData, groupIds: value ? [value] : [] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={dictionary.users.role} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked === true })
                }
              />
              <Label htmlFor="isActive">{dictionary.users.active}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {dictionary.common.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? dictionary.common.loading : dictionary.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
