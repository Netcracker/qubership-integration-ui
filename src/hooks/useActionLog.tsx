import { api } from "../api/api.ts";
import { ActionLog, ActionLogResponse, RestApiError } from "../api/apiTypes.ts";
import {
  QueryObserverResult,
  RefetchOptions,
  Register,
  useQuery,
} from "@tanstack/react-query";
import { useRef } from "react";
import { useNotificationService } from "./useNotificationService.tsx";

const RANGE_DEFAULT = 1000 * 60 * 60 * 24; // 1 day in ms
const RANGE_MIN = 1000 * 60 * 60 * 6; // 6 hours
const RANGE_MAX = 1000 * 60 * 60 * 48; // 2 days
const CONTENT_SIZE_THRESHOLD = 200;

export const useActionLog = (): {
  isLoading: boolean;
  logsData: ActionLog[];
  refetch: (options?: RefetchOptions) => Promise<
    QueryObserverResult<
      ActionLog[],
      Register extends {
        defaultError: infer TError;
      }
        ? TError
        : Error
    >
  >;
} => {
  const notificationService = useNotificationService();

  const logSources = [
    api.loadSystemCatalogManagementActionsLog,
    api.loadRuntimeCatalogManagementActionsLog,
    api.loadVariablesManagementActionsLog,
  ];

  const sourceRequestStateRef = useRef(
    logSources.map(() => ({
      offset: Date.now(),
      range: RANGE_DEFAULT,
      stopped: false,
    })),
  );

  const allLogsRef = useRef(new Map<string, ActionLog>());

  const actionLogsQuery = useQuery({
    queryKey: ["actionLogs"],
    enabled: true,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const requests = logSources.map((fn, i) => {
        const sourceRequestState = sourceRequestStateRef.current[i];
        if (sourceRequestState.stopped) return Promise.resolve(undefined);
        return fn({
          offsetTime: sourceRequestState.offset,
          rangeTime: sourceRequestState.range,
        });
      });

      const responses = (await Promise.all(requests)) as (
        | ActionLogResponse
        | RestApiError
        | undefined
      )[];

      responses.forEach((res, i) => {
        const currentRequestState = sourceRequestStateRef.current[i];
        if (!res) return;

        if (res instanceof RestApiError) {
          notificationService.requestFailed("Failed to load action logs", {
            type: "error",
            message: res.message,
          });
          currentRequestState.stopped = true;
          return;
        }

        const { actionLogs, recordsAfterRange } = res;
        const hasLogs = actionLogs.length > 0;
        const hasMore = recordsAfterRange > 0;
        const logCount = actionLogs.length;

        if (!hasLogs && hasMore) {
          currentRequestState.range = Math.min(
            currentRequestState.range * 2,
            RANGE_MAX,
          );
        } else if (hasLogs) {
          currentRequestState.range =
            logCount > CONTENT_SIZE_THRESHOLD ? RANGE_MIN : RANGE_DEFAULT;
        }

        currentRequestState.offset -= currentRequestState.range;
        if (!hasMore) currentRequestState.stopped = true;

        actionLogs.forEach((log) => allLogsRef.current.set(log.id, log));
      });

      return Array.from(allLogsRef.current.values()).sort(
        (a, b) => b.actionTime - a.actionTime,
      );
    },
    refetchInterval: 200,
    refetchIntervalInBackground: true,
  });

  return {
    logsData: actionLogsQuery.data ?? [],
    isLoading: actionLogsQuery.isLoading,
    refetch: actionLogsQuery.refetch,
  };
};
