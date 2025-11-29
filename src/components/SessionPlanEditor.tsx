'use client';

import { useState } from 'react';
import { Plus, Save, Trash2, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createSessionPlanAction, updateSessionPlanAction } from '@/lib/actions/sessionPlanActions';
import type { SessionActivity } from '@/lib/db/repositories/sessionPlanRepository';

interface SessionPlanEditorProps {
  courseId: string;
  sessionNumber: number;
  sessionDate: string;
  existingPlan?: any;
  locale: 'en' | 'ar';
  dictionary: any;
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

  const updateActivity = (index: number, field: string, value: any) => {
    const newActivities = [...activities];
    newActivities[index] = { ...newActivities[index], [field]: value };
    setActivities(newActivities);
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
      alert('Failed to save session plan');
    } finally {
      setLoading(false);
    }
  };

  const activityTypes = [
    { value: 'warmup', label: locale === 'ar' ? 'الإحماء' : 'Warm-up' },
    { value: 'drill', label: locale === 'ar' ? 'تدريب' : 'Drill' },
    { value: 'game', label: locale === 'ar' ? 'لعبة' : 'Game' },
    { value: 'theory', label: locale === 'ar' ? 'نظري' : 'Theory' },
    { value: 'cooldown', label: locale === 'ar' ? 'استرخاء' : 'Cool-down' },
  ];

  return (
    <Card className="bg-white dark:bg-[#262626] border-[#DDDDDD] dark:border-[#262626]">
      <CardHeader>
        <CardTitle className="text-[#262626] dark:text-white">
          {dictionary.courses?.sessionPlan || 'Session Plan'} #{sessionNumber}
        </CardTitle>
        <p className="text-sm text-[#262626] dark:text-[#DDDDDD]">
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
              placeholder="Session title in English"
            />
          </div>
          <div>
            <Label htmlFor="titleAr">{dictionary.common?.title || 'Title'} (AR)</Label>
            <Input
              id="titleAr"
              value={formData.titleAr}
              onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
              placeholder="عنوان الجلسة"
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
              <SelectTrigger>
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
              placeholder="Session description"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="descriptionAr">{dictionary.common?.description || 'Description'} (AR)</Label>
            <Textarea
              id="descriptionAr"
              value={formData.descriptionAr}
              onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
              placeholder="وصف الجلسة"
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
                  placeholder="Objective in English"
                />
                <div className="flex gap-2">
                  <Input
                    value={formData.objectivesAr[index]}
                    onChange={(e) => updateObjective(index, e.target.value, true)}
                    placeholder="الهدف بالعربي"
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
              <Card key={index} className="border-2 border-[#DDDDDD] dark:border-[#262626]">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-[#262626] dark:text-[#DDDDDD]" />
                      <span className="text-sm font-semibold text-[#262626] dark:text-white">
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
                      placeholder="Activity name (EN)"
                    />
                    <Input
                      value={activity.nameAr}
                      onChange={(e) => updateActivity(index, 'nameAr', e.target.value)}
                      placeholder="اسم النشاط"
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
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{dictionary.courses?.type || 'Type'}</Label>
                      <Select
                        value={activity.type}
                        onValueChange={(value) => updateActivity(index, 'type', value)}
                      >
                        <SelectTrigger>
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
                      placeholder="Description (EN)"
                      rows={2}
                    />
                    <Textarea
                      value={activity.descriptionAr}
                      onChange={(e) => updateActivity(index, 'descriptionAr', e.target.value)}
                      placeholder="الوصف"
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
                  placeholder="Material in English"
                />
                <div className="flex gap-2">
                  <Input
                    value={formData.materialsAr[index]}
                    onChange={(e) => updateMaterial(index, e.target.value, true)}
                    placeholder="المادة بالعربي"
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
            <Label htmlFor="notes">{dictionary.common?.notes || 'Notes'} (EN)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="notesAr">{dictionary.common?.notes || 'Notes'} (AR)</Label>
            <Textarea
              id="notesAr"
              value={formData.notesAr}
              onChange={(e) => setFormData({ ...formData, notesAr: e.target.value })}
              placeholder="ملاحظات إضافية"
              rows={3}
              dir="rtl"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-[#DDDDDD] dark:border-[#262626]">
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
            {loading ? (dictionary.common?.saving || 'Saving...') : (dictionary.common?.save || 'Save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
