'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User } from '@/lib/db/repositories/userRepository';
import { Dictionary } from '@/lib/i18n/getDictionary';
import { updateUserAction } from '@/lib/actions/userActions';
import { Upload } from 'lucide-react';

interface EditKidProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kid: User;
  dictionary: Dictionary;
  onProfileUpdated: (updatedKid: User) => void;
}

export function EditKidProfileDialog({
  open,
  onOpenChange,
  kid,
  dictionary,
  onProfileUpdated,
}: EditKidProfileDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: kid.fullName || '',
    nationalId: kid.nationalId || '',
    birthDate: kid.birthDate || '',
    gender: kid.gender || '',
    phoneNumber: kid.phoneNumber || '',
    address: kid.address || '',
    school: kid.school || '',
    grade: kid.grade || '',
    medicalInfo: kid.medicalInfo || '',
    position: kid.position || '',
    preferredFoot: kid.preferredFoot || '',
    height: kid.height || '',
    weight: kid.weight || '',
    country: kid.country || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const updates: any = {
      fullName: formData.fullName,
      nationalId: formData.nationalId,
      birthDate: formData.birthDate,
      gender: formData.gender as 'male' | 'female' | undefined,
      phoneNumber: formData.phoneNumber,
      address: formData.address,
      school: formData.school,
      grade: formData.grade,
      medicalInfo: formData.medicalInfo,
      position: formData.position,
      preferredFoot: formData.preferredFoot as 'left' | 'right' | 'both' | undefined,
      height: formData.height ? parseInt(formData.height.toString()) : undefined,
      weight: formData.weight ? parseInt(formData.weight.toString()) : undefined,
      country: formData.country,
    };

    const result = await updateUserAction(kid.id, updates);
    setLoading(false);

    if (result.success && result.user) {
      onProfileUpdated(result.user);
      onOpenChange(false);
    } else {
      alert(result.error || 'Failed to update profile');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dictionary.users.editUser}</DialogTitle>
          <DialogDescription>
            Update the child's profile information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Basic Info */}
            <div className="text-lg font-semibold text-[#1E3A8A] border-b pb-2">
              Basic Information
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">{dictionary.users.name}</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="nationalId">{dictionary.users.nationalId}</Label>
                <Input
                  id="nationalId"
                  value={formData.nationalId}
                  onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="birthDate">Birth Date</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="phoneNumber">{dictionary.common.phoneNumber}</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>

            {/* Education Info */}
            <div className="text-lg font-semibold text-[#1E3A8A] border-b pb-2 mt-4">
              Education & Medical
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="school">School</Label>
                <Input
                  id="school"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="medicalInfo">Medical Information</Label>
                <Input
                  id="medicalInfo"
                  value={formData.medicalInfo}
                  onChange={(e) => setFormData({ ...formData, medicalInfo: e.target.value })}
                  placeholder="Allergies, medications, medical conditions..."
                />
              </div>
            </div>

            {/* Sports Info */}
            <div className="text-lg font-semibold text-[#1E3A8A] border-b pb-2 mt-4">
              Sports Information
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Position</Label>
                <Select value={formData.position} onValueChange={(value) => setFormData({ ...formData, position: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                    <SelectItem value="Defender">Defender</SelectItem>
                    <SelectItem value="Midfielder">Midfielder</SelectItem>
                    <SelectItem value="Forward">Forward</SelectItem>
                    <SelectItem value="Winger">Winger</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="preferredFoot">Preferred Foot</Label>
                <Select value={formData.preferredFoot} onValueChange={(value) => setFormData({ ...formData, preferredFoot: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select foot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <div className="px-3 py-1 rounded-lg bg-blue-500 text-white font-bold text-sm">
                    {formData.height || '0'}
                  </div>
                </div>
                <input
                  id="height"
                  type="range"
                  min="50"
                  max="250"
                  step="1"
                  value={formData.height || '50'}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="slider w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  aria-label="Height in centimeters"
                  title="Height in centimeters"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((parseFloat(String(formData.height || '50')) - 50) / 200) * 100}%, rgb(229, 231, 235) ${((parseFloat(String(formData.height || '50')) - 50) / 200) * 100}%, rgb(229, 231, 235) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>50</span>
                  <span>150</span>
                  <span>250</span>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <div className="px-3 py-1 rounded-lg bg-blue-500 text-white font-bold text-sm">
                    {formData.weight || '0'}
                  </div>
                </div>
                <input
                  id="weight"
                  type="range"
                  min="10"
                  max="150"
                  step="1"
                  value={formData.weight || '10'}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="slider w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  aria-label="Weight in kilograms"
                  title="Weight in kilograms"
                  style={{
                    background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${((parseFloat(String(formData.weight || '10')) - 10) / 140) * 100}%, rgb(229, 231, 235) ${((parseFloat(String(formData.weight || '10')) - 10) / 140) * 100}%, rgb(229, 231, 235) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>10</span>
                  <span>80</span>
                  <span>150</span>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {dictionary.common.cancel}
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#30B2D2] hover:bg-[#1E3A8A]">
              {loading ? dictionary.common.loading : dictionary.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
