'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Component } from '@/lib/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ComponentsPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('components')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load components');
    } else {
      setComponents(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('components')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete component');
    } else {
      toast.success('Component deleted');
      loadComponents();
    }
    setDeleteId(null);
  };

  const filteredComponents = components.filter(
    (component) =>
      component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoryColors: Record<string, string> = {
    hero: 'bg-blue-100 text-blue-800',
    cta: 'bg-green-100 text-green-800',
    form: 'bg-yellow-100 text-yellow-800',
    feature: 'bg-purple-100 text-purple-800',
    testimonial: 'bg-pink-100 text-pink-800',
    general: 'bg-slate-100 text-slate-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Components</h1>
          <p className="text-slate-600 mt-1">
            Manage reusable UI components for your landing pages
          </p>
        </div>
        <Link href="/dashboard/components/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Component
          </Button>
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-slate-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredComponents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-slate-600 mb-4">
              {searchQuery ? 'No components found' : 'No components yet'}
            </p>
            <Link href="/dashboard/components/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create First Component
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredComponents.map((component) => (
            <Card key={component.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg">{component.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {component.description || 'No description'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant="secondary"
                    className={categoryColors[component.category] || categoryColors.general}
                  >
                    {component.category}
                  </Badge>
                  <Badge variant="outline">
                    Used: {component.usage_count}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Link href={`/dashboard/components/${component.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href={`/dashboard/components/${component.id}/edit`}>
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteId(component.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Component</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this component? This action cannot be undone.
              The component will be removed from all pages using it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
