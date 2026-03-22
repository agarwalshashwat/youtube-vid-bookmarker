import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Clipmark, SortOrder, ViewMode, Density } from '@clipmark/types';
import { getAllClipmarks } from '@clipmark/core';

export interface DashboardState {
  allBookmarks: Clipmark[];
  filteredBookmarks: Clipmark[];
  filterQuery: string;
  filterVideoId: string | null;
  sortOrder: SortOrder;
  viewMode: ViewMode;
  density: Density;
  selectedIds: Set<number>;
  loading: boolean;
  setFilterQuery: (q: string) => void;
  setFilterVideoId: (id: string | null) => void;
  setSortOrder: (s: SortOrder) => void;
  setViewMode: (v: ViewMode) => void;
  setDensity: (d: Density) => void;
  toggleSelect: (id: number) => void;
  clearSelection: () => void;
  reload: () => void;
}

export function useDashboard(): DashboardState {
  const [allBookmarks, setAllBookmarks] = useState<Clipmark[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterVideoId, setFilterVideoId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    (localStorage.getItem('bm_sortOrder') as SortOrder) || 'newest'
  );
  const [viewMode, setViewMode] = useState<ViewMode>(
    (localStorage.getItem('bm_viewMode') as ViewMode) || 'cards'
  );
  const [density, setDensity] = useState<Density>(
    (localStorage.getItem('bm_density') as Density) || 'default'
  );
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const clipmarks = await getAllClipmarks();
      setAllBookmarks(clipmarks);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    const listener = () => reload();
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [reload]);

  const filteredBookmarks = useMemo(() => {
    let result = [...allBookmarks];

    if (filterVideoId) {
      result = result.filter(b => b.videoId === filterVideoId);
    }

    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      result = result.filter(b =>
        (b.description || '').toLowerCase().includes(q) ||
        (b.videoTitle  || '').toLowerCase().includes(q) ||
        (b.tags || []).some(t => t.includes(q))
      );
    }

    switch (sortOrder) {
      case 'newest':    result.sort((a, b) => b.id - a.id); break;
      case 'oldest':    result.sort((a, b) => a.id - b.id); break;
      case 'timestamp': result.sort((a, b) => a.timestamp - b.timestamp); break;
    }

    return result;
  }, [allBookmarks, filterQuery, filterVideoId, sortOrder]);

  const handleSetViewMode = (v: ViewMode) => {
    setViewMode(v);
    localStorage.setItem('bm_viewMode', v);
  };

  const handleSetDensity = (d: Density) => {
    setDensity(d);
    localStorage.setItem('bm_density', d);
  };

  const handleSetSortOrder = (s: SortOrder) => {
    setSortOrder(s);
    localStorage.setItem('bm_sortOrder', s);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  return {
    allBookmarks,
    filteredBookmarks,
    filterQuery,
    filterVideoId,
    sortOrder,
    viewMode,
    density,
    selectedIds,
    loading,
    setFilterQuery,
    setFilterVideoId,
    setSortOrder: handleSetSortOrder,
    setViewMode: handleSetViewMode,
    setDensity: handleSetDensity,
    toggleSelect,
    clearSelection,
    reload,
  };
}
