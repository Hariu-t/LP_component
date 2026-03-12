'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Page, PageSection, Component } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Save, Eye, ArrowLeft, Plus, Trash2, GripVertical, Monitor, Tablet, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type PageSectionWithComponent = PageSection & { component: Component };

export default function PageEditorPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.id as string;

  const [page, setPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<PageSectionWithComponent[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    loadPage();
    loadComponents();
  }, [pageId]);

  const loadPage = async () => {
    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .maybeSingle();

    if (pageError || !pageData) {
      toast.error('Failed to load page');
      return;
    }

    setPage(pageData);

    const { data: sectionsData, error: sectionsError } = await supabase
      .from('page_sections')
      .select('*, component:components(*)')
      .eq('page_id', pageId)
      .order('order');

    if (!sectionsError && sectionsData) {
      setSections(sectionsData as any);
    }

    setLoading(false);
  };

  const loadComponents = async () => {
    const { data, error } = await supabase
      .from('components')
      .select('*')
      .order('name');

    if (!error && data) {
      setComponents(data);
    }
  };

  const handleAddSection = async (componentId: string) => {
    const component = components.find((c) => c.id === componentId);
    if (!component) return;

    const defaultContent: any = {};
    const schema = component.schema_json as any[];
    if (Array.isArray(schema)) {
      schema.forEach((field) => {
        defaultContent[field.name] = field.default || '';
      });
    }

    const { data, error } = await supabase
      .from('page_sections')
      .insert({
        page_id: pageId,
        component_id: componentId,
        content_json: defaultContent,
        order: sections.length,
      } as any)
      .select('*, component:components(*)')
      .single();

    if (error) {
      toast.error('Failed to add section');
    } else {
      setSections([...sections, data as any]);
      toast.success('Section added');
    }
  };

  const handleRemoveSection = async (sectionId: string) => {
    const { error } = await supabase
      .from('page_sections')
      .delete()
      .eq('id', sectionId);

    if (error) {
      toast.error('Failed to remove section');
    } else {
      setSections(sections.filter((s) => s.id !== sectionId));
      if (selectedSection === sectionId) {
        setSelectedSection(null);
      }
      toast.success('Section removed');
    }
  };

  const handleUpdateSectionContent = async (sectionId: string, content: any) => {
    const { error } = await supabase
      .from('page_sections')
      .update({ content_json: content } as never)
      .eq('id', sectionId);

    if (error) {
      toast.error('Failed to update content');
    } else {
      setSections(
        sections.map((s) =>
          s.id === sectionId ? { ...s, content_json: content } : s
        )
      );
    }
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    [newSections[index], newSections[targetIndex]] = [
      newSections[targetIndex],
      newSections[index],
    ];

    newSections.forEach((section, idx) => {
      section.order = idx;
      supabase
        .from('page_sections')
        .update({ order: idx } as never)
        .eq('id', section.id)
        .then();
    });

    setSections(newSections);
  };

  const handleSave = async () => {
    setSaving(true);
    toast.success('Changes saved');
    setSaving(false);
  };

  const handlePublish = async () => {
    const { error } = await supabase
      .from('pages')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      } as never)
      .eq('id', pageId);

    if (error) {
      toast.error('Failed to publish page');
    } else {
      toast.success('Page published successfully');
      setPage((prev) => prev ? { ...prev, status: 'published' } : null);
    }
  };

  const renderPreview = () => {
    const viewportWidths = {
      desktop: 'w-full',
      tablet: 'max-w-3xl',
      mobile: 'max-w-md',
    };

    return (
      <div className={`mx-auto transition-all ${viewportWidths[viewport]}`}>
        <div className="bg-white rounded-lg shadow-sm border min-h-screen">
          {sections.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              Add components from the left panel to build your page
            </div>
          ) : (
            sections.map((section, index) => (
              <div
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className={`relative group cursor-pointer transition-all ${
                  selectedSection === section.id
                    ? 'ring-2 ring-blue-500'
                    : 'hover:ring-2 hover:ring-slate-300'
                }`}
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 z-10">
                  {index > 0 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveSection(index, 'up');
                      }}
                    >
                      ↑
                    </Button>
                  )}
                  {index < sections.length - 1 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveSection(index, 'down');
                      }}
                    >
                      ↓
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSection(section.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div
                  className="p-8"
                  dangerouslySetInnerHTML={{
                    __html: renderComponentHTML(section),
                  }}
                />
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderComponentHTML = (section: PageSectionWithComponent) => {
    let html = section.component.html_template;
    const content = section.content_json as any;

    Object.keys(content).forEach((key) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(regex, content[key] || '');
    });

    return html;
  };

  const renderPropertyEditor = () => {
    const section = sections.find((s) => s.id === selectedSection);
    if (!section) {
      return (
        <div className="flex items-center justify-center h-full text-slate-400 text-center p-4">
          Select a section to edit its properties
        </div>
      );
    }

    const schema = section.component.schema_json as any[];
    const content = section.content_json as any;

    return (
      <div className="space-y-6 p-4">
        <div>
          <h3 className="font-semibold text-lg">{section.component.name}</h3>
          <p className="text-sm text-slate-600">{section.component.description}</p>
        </div>

        <Separator />

        {Array.isArray(schema) && schema.length > 0 ? (
          <div className="space-y-4">
            {schema.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label>{field.label}</Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    value={content[field.name] || ''}
                    onChange={(e) =>
                      handleUpdateSectionContent(section.id, {
                        ...content,
                        [field.name]: e.target.value,
                      })
                    }
                    rows={4}
                  />
                ) : field.type === 'select' ? (
                  <Select
                    value={content[field.name] || ''}
                    onValueChange={(value) =>
                      handleUpdateSectionContent(section.id, {
                        ...content,
                        [field.name]: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((option: string) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={field.type}
                    value={content[field.name] || ''}
                    onChange={(e) =>
                      handleUpdateSectionContent(section.id, {
                        ...content,
                        [field.name]: e.target.value,
                      })
                    }
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No editable fields</p>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!page) {
    return <div className="flex items-center justify-center h-screen">Page not found</div>;
  }

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col">
      <div className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/pages">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="font-semibold">{page.title}</h2>
            <p className="text-xs text-slate-500">/{page.slug}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewport === 'desktop' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewport('desktop')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={viewport === 'tablet' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewport('tablet')}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={viewport === 'mobile' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewport('mobile')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>

          <Link href={`/dashboard/pages/${pageId}/preview`} target="_blank">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </Link>

          <Button onClick={handlePublish} size="sm">
            Publish
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r bg-white flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-3">Add Components</h3>
            <Select onValueChange={handleAddSection}>
              <SelectTrigger>
                <SelectValue placeholder="Select a component" />
              </SelectTrigger>
              <SelectContent>
                {components.map((component) => (
                  <SelectItem key={component.id} value={component.id}>
                    {component.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-600 mb-2">
                Page Sections ({sections.length})
              </h4>
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSection === section.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium">
                        {section.component.name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">#{index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <ScrollArea className="flex-1 p-8 bg-slate-50">
          {renderPreview()}
        </ScrollArea>

        <div className="w-80 border-l bg-white">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Properties</h3>
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            {renderPropertyEditor()}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
