import { supabase } from '@/lib/supabase';
import type { Page, PageSection, Component } from '@/lib/database.types';
import { notFound } from 'next/navigation';

type PageSectionWithComponent = PageSection & { component: Component };

interface PageData {
  page: Page;
  sections: PageSectionWithComponent[];
}

async function getPageData(slug: string): Promise<PageData | null> {
  const { data: pageData, error: pageError } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (pageError || !pageData) {
    return null;
  }

  const page = pageData as Page;

  const { data: sectionsData, error: sectionsError } = await supabase
    .from('page_sections')
    .select('*, component:components(*)')
    .eq('page_id', page.id)
    .eq('is_visible', true)
    .order('order');

  if (sectionsError) {
    return null;
  }

  return {
    page,
    sections: (sectionsData as any) || [],
  };
}

function renderComponentHTML(section: PageSectionWithComponent): string {
  let html = section.component.html_template;
  const content = section.content_json as any;

  Object.keys(content).forEach((key) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    html = html.replace(regex, content[key] || '');
  });

  return html;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const data = await getPageData(params.slug);

  if (!data) {
    return {
      title: 'Page Not Found',
    };
  }

  return {
    title: data.page.title,
    description: data.page.description,
    ...(data.page.meta_tags as any),
  };
}

export default async function PublicPage({ params }: { params: { slug: string } }) {
  const data = await getPageData(params.slug);

  if (!data) {
    notFound();
  }

  const { page, sections } = data;

  const allStyles = [
    ...sections.map((s) => s.component.css_template),
    page.custom_css,
  ].join('\n');

  return (
    <>
      {allStyles && (
        <style dangerouslySetInnerHTML={{ __html: allStyles }} />
      )}

      {sections.map((section) => (
        <div
          key={section.id}
          dangerouslySetInnerHTML={{
            __html: renderComponentHTML(section),
          }}
        />
      ))}

      {sections.length === 0 && (
        <div className="flex items-center justify-center h-screen text-slate-400">
          This page has no content yet
        </div>
      )}
    </>
  );
}
