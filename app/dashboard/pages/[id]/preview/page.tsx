'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Page, PageSection, Component } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type PageSectionWithComponent = PageSection & { component: Component };

export default function PagePreviewPage() {
  const params = useParams();
  const pageId = params.id as string;
  const [page, setPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<PageSectionWithComponent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPage();
  }, [pageId]);

  const loadPage = async () => {
    const { data: pageData, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .maybeSingle();

    if (pageError || !pageData) {
      setLoading(false);
      return;
    }

    setPage(pageData);

    const { data: sectionsData, error: sectionsError } = await supabase
      .from('page_sections')
      .select('*, component:components(*)')
      .eq('page_id', pageId)
      .eq('is_visible', true)
      .order('order');

    if (!sectionsError && sectionsData) {
      setSections(sectionsData as any);
    }

    setLoading(false);
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

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!page) {
    return <div className="flex items-center justify-center h-screen">Page not found</div>;
  }

  const allStyles = [
    ...sections.map((s) => s.component.css_template),
    page.custom_css,
  ].join('\n');

  return (
    <>
      {allStyles && (
        <style dangerouslySetInnerHTML={{ __html: allStyles }} />
      )}
      <div className="min-h-screen">
        <div className="fixed top-0 left-0 right-0 bg-slate-900 text-white px-4 py-3 flex items-center justify-between z-50">
          <div className="flex items-center space-x-4">
            <Link href={`/dashboard/pages/${pageId}/edit`}>
              <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-slate-800">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Editor
              </Button>
            </Link>
            <div>
              <span className="font-semibold">{page.title}</span>
              <span className="text-slate-400 ml-2 text-sm">Preview Mode</span>
            </div>
          </div>
        </div>

        <div className="pt-16">
          {sections.map((section) => (
            <div
              key={section.id}
              dangerouslySetInnerHTML={{
                __html: renderComponentHTML(section),
              }}
            />
          ))}

          {sections.length === 0 && (
            <div className="flex items-center justify-center h-64 text-slate-400">
              No content to preview
            </div>
          )}
        </div>
      </div>
    </>
  );
}
