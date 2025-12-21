'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Save, Trash2, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createSessionPlanAction, updateSessionPlanAction } from '@/lib/actions/sessionPlanActions';
import type { SessionActivity, SessionPlan } from '@/lib/db/repositories/sessionPlanRepository';
import type { Dictionary } from '@/lib/i18n/getDictionary';
import type { Locale } from '@/config/i18n';

interface SessionPlanEditorProps {
  courseId: string;
  sessionNumber: number;
  sessionDate: string;
  existingPlan?: SessionPlan;
  locale: Locale;
  dictionary: Dictionary;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SessionPlanEditor({
  courseId,
  sessionNumber,
  sessionDate,
  existingPlan,
  locale,
  dictionary,
  onSuccess,
  onCancel,
}: SessionPlanEditorProps) {
  type EditableActivity = Omit<SessionActivity, 'id'>;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: existingPlan?.title || '',
    titleAr: existingPlan?.titleAr || '',
    description: existingPlan?.description || '',
    descriptionAr: existingPlan?.descriptionAr || '',
    objectives: existingPlan?.objectives || [''],
    objectivesAr: existingPlan?.objectivesAr || [''],
    materials: existingPlan?.materials || [''],
    materialsAr: existingPlan?.materialsAr || [''],
    notes: existingPlan?.notes || '',
    notesAr: existingPlan?.notesAr || '',
    status: existingPlan?.status || 'planned' as 'planned' | 'in-progress' | 'completed' | 'cancelled',
  });

  const [activities, setActivities] = useState<Omit<SessionActivity, 'id'>[]>(
    existingPlan?.activities || [
      {
        name: '',
        nameAr: '',
        duration: 10,
        description: '',
        descriptionAr: '',
        type: 'drill' as const,
      },
    ]
  );

  const addObjective = () => {
    setFormData({
      ...formData,
      objectives: [...formData.objectives, ''],
      objectivesAr: [...formData.objectivesAr, ''],
    });
  };

  const removeObjective = (index: number) => {
    setFormData({
      ...formData,
      objectives: formData.objectives.filter((_: string, i: number) => i !== index),
      objectivesAr: formData.objectivesAr.filter((_: string, i: number) => i !== index),
    });
  };

  const updateObjective = (index: number, value: string, isArabic: boolean) => {
    if (isArabic) {
      const newObjectivesAr = [...formData.objectivesAr];
      newObjectivesAr[index] = value;
      setFormData({ ...formData, objectivesAr: newObjectivesAr });
    } else {
      const newObjectives = [...formData.objectives];
      newObjectives[index] = value;
      setFormData({ ...formData, objectives: newObjectives });
    }
  };

  const addMaterial = () => {
    setFormData({
      ...formData,
      materials: [...formData.materials, ''],
      materialsAr: [...formData.materialsAr, ''],
    });
  };

  const removeMaterial = (index: number) => {
    setFormData({
      ...formData,
      materials: formData.materials.filter((_: string, i: number) => i !== index),
      materialsAr: formData.materialsAr.filter((_: string, i: number) => i !== index),
    });
  };

  const updateMaterial = (index: number, value: string, isArabic: boolean) => {
    if (isArabic) {
      const newMaterialsAr = [...formData.materialsAr];
      newMaterialsAr[index] = value;
      setFormData({ ...formData, materialsAr: newMaterialsAr });
    } else {
      const newMaterials = [...formData.materials];
      newMaterials[index] = value;
      setFormData({ ...formData, materials: newMaterials });
    }
  };

  const addActivity = () => {
    setActivities([
      ...activities,
      {
        name: '',
        nameAr: '',
        duration: 10,
        description: '',
        descriptionAr: '',
        type: 'drill',
      },
    ]);
  };

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const updateActivity = <K extends keyof EditableActivity>(
    index: number,
    field: K,
    value: EditableActivity[K]
  ) => {
    setActivities((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.titleAr) {
      alert(dictionary.validation?.required || 'Title is required');
      return;
    }

    setLoading(true);

    try {
      const planData = {
        courseId,
        sessionNumber,
        sessionDate,
        title: formData.title,
        titleAr: formData.titleAr,
        description: formData.description,
        descriptionAr: formData.descriptionAr,
        objectives: formData.objectives.filter((o: string) => o.trim()),
        objectivesAr: formData.objectivesAr.filter((o: string) => o.trim()),
        activities: activities.filter((a) => a.name.trim() && a.nameAr.trim()),
        materials: formData.materials.filter((m: string) => m.trim()),
        materialsAr: formData.materialsAr.filter((m: string) => m.trim()),
        notes: formData.notes,
        notesAr: formData.notesAr,
        status: formData.status,
      };

      let result;
      if (existingPlan) {
        result = await updateSessionPlanAction(existingPlan.id, planData);
      } else {
        result = await createSessionPlanAction(planData);
      }

      if (result.success) {
        onSuccess();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Save session plan error:', error);
      alert(dictionary.common?.errors?.saveFailed || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activityTypes = [
    { value: 'warmup', label: dictionary.courses?.warmup || 'Warm-up' },
    { value: 'drill', label: dictionary.courses?.drill || 'Drill' },
    { value: 'game', label: dictionary.courses?.game || 'Game' },
    { value: 'theory', label: dictionary.courses?.theory || 'Theory' },
    { value: 'cooldown', label: dictionary.courses?.cooldown || 'Cool-down' },
  ];

  const placeholders = dictionary.courses?.placeholders || {};
  const fieldClass =
    'rounded-2xl border border-white/10 bg-black/30 text-white placeholder-white/30 focus-visible:ring-2 focus-visible:ring-[#FF5F02]/35';
  const selectTriggerClass =
    'rounded-2xl border border-white/10 bg-black/30 text-white focus:ring-2 focus:ring-[#FF5F02]/35';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
    >
      <Card className="rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/25">
        <CardHeader>
          <CardTitle className="text-white">
          {dictionary.courses?.sessionPlan || 'Session Plan'} #{sessionNumber}
          </CardTitle>
          <p className="text-sm text-white/60">
            {new Date(sessionDate).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { dateStyle: 'long' })}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
        {/* Title and Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="title">{dictionary.common?.title || 'Title'} (EN)</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={placeholders.sessionTitleEn || 'Session title (EN)'}
              className={fieldClass}
            />
          </div>
          <div>
            <Label htmlFor="titleAr">{dictionary.common?.title || 'Title'} (AR)</Label>
            <Input
              id="titleAr"
              value={formData.titleAr}
              onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
              placeholder={placeholders.sessionTitleAr || 'Session title (AR)'}
              className={fieldClass}
              dir="rtl"
            />
          </div>
          <div>
            <Label htmlFor="status">{dictionary.courses?.status || 'Status'}</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'planned' | 'in-progress' | 'completed' | 'cancelled') => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">{dictionary.courses?.planned || 'Planned'}</SelectItem>
                <SelectItem value="in-progress">{dictionary.courses?.inProgress || 'In Progress'}</SelectItem>
                <SelectItem value="completed">{dictionary.courses?.completed || 'Completed'}</SelectItem>
                <SelectItem value="cancelled">{dictionary.courses?.cancelled || 'Cancelled'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="description">{dictionary.common?.description || 'Description'} (EN)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={placeholders.sessionDescriptionEn || 'Session description (EN)'}
              className={fieldClass}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="descriptionAr">{dictionary.common?.description || 'Description'} (AR)</Label>
            <Textarea
              id="descriptionAr"
              value={formData.descriptionAr}
              onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
              placeholder={placeholders.sessionDescriptionAr || 'Session description (AR)'}
              className={fieldClass}
              rows={3}
              dir="rtl"
            />
          </div>
        </div>

        {/* Objectives */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>{dictionary.courses?.objectives || 'Objectives'}</Label>
            <Button type="button" size="sm" onClick={addObjective} variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              {dictionary.common?.add || 'Add'}
            </Button>
          </div>
          <div className="space-y-2">
            {formData.objectives.map((_: string, index: number) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  value={formData.objectives[index]}
                  onChange={(e) => updateObjective(index, e.target.value, false)}
                  placeholder={placeholders.objectiveEn || 'Objective (EN)'}
                  className={fieldClass}
                />
                <div className="flex gap-2">
                  <Input
                    value={formData.objectivesAr[index]}
                    onChange={(e) => updateObjective(index, e.target.value, true)}
                    placeholder={placeholders.objectiveAr || 'Objective (AR)'}
                    className={fieldClass}
                    dir="rtl"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeObjective(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activities */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>{dictionary.courses?.activities || 'Activities'}</Label>
            <Button type="button" size="sm" onClick={addActivity} className="bg-[#FF5F02] hover:bg-[#262626] text-white">
              <Plus className="w-4 h-4 mr-1" />
              {dictionary.common?.add || 'Add'}
            </Button>
          </div>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <Card key={index} className="rounded-3xl border border-white/10 bg-black/20">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-white/70" />
                      <span className="text-sm font-semibold text-white">
                        {dictionary.courses?.activity || 'Activity'} {index + 1}
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeActivity(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      value={activity.name}
                      onChange={(e) => updateActivity(index, 'name', e.target.value)}
                      placeholder={placeholders.activityNameEn || 'Activity name (EN)'}
                      className={fieldClass}
                    />
                    <Input
                      value={activity.nameAr}
                      onChange={(e) => updateActivity(index, 'nameAr', e.target.value)}
                      placeholder={placeholders.activityNameAr || 'Activity name (AR)'}
                      className={fieldClass}
                      dir="rtl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">{dictionary.courses?.duration || 'Duration'} (min)</Label>
                      <Input
                        type="number"
                        value={activity.duration}
                        onChange={(e) => updateActivity(index, 'duration', parseInt(e.target.value))}
                        min={1}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{dictionary.courses?.activityType || 'Activity Type'}</Label>
                      <Select
                        value={activity.type}
                        onValueChange={(value) => updateActivity(index, 'type', value as EditableActivity['type'])}
                      >
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {activityTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Textarea
                      value={activity.description}
                      onChange={(e) => updateActivity(index, 'description', e.target.value)}
                      placeholder={placeholders.activityDescriptionEn || 'Activity description (EN)'}
                      className={fieldClass}
                      rows={2}
                    />
                    <Textarea
                      value={activity.descriptionAr}
                      onChange={(e) => updateActivity(index, 'descriptionAr', e.target.value)}
                      placeholder={placeholders.activityDescriptionAr || 'Activity description (AR)'}
                      className={fieldClass}
                      rows={2}
                      dir="rtl"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Materials */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>{dictionary.courses?.materials || 'Materials'}</Label>
            <Button type="button" size="sm" onClick={addMaterial} variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              {dictionary.common?.add || 'Add'}
            </Button>
          </div>
          <div className="space-y-2">
            {formData.materials.map((_: string, index: number) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  value={formData.materials[index]}
                  onChange={(e) => updateMaterial(index, e.target.value, false)}
                  placeholder={placeholders.materialEn || 'Material (EN)'}
                  className={fieldClass}
                />
                <div className="flex gap-2">
                  <Input
                    value={formData.materialsAr[index]}
                    onChange={(e) => updateMaterial(index, e.target.value, true)}
                    placeholder={placeholders.materialAr || 'Material (AR)'}
                    className={fieldClass}
                    dir="rtl"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeMaterial(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="notes">{dictionary.courses?.notesEn || 'Notes (English)'}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={placeholders.additionalNotesEn || 'Additional notes (EN)'}
              className={fieldClass}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="notesAr">{dictionary.courses?.notesAr || 'Notes (Arabic)'}</Label>
            <Textarea
              id="notesAr"
              value={formData.notesAr}
              onChange={(e) => setFormData({ ...formData, notesAr: e.target.value })}
              placeholder={placeholders.additionalNotesAr || 'Additional notes (AR)'}
              className={fieldClass}
              rows={3}
              dir="rtl"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            {dictionary.common?.cancel || 'Cancel'}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#FF5F02] hover:bg-[#262626] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading
              ? (dictionary.courses?.savingSessionPlan || dictionary.common?.saving || 'Saving...')
              : (dictionary.courses?.saveSessionPlan || dictionary.common?.save || 'Save')}
          </Button>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}
