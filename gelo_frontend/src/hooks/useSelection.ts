import { useState, useCallback } from "react";

export function useSelection<T>(items: T[], idKey: keyof T) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === items.length && items.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((item: any) => item[idKey]));
    }
  }, [selectedIds, items, idKey]);

  const toggleSelectOne = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    selectedIds,
    toggleSelectAll,
    toggleSelectOne,
    clearSelection,
    isSelectedAll: items.length > 0 && selectedIds.length === items.length,
    isSomeSelected: selectedIds.length > 0,
  };
}
