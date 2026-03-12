export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'editor' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'editor' | 'viewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'editor' | 'viewer'
          created_at?: string
          updated_at?: string
        }
      }
      components: {
        Row: {
          id: string
          name: string
          description: string
          html_template: string
          css_template: string
          schema_json: Json
          thumbnail_url: string | null
          category: string
          usage_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          html_template: string
          css_template?: string
          schema_json?: Json
          thumbnail_url?: string | null
          category?: string
          usage_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          html_template?: string
          css_template?: string
          schema_json?: Json
          thumbnail_url?: string | null
          category?: string
          usage_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      pages: {
        Row: {
          id: string
          slug: string
          title: string
          description: string
          status: 'draft' | 'preview' | 'published'
          parent_id: string | null
          meta_tags: Json
          custom_css: string
          created_by: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description?: string
          status?: 'draft' | 'preview' | 'published'
          parent_id?: string | null
          meta_tags?: Json
          custom_css?: string
          created_by?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          description?: string
          status?: 'draft' | 'preview' | 'published'
          parent_id?: string | null
          meta_tags?: Json
          custom_css?: string
          created_by?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      page_sections: {
        Row: {
          id: string
          page_id: string
          component_id: string
          content_json: Json
          order: number
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          page_id: string
          component_id: string
          content_json?: Json
          order?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          page_id?: string
          component_id?: string
          content_json?: Json
          order?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          url: string
          file_name: string
          file_type: string
          file_size: number
          alt_text: string
          width: number | null
          height: number | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          url: string
          file_name: string
          file_type: string
          file_size?: number
          alt_text?: string
          width?: number | null
          height?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          url?: string
          file_name?: string
          file_type?: string
          file_size?: number
          alt_text?: string
          width?: number | null
          height?: number | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Component = Database['public']['Tables']['components']['Row'];
export type Page = Database['public']['Tables']['pages']['Row'];
export type PageSection = Database['public']['Tables']['page_sections']['Row'];
export type Asset = Database['public']['Tables']['assets']['Row'];

export interface ComponentSchema {
  name: string;
  type: 'text' | 'textarea' | 'image' | 'color' | 'select' | 'url';
  label: string;
  default?: any;
  options?: string[];
}

export interface PageWithSections extends Page {
  sections: (PageSection & { component: Component })[];
}
