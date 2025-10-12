'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Prediction, PredictionCategory, PredictionStatus } from '@/lib/supabase';
import { Plus, Edit, Trash2, CheckCircle, X, Clock, Trophy } from 'lucide-react';
import { toast } from 'sonner';

type PredictionsAdminManagerProps = {
  userId: string;
};

export function PredictionsAdminManager({ userId }: PredictionsAdminManagerProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [revealingId, setRevealingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    options: ['', ''],
    category: 'general' as PredictionCategory,
    betting_deadline: '',
    reveal_date: '',
    points_pool: 100,
  });

  // Reveal form state
  const [revealOption, setRevealOption] = useState('');

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      const response = await fetch('/api/predictions');
      if (!response.ok) throw new Error('Failed to load predictions');
      const data = await response.json();
      setPredictions(data);
    } catch (error) {
      console.error('Error loading predictions:', error);
      toast.error('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      options: ['', ''],
      category: 'general',
      betting_deadline: '',
      reveal_date: '',
      points_pool: 100,
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate options
    const validOptions = formData.options.filter((opt) => opt.trim() !== '');
    if (validOptions.length < 2) {
      toast.error('Please provide at least 2 options');
      return;
    }

    const payload = {
      userId,
      ...formData,
      options: validOptions,
      betting_deadline: formData.betting_deadline || null,
      reveal_date: formData.reveal_date || null,
    };

    try {
      let response;
      if (editingId) {
        response = await fetch(`/api/predictions/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/predictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save prediction');
      }

      toast.success(editingId ? 'Prediction updated!' : 'Prediction created!');
      resetForm();
      loadPredictions();
    } catch (error: any) {
      console.error('Error saving prediction:', error);
      toast.error(error.message || 'Failed to save prediction');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prediction? All bets will be lost.')) {
      return;
    }

    try {
      const response = await fetch(`/api/predictions/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error('Failed to delete prediction');

      toast.success('Prediction deleted');
      loadPredictions();
    } catch (error) {
      console.error('Error deleting prediction:', error);
      toast.error('Failed to delete prediction');
    }
  };

  const handleUpdateStatus = async (id: string, status: PredictionStatus) => {
    try {
      const response = await fetch(`/api/predictions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success(`Prediction ${status}`);
      loadPredictions();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleReveal = async (id: string) => {
    if (!revealOption) {
      toast.error('Please select the correct option');
      return;
    }

    // Find the prediction to get the option text for the confirmation
    const prediction = predictions.find(p => p.id === id);
    const optionText = prediction?.options.find(opt => opt.id === revealOption)?.text || revealOption;

    if (!confirm(`Are you sure "${optionText}" is the correct answer? This will calculate all points.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/predictions/${id}/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, correct_option: revealOption }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reveal result');
      }

      toast.success('Result revealed and points calculated!');
      setRevealingId(null);
      setRevealOption('');
      loadPredictions();
    } catch (error: any) {
      console.error('Error revealing result:', error);
      toast.error(error.message || 'Failed to reveal result');
    }
  };

  const startEdit = (prediction: Prediction) => {
    setEditingId(prediction.id);
    // Extract text values from PredictionOption[] for the form
    const optionTexts = prediction.options.map(opt => opt.text);
    setFormData({
      title: prediction.title,
      description: prediction.description || '',
      options: optionTexts,
      category: prediction.category,
      betting_deadline: prediction.betting_deadline ? prediction.betting_deadline.slice(0, 16) : '',
      reveal_date: prediction.reveal_date ? prediction.reveal_date.slice(0, 16) : '',
      points_pool: prediction.points_pool,
    });
    setIsCreating(true);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) {
      toast.error('You need at least 2 options');
      return;
    }
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      {isCreating ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Prediction' : 'Create New Prediction'}</CardTitle>
            <CardDescription>
              Set up a new prediction for guests to bet on
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Who will lose their money first?"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional context or rules..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: PredictionCategory) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="behavior">Behavior</SelectItem>
                    <SelectItem value="outcome">Outcome</SelectItem>
                    <SelectItem value="timing">Timing</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Options * (at least 2)</Label>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    {formData.options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeOption(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="betting_deadline">Betting Deadline</Label>
                  <Input
                    id="betting_deadline"
                    type="datetime-local"
                    value={formData.betting_deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, betting_deadline: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reveal_date">Planned Reveal Date</Label>
                  <Input
                    id="reveal_date"
                    type="datetime-local"
                    value={formData.reveal_date}
                    onChange={(e) => setFormData({ ...formData, reveal_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points_pool">Default Points Pool</Label>
                <Input
                  id="points_pool"
                  type="number"
                  min="10"
                  value={formData.points_pool}
                  onChange={(e) =>
                    setFormData({ ...formData, points_pool: parseInt(e.target.value) || 100 })
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Update Prediction' : 'Create Prediction'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Prediction
        </Button>
      )}

      {/* Predictions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Predictions ({predictions.length})</CardTitle>
          <CardDescription>
            Manage all prediction questions and reveal results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {predictions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No predictions created yet. Create your first one above!
            </p>
          ) : (
            predictions.map((prediction) => {
              return (
                <div key={prediction.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          className={
                            prediction.status === 'open'
                              ? 'bg-blue-500/20 text-blue-400'
                              : prediction.status === 'closed'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                          }
                        >
                          {prediction.status}
                        </Badge>
                        <Badge className="bg-purple-500/20 text-purple-400">
                          {prediction.category}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg">{prediction.title}</h3>
                      {prediction.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {prediction.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-sm space-y-1">
                    <p className="font-medium">Options:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {prediction.options.map((option) => (
                        <li key={option.id}>{option.text}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Reveal Interface */}
                  {prediction.status === 'closed' && revealingId === prediction.id && (
                    <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                      <Label>Select Correct Answer</Label>
                      <Select value={revealOption} onValueChange={setRevealOption}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose the correct option..." />
                        </SelectTrigger>
                        <SelectContent>
                          {prediction.options.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.text}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReveal(prediction.id)}
                          disabled={!revealOption}
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          Reveal Result
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRevealingId(null);
                            setRevealOption('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {prediction.status === 'open' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(prediction)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(prediction.id, 'closed')}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Close Betting
                        </Button>
                      </>
                    )}
                    {prediction.status === 'closed' && revealingId !== prediction.id && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setRevealingId(prediction.id)}
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          Reveal Result
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(prediction.id, 'open')}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Reopen Betting
                        </Button>
                      </>
                    )}
                    {prediction.status === 'revealed' && (
                      <>
                        <Badge className="bg-green-500/20 text-green-500">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Result Revealed
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(prediction.id, 'open')}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Reopen Betting
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(prediction.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
