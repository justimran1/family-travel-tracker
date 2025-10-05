# AI Coding Agent Instructions for Family Travel Tracker

## Project Overview
The Family Travel Tracker is a web application designed to manage and track family travel plans. It uses the following technologies:
- **Backend**: Node.js with Express.js for server-side logic.
- **Frontend**: EJS templates for dynamic HTML rendering.
- **Database**: Likely SQL-based (queries are defined in `queries.sql`).
- **Styling**: CSS files located in `public/styles/`.

## Codebase Structure
- **`index.js`**: Entry point of the application. Likely sets up the Express server and routes.
- **`db.js`**: Handles database connections and queries.
- **`cloudinary.js`**: Manages Cloudinary integration for media uploads.
- **`views/`**: Contains EJS templates for rendering HTML pages.
- **`public/styles/`**: Contains CSS files for styling the application.
- **`queries.sql`**: Contains raw SQL queries for database operations.

## Developer Workflows
### Running the Application
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   node index.js
   ```
3. Access the application at `http://localhost:3000` (default port).

### Database Setup
- Ensure the database is running and accessible.
- Use the queries in `queries.sql` to set up the required tables and seed data.

### Debugging
- Use `console.log` for debugging server-side code.
- Inspect EJS templates by viewing the rendered HTML in the browser.

## Project-Specific Conventions
- **EJS Templates**: Use the `views/` directory for all HTML rendering. Each route corresponds to an EJS file.
- **CSS Styling**: Place all styles in `public/styles/`. Use `main.css` for global styles and `new.css` for additional or page-specific styles.
- **Database Queries**: Centralize all SQL queries in `queries.sql` for consistency and maintainability.

## Integration Points
- **Cloudinary**: The `cloudinary.js` file handles integration for uploading and managing media files. Ensure Cloudinary credentials are set in the environment variables.
- **Database**: The `db.js` file manages database connections. Update connection settings as needed.

## Examples
### Adding a New Route
1. Define the route in `index.js`:
   ```javascript
   app.get('/new-route', (req, res) => {
       res.render('new');
   });
   ```
2. Create the corresponding EJS file in `views/` (e.g., `new.ejs`).
3. Add any required styles in `public/styles/new.css`.

### Querying the Database
Use the `db.js` file to execute queries. Example:
```javascript
const db = require('./db');
const result = await db.query('SELECT * FROM travels');
```

## Notes
- Follow the existing patterns in `index.js` for route definitions.
- Use semantic HTML and modular CSS for maintainability.
- Keep SQL queries optimized and secure against injection attacks.

---

Feel free to update this file as the project evolves.