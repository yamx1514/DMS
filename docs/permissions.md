# Document visibility and permissions

The document service exposes `/documents`, which always filters results according to the
requesting user's context. Clients **must** provide the following headers when calling the
endpoint:

- `X-User-Id`: Unique identifier of the user.
- `X-User-Roles`: Comma-separated list of the user's roles (e.g. `employee,finance`).
- `X-User-Assignments`: Comma-separated list of document identifiers the user is explicitly assigned to.
- `X-Delegated-Teams`: Comma-separated list of teams the user is delegated to manage (sub-admins).

The backend evaluates visibility in the following order:

1. Unauthenticated requests are rejected with `401`.
2. Global administrators (`admin` role) see all documents.
3. Documents explicitly listed in `X-User-Assignments` are always visible to the user.
4. Users can see documents when their identifier appears in the document's assignment list.
5. If any of the user's roles intersect with the document's `requiredRoles`, the document is visible.
6. Sub-admins can access documents belonging to teams declared in `X-Delegated-Teams`.

The frontend's `useDocuments` hook automatically passes the user's context in these headers
when fetching documents. Routing guards in `frontend/src/routes/index.tsx` prevent users
without the necessary roles or delegated teams from accessing restricted pages.

## Examples

- A regular employee with role `employee` and assignment `doc-employee-handbook` receives only that
  document.
- A finance analyst with role `finance` can access any document that requires the `finance` role.
- A sub-admin delegated to the `north` team will see all documents tagged with the `north` team,
  plus any documents they are directly assigned.
