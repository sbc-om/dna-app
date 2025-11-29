'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Award, Plus, Edit, Trash2 } from 'lucide-react';
import { Medal } from '@/lib/db/repositories/medalRepository';
import { getMedalsAction, createMedalAction, updateMedalAction, deleteMedalAction } from '@/lib/actions/medalActions';
import { ConfirmDialog } from './ConfirmDialog';

interface MedalsManagementProps {
  dictionary: any;
}

export function MedalsManagement({ dictionary }: MedalsManagementProps) {
  const [medals, setMedals] = useState<Medal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMedal, setEditingMedal] = useState<Medal | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [medalToDelete, setMedalToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    points: 10,
    icon: '🏆',
    isActive: true,
  });

  useEffect(() => {
    loadMedals();
  }, []);

  const loadMedals = async () => {
    setLoading(true);
    try {
      const result = await getMedalsAction();
      if (result.success && result.medals) {
        setMedals(result.medals);
      }
    } catch (error) {
      console.error('Load medals error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (medal?: Medal) => {
    if (medal) {
      setEditingMedal(medal);
      setFormData({
        name: medal.name,
        nameAr: medal.nameAr,
        description: medal.description,
        descriptionAr: medal.descriptionAr,
        points: medal.points,
        icon: medal.icon,
        isActive: medal.isActive,
      });
    } else {
      setEditingMedal(null);
      setFormData({
        name: '',
        nameAr: '',
        description: '',
        descriptionAr: '',
        points: 10,
        icon: '🏆',
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingMedal) {
        const result = await updateMedalAction(editingMedal.id, formData);
        if (result.success) {
          loadMedals();
          setDialogOpen(false);
        }
      } else {
        const result = await createMedalAction(formData);
        if (result.success) {
          loadMedals();
          setDialogOpen(false);
        }
      }
    } catch (error) {
      console.error('Save medal error:', error);
    }
  };

  const handleDelete = async () => {
    if (!medalToDelete) return;

    try {
      const result = await deleteMedalAction(medalToDelete);
      if (result.success) {
        loadMedals();
        setDeleteConfirmOpen(false);
        setMedalToDelete(null);
      }
    } catch (error) {
      console.error('Delete medal error:', error);
    }
  };

  const openDeleteConfirm = (medalId: string) => {
    setMedalToDelete(medalId);
    setDeleteConfirmOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-[#262626] dark:text-[#DDDDDD]">{dictionary.common.loading}</p>
      </div>
    );
  }

  return (
    <>
      <Card className="bg-white dark:bg-[#262626] border-[#DDDDDD] dark:border-[#262626]">
        <CardHeader className="border-b border-[#DDDDDD] dark:border-[#262626]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[#262626] dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-[#FF5F02]" />
                {dictionary.settings.medals}
              </CardTitle>
              <CardDescription className="text-[#262626] dark:text-[#DDDDDD]">
                {dictionary.settings.medalsDescription}
              </CardDescription>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-[#FF5F02] hover:bg-[#262626] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {dictionary.settings.createMedal}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {medals.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-12 h-12 mx-auto text-[#DDDDDD] mb-4" />
              <p className="text-[#262626] dark:text-[#DDDDDD]">
                {dictionary.settings.noMedals}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {medals.map((medal) => (
                <div
                  key={medal.id}
                  className="p-4 rounded-lg border-2 border-[#DDDDDD] dark:border-[#262626] bg-white dark:bg-[#262626]"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-4xl">{medal.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#262626] dark:text-white">
                        {medal.name}
                      </h4>
                      <p className="text-sm text-[#262626] dark:text-[#DDDDDD] mt-1">
                        {medal.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#DDDDDD] dark:border-[#262626]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white px-2 py-1 rounded bg-[#FF5F02]">
                        +{medal.points} pts
                      </span>
                      {!medal.isActive && (
                        <span className="text-xs text-[#262626] dark:text-[#DDDDDD] px-2 py-1 rounded bg-[#DDDDDD] dark:bg-[#000000]">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(medal)}
                        className="h-8 w-8 p-0 hover:bg-[#DDDDDD] dark:hover:bg-[#000000]"
                      >
                        <Edit className="w-4 h-4 text-[#FF5F02]" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteConfirm(medal.id)}
                        className="h-8 w-8 p-0 hover:bg-[#DDDDDD] dark:hover:bg-[#000000]"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-[#262626] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#262626] dark:text-white">
              {editingMedal ? dictionary.settings.editMedal : dictionary.settings.createMedal}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#262626] dark:text-white">
                  {dictionary.settings.medalName}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white dark:bg-[#262626] border-[#DDDDDD] dark:border-[#262626]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameAr" className="text-[#262626] dark:text-white">
                  {dictionary.settings.medalNameAr}
                </Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  className="bg-white dark:bg-[#262626] border-[#DDDDDD] dark:border-[#262626]"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#262626] dark:text-white">
                {dictionary.settings.medalDescription}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white dark:bg-[#262626] border-[#DDDDDD] dark:border-[#262626]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionAr" className="text-[#262626] dark:text-white">
                {dictionary.settings.medalDescriptionAr}
              </Label>
              <Textarea
                id="descriptionAr"
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                className="bg-white dark:bg-[#262626] border-[#DDDDDD] dark:border-[#262626]"
                dir="rtl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon" className="text-[#262626] dark:text-white">
                  {dictionary.settings.medalIcon}
                </Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="bg-white dark:bg-[#262626] border-[#DDDDDD] dark:border-[#262626]"
                  placeholder="🏆"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points" className="text-[#262626] dark:text-white">
                  {dictionary.settings.medalPoints}
                </Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                  className="bg-white dark:bg-[#262626] border-[#DDDDDD] dark:border-[#262626]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border-2 border-[#DDDDDD] dark:border-[#262626]">
              <Label htmlFor="isActive" className="text-[#262626] dark:text-white">
                {dictionary.settings.isActive}
              </Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-[#DDDDDD] dark:border-[#262626]"
            >
              {dictionary.common.cancel}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || !formData.nameAr}
              className="bg-[#FF5F02] hover:bg-[#262626] text-white"
            >
              {dictionary.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDelete}
        title={dictionary.settings.deleteMedal}
        description={dictionary.settings.deleteMedalConfirm}
      />
    </>
  );
}
