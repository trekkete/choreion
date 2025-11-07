# Database Migrations with Flyway

Choreion uses Flyway for database schema migrations and version control.

## Overview

Flyway automatically runs SQL migration scripts when the application starts, ensuring your database schema is always up-to-date with your code.

## Migration Files

Migration files are located in: `choreion-backend/src/main/resources/migration/`

### Current Migrations:

1. **V001_initial_release.sql** - Creates initial database schema:
   - `users` - User accounts
   - `roles` - User roles (USER, CHOREOGRAPHER, ADMIN)
   - `user_roles` - User-role assignments
   - `projects` - Project containers
   - `people` - People/characters in choreographies
   - `choreographies` - Choreography data
   - `user_person_mappings` - User-to-character mappings

2. **V002__admin_user.sql** - Creates default admin user:
   - **Username**: `admin`
   - **Password**: `trekkete`
   - **Email**: `admin@example.com`
   - **Role**: ROLE_ADMIN

## How It Works

1. **On Application Startup**: Flyway checks the `flyway_schema_history` table
2. **Runs Pending Migrations**: Executes any migrations that haven't run yet
3. **Records Execution**: Logs successful migrations in the history table
4. **Validates Schema**: Ensures database matches expected state

## Migration Naming Convention

```
V<version>__<description>.sql
```

Examples:
- `V001_initial_release.sql`
- `V002__admin_user.sql`
- `V003__add_user_preferences.sql`

**Important**:
- Version numbers must be sequential
- Use double underscore (`__`) after version number
- Once applied, never modify existing migrations

## Configuration

### Development (`application.yml`):
```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:migration
    baseline-on-migrate: true
    baseline-version: 0
    validate-on-migrate: true

  jpa:
    hibernate:
      ddl-auto: validate  # Only validate, don't auto-create
```

### Production (`application-prod.yml`):
```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:migration
    baseline-on-migrate: true
    baseline-version: 0
    validate-on-migrate: true
    clean-disabled: true  # Prevent accidental data loss

  jpa:
    hibernate:
      ddl-auto: validate
```

## Creating New Migrations

1. **Create a new SQL file** in `src/main/resources/migration/`:
   ```
   V003__add_new_feature.sql
   ```

2. **Write your SQL**:
   ```sql
   -- Add new column
   ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);

   -- Create new table
   CREATE TABLE notifications (
       id BIGSERIAL PRIMARY KEY,
       user_id BIGINT NOT NULL,
       message TEXT,
       created_at TIMESTAMP,
       FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```

3. **Restart the application** - Flyway will automatically apply it

## Docker Deployment

When deploying with Docker Compose:

1. **Database starts first** (PostgreSQL container)
2. **Backend waits for database** to be healthy
3. **Flyway runs migrations** automatically on backend startup
4. **Admin user created** via V002 migration

No manual database setup required!

## Checking Migration Status

### View Migration History

Connect to the database and query:
```sql
SELECT * FROM flyway_schema_history;
```

### Via Docker:
```bash
docker-compose exec postgres psql -U postgres -d choreion -c "SELECT * FROM flyway_schema_history;"
```

## Troubleshooting

### "Checksum mismatch"

**Cause**: An existing migration file was modified
**Solution**: Don't modify applied migrations. Create a new migration instead.

### "Migration failed"

**Cause**: SQL error in migration
**Solution**:
1. Check backend logs for details
2. Fix the SQL in a new migration
3. Never modify the failed migration directly

### Repair Flyway History

⚠️ **Use with caution!** This should rarely be needed.

```bash
# Connect to backend container
docker-compose exec backend bash

# Run Flyway repair command
java -jar app.jar --spring.flyway.repair=true
```

### Reset Database (Development Only)

⚠️ **This deletes all data!**

```bash
# Stop containers
docker-compose down -v

# Start fresh
./deploy.sh
```

## Best Practices

1. **Never modify applied migrations** - Always create new ones
2. **Test migrations locally** before deploying
3. **Keep migrations small** - Easier to troubleshoot
4. **Use transactions** - Migrations are wrapped in transactions by default
5. **Backup before major migrations** in production
6. **Version control** - Commit migrations with code changes

## Admin User

After deployment, you can log in with:
- **Username**: `admin`
- **Password**: `trekkete`

⚠️ **Change this password immediately in production!**

To change the admin password:
1. Log in to the application
2. Go to Admin panel
3. Update user password
4. Or create a new migration with a hashed password

## References

- [Flyway Documentation](https://flywaydb.org/documentation/)
- [Spring Boot Flyway Integration](https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto.data-initialization.migration-tool.flyway)
