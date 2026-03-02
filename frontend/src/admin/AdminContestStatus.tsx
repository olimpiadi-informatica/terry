import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHourglassStart,
  faSort,
  faSortDown,
  faSortUp,
} from "@fortawesome/free-solid-svg-icons";
import { Trans } from "@lingui/macro";
import { useStatus } from "src/contest/ContestContext";
import { client } from "src/TerryClient";
import { Loading } from "src/components/Loading";
import { UserStatus, UserTaskData } from "src/types/contest";
import { useTriggerUpdate } from "src/hooks/useTriggerUpdate";
import { Loadable } from "src/Loadable";
import { notifyError } from "src/utils";

type SortKey = keyof UserStatus | "total_score" | "task_score";

interface SortConfig {
  key: SortKey;
  direction: "ascending" | "descending";
  taskName?: string;
}

const useSortableData = (
  items: UserStatus[],
  config: SortConfig | null = null,
) => {
  const sortedItems = useMemo(() => {
    if (!items) return [];
    const sortableItems = [...items];
    if (config !== null) {
      sortableItems.sort((a, b) => {
        let aValue: string | number | null | { [name: string]: UserTaskData };
        let bValue: string | number | null | { [name: string]: UserTaskData };

        if (config.key === "task_score" && config.taskName) {
          aValue = a.tasks?.[config.taskName]?.score || 0;
          bValue = b.tasks?.[config.taskName]?.score || 0;
        } else {
          aValue = a[config.key as keyof UserStatus];
          bValue = b[config.key as keyof UserStatus];
        }

        if (aValue === bValue) {
          return 0;
        }
        if (aValue === null) {
          return 1;
        }
        if (bValue === null) {
          return -1;
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return config.direction === "ascending"
            ? aValue - bValue
            : bValue - aValue;
        }

        const stringA = String(aValue).toLowerCase();
        const stringB = String(bValue).toLowerCase();

        if (stringA < stringB) {
          return config.direction === "ascending" ? -1 : 1;
        }
        if (stringA > stringB) {
          return config.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, config]);

  return sortedItems;
};

export function ContestStatusView() {
  const status = useStatus();
  const [usersLoadable, setUsers] = useState<Loadable<UserStatus[]>>(
    Loadable.loading(),
  );
  const tasks = (status.isReady() ? status.value().contest.tasks : null) || [];
  const userMinutesRef = React.createRef<HTMLInputElement>();
  const [selectedUserToken, setSelectedUserToken] = useState<string>("");
  const [reloadUserListHandle, reloadUserList] = useTriggerUpdate();
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [userSearch, setUserSearch] = useState("");
  const [reloadInterval, setReloadInterval] = useState<number>(0);

  useEffect(() => {
    if (reloadInterval > 0) {
      const interval = setInterval(reloadUserList, reloadInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [reloadInterval, reloadUserList]);

  useEffect(() => {
    setUsers(Loadable.loading());
    client
      .adminApi("user_list")
      .then((response: { data: UserStatus[] }) => {
        setUsers(Loadable.of(response.data));
      })
      .catch((error) => {
        setUsers(Loadable.error(error));
        notifyError(error);
      });
  }, [reloadUserListHandle]);

  const sortedUsers = useSortableData(
    usersLoadable.isReady() ? usersLoadable.value() : [],
    sortConfig,
  );

  const requestSort = (key: SortKey, taskName?: string) => {
    let direction: "ascending" | "descending" = "descending";
    if (
      sortConfig
      && sortConfig.key === key
      && sortConfig.direction === "descending"
    ) {
      direction = "ascending";
    }
    setSortConfig({ key, direction, taskName });
  };

  const getSortIcon = (key: SortKey, taskName?: string) => {
    if (!sortConfig) {
      return faSort;
    }
    if (
      sortConfig.key === key
      && (key !== "task_score" || sortConfig.taskName === taskName)
    ) {
      return sortConfig.direction === "ascending" ? faSortUp : faSortDown;
    }
    return faSort;
  };

  const setUserExtraTime = () => {
    if (!userMinutesRef.current || !selectedUserToken) return;

    const minutes = parseInt(userMinutesRef.current.value, 10);
    client.api
      .post(`/admin/set_extra_time/${selectedUserToken}`, [minutes * 60])
      .then(reloadUserList)
      .catch(notifyError);
  };

  if (!status.isReady() || !usersLoadable.isReady()) return <Loading />;

  const users = usersLoadable.value();

  const filteredAndSortedUsers = sortedUsers.filter((user) => `${user.name} ${user.surname} ${user.token}`
    .toLowerCase()
    .includes(userSearch.toLowerCase()));

  const paginatedUsers = pageSize === 0
    ? filteredAndSortedUsers
    : filteredAndSortedUsers.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    );

  const pageCount = pageSize === 0 ? 1 : Math.ceil(filteredAndSortedUsers.length / pageSize);

  return (
    <main>
      <h2>
        <Trans>Contest Status</Trans>
      </h2>
      <div className="modal-body">
        <h2>
          <Trans>Users</Trans>
        </h2>
        {users && users.length > 0 ? (
          <>
            <div className="form-inline mb-3">
              <label htmlFor="userSearch" className="mr-2">
                <Trans>Search User</Trans>
                :
              </label>
              <input
                id="userSearch"
                className="form-control"
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, surname, or token"
              />
              <label htmlFor="pageSize" className="ml-3 mr-2">
                <Trans>Page size</Trans>
                :
              </label>
              <select
                id="pageSize"
                className="form-control"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
              >
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="1000">1000</option>
                <option value="0">
                  <Trans>Unlimited</Trans>
                </option>
              </select>
              <label htmlFor="reloadInterval" className="ml-3 mr-2">
                <Trans>Auto-reload:</Trans>
              </label>
              <select
                id="reloadInterval"
                className="form-control"
                value={reloadInterval}
                onChange={(e) => setReloadInterval(parseInt(e.target.value, 10))}
              >
                <option value="0">
                  <Trans>None</Trans>
                </option>
                <option value="5000">5s</option>
                <option value="30000">30s</option>
                <option value="120000">2m</option>
              </select>
            </div>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th onClick={() => requestSort("token")}>
                    <Trans>Token</Trans>
                    {" "}
                    <FontAwesomeIcon icon={getSortIcon("token")} />
                  </th>
                  <th onClick={() => requestSort("name")}>
                    <Trans>Name</Trans>
                    {" "}
                    <FontAwesomeIcon icon={getSortIcon("name")} />
                  </th>
                  <th onClick={() => requestSort("surname")}>
                    <Trans>Surname</Trans>
                    {" "}
                    <FontAwesomeIcon icon={getSortIcon("surname")} />
                  </th>
                  <th onClick={() => requestSort("role")}>
                    <Trans>Role</Trans>
                    {" "}
                    <FontAwesomeIcon icon={getSortIcon("role")} />
                  </th>
                  <th onClick={() => requestSort("extra_time")}>
                    <Trans>Extra Time</Trans>
                    {" "}
                    <FontAwesomeIcon icon={getSortIcon("extra_time")} />
                  </th>
                  {tasks.length <= 4
                    && tasks.map((task) => (
                      <th
                        key={task.name}
                        onClick={() => requestSort("task_score", task.name)}
                      >
                        {task.name}
                        {" "}
                        <FontAwesomeIcon
                          icon={getSortIcon("task_score", task.name)}
                        />
                      </th>
                    ))}
                  <th onClick={() => requestSort("total_score")}>
                    <Trans>Score</Trans>
                    {" "}
                    <FontAwesomeIcon icon={getSortIcon("total_score")} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.token}>
                    <td>{user.token}</td>
                    <td>{user.name}</td>
                    <td>{user.surname}</td>
                    <td>{user.role}</td>
                    <td>{user.extra_time}</td>
                    {tasks.length <= 4
                      && tasks.map((task) => (
                        <td key={task.name}>
                          {user.tasks?.[task.name]?.score || 0}
                        </td>
                      ))}
                    <td>{user.total_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pageSize !== 0 && (
              <nav>
                <ul className="pagination">
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                    (page) => (
                      <li
                        key={page}
                        className={`page-item ${
                          currentPage === page ? "active" : ""
                        }`}
                      >
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </li>
                    ),
                  )}
                </ul>
              </nav>
            )}
          </>
        ) : (
          <p>
            <Trans>No users found.</Trans>
          </p>
        )}

        <h2 className="mt-4">
          <Trans>Per-Contestant Extra Time</Trans>
        </h2>
        <div className="form-group">
          <label htmlFor="userSelect">
            <Trans>Select User</Trans>
            :
          </label>
          <select
            id="userSelect"
            className="form-control"
            value={selectedUserToken}
            onChange={(e) => setSelectedUserToken(e.target.value)}
          >
            <option value="">
              <Trans>Select a user</Trans>
            </option>
            {filteredAndSortedUsers.map((user) => (
              <option key={user.token} value={user.token}>
                {user.name}
                {" "}
                {user.surname}
                {" "}
                (
                {user.token}
                )
              </option>
            ))}
          </select>
        </div>
        <div className="form-group mb-0">
          <label htmlFor="userMinutes">
            <Trans>Extra time (minutes)</Trans>
            :
          </label>
          <input
            id="userMinutes"
            name="userMinutes"
            type="number"
            ref={userMinutesRef}
            className="form-control"
            required
            defaultValue="0"
          />
        </div>
        <button
          type="button"
          className="btn btn-warning mt-2"
          onClick={setUserExtraTime}
          disabled={!selectedUserToken}
        >
          <FontAwesomeIcon icon={faHourglassStart} />
          {" "}
          <Trans>Set extra time for user</Trans>
        </button>
      </div>
    </main>
  );
}
