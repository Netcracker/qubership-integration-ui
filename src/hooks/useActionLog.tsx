import { api } from "../api/api.ts";
import { ActionLog, ActionLogResponse, RestApiError } from "../api/apiTypes.ts";
import {
  InfiniteData,
  InfiniteQueryObserverResult,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRef } from "react";
import { useNotificationService } from "./useNotificationService.tsx";
import { Register } from "react-router";

const RANGE_DEFAULT = 1000 * 60 * 60 * 24; // 1 day in ms
const RANGE_MIN = 1000 * 60 * 60 * 6; // 6 hours
const RANGE_MAX = 1000 * 60 * 60 * 48; // 2 days
const CONTENT_SIZE_THRESHOLD = 200;

export const useActionLog = (): {
  fetchNextPage: () => Promise<
    InfiniteQueryObserverResult<
      InfiniteData<ActionLog[]>,
      Register extends {
        defaultError: infer TError;
      }
        ? TError
        : Error
    >
  >;
  logsData: ActionLog[];
  hasNextPage: boolean;
  isFetching: boolean;
  refresh: () => Promise<void>;
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

  const queryClient = useQueryClient();

  const allLogsRef = useRef(new Map<string, ActionLog>());

  const actionLogsQuery = useInfiniteQuery({
    initialPageParam: Date.now(),
    queryKey: ["actionLogs"],
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
    getNextPageParam: () => {
      return sourceRequestStateRef.current.some((s) => !s.stopped)
        ? Date.now()
        : undefined;
    },
  });

  const logsData =
    actionLogsQuery.data?.pages[actionLogsQuery.data.pages.length - 1] ?? [];

  const refresh = async () => {
    allLogsRef.current.clear();
    sourceRequestStateRef.current = logSources.map(() => ({
      offset: Date.now(),
      range: RANGE_DEFAULT,
      stopped: false,
    }));

    await queryClient.resetQueries({
        queryKey: ["actionLogs"],
        exact: true,
    });
  };

  return {
    logsData,
    fetchNextPage: () => actionLogsQuery.fetchNextPage(),
    hasNextPage: actionLogsQuery.hasNextPage,
    isFetching: actionLogsQuery.isFetching,
    refresh,
  };
};
