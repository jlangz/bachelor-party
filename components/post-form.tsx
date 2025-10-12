'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { RichTextEditor } from './rich-text-editor';
import { X } from 'lucide-react';

export interface PostFormData {
  user_id: string;
  title: string;
  content: string;
}

interface PostFormProps {
  userId: string;
  initialData?: {
    title: string;
    content: string;
  };
  onSubmit: (data: PostFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function PostForm({ userId, initialData, onSubmit, onCancel, submitLabel = 'Post' }: PostFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || content.trim() === '<p></p>') {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        user_id: userId,
        title: title.trim(),
        content: content,
      });
      setTitle('');
      setContent('');
    } catch (error) {
      console.error('Error submitting post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasContent = content.trim() && content.trim() !== '<p></p>';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{initialData ? 'Edit Post' : 'Create New Post'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="text-sm font-medium mb-2 block">
              Title
            </label>
            <Input
              id="title"
              placeholder="What's on your mind?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Content
            </label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Share your thoughts with the group..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim() || !hasContent}>
              {isSubmitting ? 'Posting...' : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
