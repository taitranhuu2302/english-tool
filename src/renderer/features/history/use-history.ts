import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bridge } from "../../lib/bridge";
import { showSuccess } from "../../lib/toast";
import type { HistoryItem, HistoryItemType } from "../../../shared/types";

export const HISTORY_KEY = ["history"] as const;

export function useHistory(
  opts: { type?: HistoryItemType; limit?: number } = {},
) {
  const qc = useQueryClient();

  const query = useQuery<HistoryItem[]>({
    queryKey: [...HISTORY_KEY, opts.type, opts.limit],
    queryFn: () => bridge.history.list({ type: opts.type, limit: opts.limit }),
  });

  const clearMutation = useMutation({
    mutationFn: () => bridge.history.clear(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: HISTORY_KEY });
      showSuccess("History cleared");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bridge.history.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: HISTORY_KEY });
    },
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    clear: clearMutation.mutate,
    isClearPending: clearMutation.isPending,
    deleteItem: deleteMutation.mutate,
  };
}
