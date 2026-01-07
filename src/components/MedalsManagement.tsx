'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Award, Plus, Edit, Trash2, Sparkles } from 'lucide-react';
import type { Medal } from '@/lib/db/repositories/medalRepository';
import { getMedalsAction, createMedalAction, updateMedalAction, deleteMedalAction } from '@/lib/actions/medalActions';
import { ConfirmDialog } from './ConfirmDialog';
import toast from 'react-hot-toast';

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
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    points: 10,
    icon: '🏆',
    isActive: true,
  });

  const cardShell = 'bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] rounded-2xl shadow-lg relative overflow-hidden';
  const subtleText = 'text-gray-600 dark:text-gray-400';
  const fieldLabelClass = 'text-sm font-semibold text-[#262626] dark:text-white';
  const inputClass = 'h-12 bg-white dark:bg-[#111114] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500';
  const textareaClass = 'min-h-[100px] bg-white dark:bg-[#111114] border-2 border-[#DDDDDD] dark:border-[#000000] text-[#262626] dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500';

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
    setSaving(true);
    try {
      if (editingMedal) {
        const result = await updateMedalAction(editingMedal.id, formData);
        if (result.success) {
          toast.success(dictionary.common?.saved || 'Medal updated successfully');
          loadMedals();
          setDialogOpen(false);
        } else {
          toast.error(result.error || 'Failed to update medal');
        }
      } else {
        const result = await createMedalAction(formData);
        if (result.success) {
          toast.success(dictionary.common?.created || 'Medal created successfully');
          loadMedals();
          setDialogOpen(false);
        } else {
          toast.error(result.error || 'Failed to create medal');
        }
      }
    } catch (error) {
      console.error('Save medal error:', error);
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!medalToDelete) return;

    try {
      const result = await deleteMedalAction(medalToDelete);
      if (result.success) {
        toast.success(dictionary.common?.deleted || 'Medal deleted successfully');
        loadMedals();
        setDeleteConfirmOpen(false);
        setMedalToDelete(null);
      } else {
        toast.error(result.error || 'Failed to delete medal');
      }
    } catch (error) {
      console.error('Delete medal error:', error);
      toast.error('An error occurred');
    }
  };

  const openDeleteConfirm = (medalId: string) => {
    setMedalToDelete(medalId);
    setDeleteConfirmOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-9 w-9 rounded-full border-2 border-gray-200 dark:border-white/10 border-t-purple-600"
        />
        <span className="ml-3 text-sm text-gray-600 dark:text-white/70">{dictionary.common.loading}</span>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/95 dark:bg-[#262626]/95 backdrop-blur-xl shadow-xl mb-6"
      >
        <motion.div
          className="absolute inset-0 bg-linear-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ rotate: [0, -5, 5, -5, 0], scale: 1.1 }}
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center"
              >
                <Award className="h-7 w-7 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400" />
              </motion.div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#262626] dark:text-white flex items-center gap-2">
                  {dictionary.settings.medals}
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                  </motion.div>
                </h1>
                <p className={`${subtleText} mt-2`}>Manage achievement medals and rewards</p>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <div className="relative overflow-hidden rounded-2xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-white/80 dark:bg-[#262626]/80 backdrop-blur-xl shadow-lg">
                <motion.div
                  className="absolute inset-0 bg-linear-to-r from-blue-600/8 via-purple-600/8 to-pink-600/8"
                  animate={{ opacity: [0.35, 0.6, 0.35] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="relative p-2">
                  <Button
                    onClick={() => handleOpenDialog()}
                    className="h-12 w-full justify-center rounded-xl border-2 border-black/60 bg-[#0b0b0f] text-white hover:bg-[#14141a] px-6"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="font-semibold">{dictionary.settings.createMedal}</span>
                    <Sparkles className="h-4 w-4 ml-2 text-white/80" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <Card className={cardShell}>
        <CardHeader className="bg-gray-50 dark:bg-[#1a1a1a] border-b-2 border-[#DDDDDD] dark:border-[#000000]">
          <CardTitle className="text-xl font-black text-[#262626] dark:text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl border-2 border-[#DDDDDD] dark:border-[#000000] bg-linear-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            {dictionary.settings.medals}
          </CardTitle>
          <CardDescription className={subtleText}>
            {'Showing'} {medals.length} {medals.length === 1 ? 'medal' : 'medals'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {medals.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border-2 border-dashed border-[#DDDDDD] dark:border-[#000000]">
              <Award className="w-16 h-16 mx-auto text-gray-300 dark:text-white/20 mb-4" />
              <p className="text-[#262626] dark:text-white font-bold">
                {dictionary.settings.noMedals || 'No medals yet'}
              </p>
              <p className={`text-sm mt-2 ${subtleText}`}>Create your first medal to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {medals.map((medal, idx) => (
                <motion.div
                  key={medal.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  whileHover={{ scale: 1.02, rotateX: 1, rotateY: -1 }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className={`${cardShell} p-5`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      className="text-4xl shrink-0"
                    >
                      {medal.icon}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-lg text-[#262626] dark:text-white truncate">
                        {medal.name}
                      </h4>
                      <p className={`text-sm ${subtleText} mt-1 line-clamp-2`}>
                        {medal.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-[#DDDDDD] dark:border-[#000000]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white px-3 py-1.5 rounded-full bg-purple-600">
                        +{medal.points} pts
                      </span>
                      {!medal.isActive && (
                        <span className="text-xs font-bold text-white px-3 py-1.5 rounded-full bg-gray-500">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(medal)}
                        className="h-9 w-9 p-0 border-2 border-blue-500/40 bg-white/80 dark:bg-[#111114] text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-[#1a1a1d]"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDeleteConfirm(medal.id)}
                        className="h-9 w-9 p-0 border-2 border-red-500/40 bg-white/80 dark:bg-[#111114] text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-[#1a1a1d]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-[#262626] border-2 border-[#DDDDDD] dark:border-[#000000] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#262626] dark:text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              {editingMedal ? dictionary.settings.editMedal : dictionary.settings.createMedal}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className={fieldLabelClass}>
                  {dictionary.settings.medalName}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameAr" className={fieldLabelClass}>
                  {dictionary.settings.medalNameAr}
                </Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  className={inputClass}
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className={fieldLabelClass}>
                {dictionary.settings.medalDescription}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={textareaClass}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionAr" className={fieldLabelClass}>
                {dictionary.settings.medalDescriptionAr}
              </Label>
              <Textarea
                id="descriptionAr"
                value={formData.descriptionAr}
                onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                className={textareaClass}
                dir="rtl"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon" className={fieldLabelClass}>
                  {dictionary.settings.medalIcon}
                </Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className={inputClass}
                  placeholder="🏆"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points" className={fieldLabelClass}>
                  {dictionary.settings.medalPoints}
                </Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border-2 border-[#DDDDDD] dark:border-[#000000]">
              <Label htmlFor="isActive" className={fieldLabelClass}>
                {dictionary.settings.isActive}
              </Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="h-12 border-2"
            >
              {dictionary.common.cancel}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || !formData.nameAr || saving}
              className="h-12 bg-[#0b0b0f] text-white hover:bg-[#14141a]"
            >
              {saving ? (dictionary.common?.loading || 'Saving...') : (dictionary.common.save)}
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
