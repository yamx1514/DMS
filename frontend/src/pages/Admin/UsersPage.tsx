import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface Permission {
  id: string;
  name: string;
  description?: string;
}

interface UserSummary {
  id: string;
  name: string;
  email: string;
  roles: Role["id"][];
  permissions: Permission["id"][];
  status?: "active" | "disabled";
  createdAt?: string;
  updatedAt?: string;
}

interface UserFormState {
  id?: string;
  name: string;
  email: string;
  password?: string;
  roles: string[];
  permissions: string[];
  status: "active" | "disabled";
}

type FeedbackKind = "success" | "error" | "info";

interface FeedbackMessage {
  kind: FeedbackKind;
  message: string;
}

const MANAGEMENT_ENDPOINTS = {
  users: "/api/management/users",
  roles: "/api/management/roles",
  permissions: "/api/management/permissions",
};

const emptyForm: UserFormState = {
  name: "",
  email: "",
  password: "",
  roles: [],
  permissions: [],
  status: "active",
};

const createEmptyFormState = (): UserFormState => ({ ...emptyForm });

const emailRegex = /^(?:[^\s@]+@[^\s@]+\.[^\s@]+)?$/;

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isMetaLoading, setIsMetaLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof UserFormState, string>>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<UserFormState>(() => createEmptyFormState());

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setFormErrors({});
    setFormState(createEmptyFormState());
  }, []);

  const withFeedback = useCallback((message: FeedbackMessage | null, timeout = 6000) => {
    setFeedback(message);

    if (message && typeof window !== "undefined") {
      window.setTimeout(() => {
        setFeedback((current) => (current === message ? null : current));
      }, timeout);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsUsersLoading(true);
    setFeedback(null);

    try {
      const response = await fetch(MANAGEMENT_ENDPOINTS.users, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unable to load users.");
      }

      const data: UserSummary[] = await response.json();
      setUsers(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load users.";
      withFeedback({ kind: "error", message });
    } finally {
      setIsUsersLoading(false);
    }
  }, [withFeedback]);

  const fetchMeta = useCallback(async () => {
    setIsMetaLoading(true);

    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        fetch(MANAGEMENT_ENDPOINTS.roles, { credentials: "include" }),
        fetch(MANAGEMENT_ENDPOINTS.permissions, { credentials: "include" }),
      ]);

      if (!rolesResponse.ok) {
        throw new Error("Unable to load roles.");
      }

      if (!permissionsResponse.ok) {
        throw new Error("Unable to load permissions.");
      }

      const rolesData: Role[] = await rolesResponse.json();
      const permissionsData: Permission[] = await permissionsResponse.json();
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load management metadata.";
      withFeedback({ kind: "error", message });
    } finally {
      setIsMetaLoading(false);
    }
  }, [withFeedback]);

  useEffect(() => {
    fetchUsers();
    fetchMeta();
  }, [fetchUsers, fetchMeta]);

  const isEditing = Boolean(formState.id);

  const startCreate = () => {
    setFormState(createEmptyFormState());
    setIsModalOpen(true);
    setFormErrors({});
  };

  const startEdit = (user: UserSummary) => {
    setFormState({
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles ?? [],
      permissions: user.permissions ?? [],
      status: user.status ?? "active",
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const toggleSelection = (key: "roles" | "permissions", value: string) => {
    setFormState((current) => {
      const alreadySelected = current[key].includes(value);
      const updatedValues = alreadySelected
        ? current[key].filter((entry) => entry !== value)
        : [...current[key], value];

      return {
        ...current,
        [key]: updatedValues,
      };
    });
  };

  const validateForm = (state: UserFormState) => {
    const validationErrors: Partial<Record<keyof UserFormState, string>> = {};

    if (!state.name.trim()) {
      validationErrors.name = "Name is required.";
    }

    if (!state.email.trim()) {
      validationErrors.email = "Email is required.";
    } else if (!emailRegex.test(state.email)) {
      validationErrors.email = "Enter a valid email address.";
    }

    if (!isEditing && !state.password?.trim()) {
      validationErrors.password = "Password is required when creating a user.";
    }

    if (!state.roles.length) {
      validationErrors.roles = "Select at least one role.";
    }

    return validationErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const validationErrors = validateForm(formState);
    setFormErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSaving(true);

    try {
      const payload: Partial<UserFormState> = {
        name: formState.name.trim(),
        email: formState.email.trim(),
        roles: formState.roles,
        permissions: formState.permissions,
        status: formState.status,
      };

      if (!isEditing && formState.password) {
        payload.password = formState.password;
      }

      const endpoint = isEditing
        ? `${MANAGEMENT_ENDPOINTS.users}/${encodeURIComponent(formState.id ?? "")}`
        : MANAGEMENT_ENDPOINTS.users;

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message =
          (errorBody && (errorBody.message || errorBody.error)) ||
          (isEditing ? "Unable to update user." : "Unable to create user.");
        throw new Error(message);
      }

      withFeedback({
        kind: "success",
        message: isEditing ? "User updated successfully." : "User created successfully.",
      });

      await fetchUsers();
      closeModal();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isEditing
          ? "An unexpected error occurred while updating the user."
          : "An unexpected error occurred while creating the user.";
      withFeedback({ kind: "error", message });
    } finally {
      setIsSaving(false);
    }
  };

  const modalTitle = isEditing ? "Edit user" : "Create user";

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  return (
    <div className="users-page">
      <header className="users-page__header">
        <div>
          <h1>Users</h1>
          <p>Manage platform accounts, assign roles, and configure permissions.</p>
        </div>
        <button type="button" className="users-page__create" onClick={startCreate}>
          + New user
        </button>
      </header>

      {feedback ? (
        <div className={`users-page__feedback users-page__feedback--${feedback.kind}`}>
          {feedback.message}
        </div>
      ) : null}

      <section className="users-page__content">
        {isUsersLoading ? (
          <p className="users-page__loading">Loading users…</p>
        ) : sortedUsers.length === 0 ? (
          <p className="users-page__empty">No users found.</p>
        ) : (
          <table className="users-page__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Permissions</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.roles.join(", ") || "—"}</td>
                  <td>{user.permissions.join(", ") || "—"}</td>
                  <td>{user.status === "disabled" ? "Disabled" : "Active"}</td>
                  <td>
                    <button type="button" onClick={() => startEdit(user)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {isModalOpen ? (
        <div className="users-page__modal" role="dialog" aria-modal="true">
          <div className="users-page__modal-backdrop" onClick={closeModal} />
          <div className="users-page__modal-content" role="document">
            <header className="users-page__modal-header">
              <h2>{modalTitle}</h2>
              <button type="button" onClick={closeModal} aria-label="Close dialog">
                ×
              </button>
            </header>

            <form className="users-page__form" onSubmit={handleSubmit} noValidate>
              <div className="users-page__form-field">
                <label htmlFor="user-name">Name</label>
                <input
                  id="user-name"
                  name="name"
                  type="text"
                  value={formState.name}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.name ? <span className="users-page__error">{formErrors.name}</span> : null}
              </div>

              <div className="users-page__form-field">
                <label htmlFor="user-email">Email</label>
                <input
                  id="user-email"
                  name="email"
                  type="email"
                  value={formState.email}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.email ? <span className="users-page__error">{formErrors.email}</span> : null}
              </div>

              {!isEditing ? (
                <div className="users-page__form-field">
                  <label htmlFor="user-password">Temporary password</label>
                  <input
                    id="user-password"
                    name="password"
                    type="password"
                    value={formState.password ?? ""}
                    onChange={handleInputChange}
                    required
                  />
                  {formErrors.password ? <span className="users-page__error">{formErrors.password}</span> : null}
                </div>
              ) : null}

              <fieldset className="users-page__form-field">
                <legend>Roles</legend>
                {formErrors.roles ? <span className="users-page__error">{formErrors.roles}</span> : null}

                {isMetaLoading ? (
                  <p>Loading roles…</p>
                ) : roles.length === 0 ? (
                  <p>No roles available.</p>
                ) : (
                  <ul className="users-page__choices">
                    {roles.map((role) => {
                      const isChecked = formState.roles.includes(role.id);
                      return (
                        <li key={role.id}>
                          <label>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelection("roles", role.id)}
                            />
                            <span className="users-page__choice-label">
                              <strong>{role.name}</strong>
                              {role.description ? <small>{role.description}</small> : null}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </fieldset>

              <fieldset className="users-page__form-field">
                <legend>Permissions</legend>
                {isMetaLoading ? (
                  <p>Loading permissions…</p>
                ) : permissions.length === 0 ? (
                  <p>No permissions available.</p>
                ) : (
                  <ul className="users-page__choices">
                    {permissions.map((permission) => {
                      const isChecked = formState.permissions.includes(permission.id);
                      return (
                        <li key={permission.id}>
                          <label>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelection("permissions", permission.id)}
                            />
                            <span className="users-page__choice-label">
                              <strong>{permission.name}</strong>
                              {permission.description ? <small>{permission.description}</small> : null}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </fieldset>

              <div className="users-page__form-field">
                <label htmlFor="user-status">Status</label>
                <select
                  id="user-status"
                  name="status"
                  value={formState.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              <footer className="users-page__form-actions">
                <button type="button" onClick={closeModal} className="users-page__btn-secondary" disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className="users-page__btn-primary" disabled={isSaving}>
                  {isSaving ? (isEditing ? "Saving…" : "Creating…") : isEditing ? "Save changes" : "Create user"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UsersPage;
