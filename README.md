# DMS
documents sorting, sharing and reading
DMS/
 ├── client/              # React Frontend
 │   ├── src/
 │   └── public/
 ├── server/              # Node.js Backend
 │   ├── src/
 │   ├── controllers/
 │   ├── middlewares/
 │   ├── models/
 │   ├── routes/
 │   └── utils/
 ├── docs/                # Additional documentation
 ├── tests/
 ├── package.json
 ├── .gitignore
 └── README.md

## Default role seeds

The RBAC layer defined in `backend/accounts/models.py` expects three baseline roles:

| Role        | Slug         | Default permissions summary |
|-------------|--------------|------------------------------|
| Superadmin  | `superadmin` | Full platform administration and delegation to all roles. |
| Sub-admin   | `subadmin`   | Configurable access delegated by Superadmins to manage assigned clients. |
| Client      | `client`     | Reader/uploader permissions required for day-to-day document usage. |

Seed scripts should ensure that the Superadmin role is configured with every available
permission and that its `assignable_roles` relation contains both the Sub-admin and
Client roles so that Superadmins can grant appropriate permissions downstream.
