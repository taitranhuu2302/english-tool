import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bridge } from "../../lib/bridge";
import type {
  ImproveRequest,
  ImproveResult,
  Result,
} from "../../../shared/types";
import { HISTORY_KEY } from "../history/use-history";

export function useImprove() {
  const qc = useQueryClient();
  return useMutation<Result<ImproveResult>, Error, ImproveRequest>({
    mutationFn: (req) => bridge.improve.run(req),
    onSuccess: () => {
      // Invalidate history so the history panel refreshes
      void qc.invalidateQueries({ queryKey: HISTORY_KEY });
    },
  });
}
