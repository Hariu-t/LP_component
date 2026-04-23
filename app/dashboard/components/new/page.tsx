'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader as Loader2, Plus, Trash2 } from 'lucide-react';
import type { ComponentSchema } from '@/lib/database.types';

export default function NewComponentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    html_template: '',
    css_template: '',
  });
  const [schema, setSchema] = useState<ComponentSchema[]>([]);

  const handleAddField = () => {
    setSchema([
      ...schema,
      {
        name: '',
        type: 'text',
        label: '',
        default: '',
      },
    ]);
  };

  const handleUpdateField = (index: number, field: Partial<ComponentSchema>) => {
    const newSchema = [...schema];
    newSchema[index] = { ...newSchema[index], ...field };
    setSchema(newSchema);
  };

  const handleRemoveField = (index: number) => {
    setSchema(schema.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('components').insert({
        ...formData,
        schema_json: schema,
      } as any);

      if (error) throw error;

      toast.success('Component created successfully');
      router.push('/dashboard/components');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create component');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Component</h1>
        <p className="text-slate-600 mt-1">
          Create a reusable component with customizable properties
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Define the component name, description, and category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Component Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Hero Section"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A hero section with headline, subheadline, and CTA button"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="hero">Hero</SelectItem>
                  <SelectItem value="cta">Call to Action</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="testimonial">Testimonial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template Code</CardTitle>
            <CardDescription>
              Define the HTML structure and styling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="html_template">HTML Template *</Label>
              <Textarea
                id="html_template"
                value={formData.html_template}
                onChange={(e) => setFormData({ ...formData, html_template: e.target.value })}
                placeholder='<div className="hero">
  <h1>{{headline}}</h1>
  <p>{{subheadline}}</p>
  <button>{{ctaText}}</button>
</div>'
                rows={10}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-slate-500">
                Use double curly braces for dynamic values: {'{{'} fieldName {'}}'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="css_template">CSS / Tailwind Classes</Label>
              <Textarea
                id="css_template"
                value={formData.css_template}
                onChange={(e) => setFormData({ ...formData, css_template: e.target.value })}
                placeholder=".hero { padding: 4rem 2rem; text-align: center; }"
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Editable Fields</CardTitle>
            <CardDescription>
              Define which properties can be customized when using this component
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {schema.map((field, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Field {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveField(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Field Name</Label>
                    <Input
                      value={field.name}
                      onChange={(e) => handleUpdateField(index, { name: e.target.value })}
                      placeholder="headline"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value: any) => handleUpdateField(index, { type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="textarea">Text Area</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="color">Color</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="select">Select</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>Label</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                      placeholder="Headline Text"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Default Value</Label>
                    <Input
                      value={field.default || ''}
                      onChange={(e) => handleUpdateField(index, { default: e.target.value })}
                      placeholder="Welcome to our site"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={handleAddField} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Component
          </Button>
        </div>
      </form>
    </div>
  );
}
