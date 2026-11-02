# CEO - Natheelco Taskflow

Taskflow management and CEO dashboard application for Natheelco Al Khaleej.

## Setup & Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Roles & user PINs

The Roles sidebar page lets the dashboard admin create users with unique 4-digit PINs and assign access to dashboard sections. In frontend-only mode, users and permissions are stored in the current browser and can sign in with their PIN. This is a UI convenience only—not server-side authentication or data protection. The connected backend currently authenticates with the shared dashboard PIN; individual user authentication and server-enforced permissions require backend support.

## Foodics Management

The Foodics Management sidebar contains separate libraries for reports, purchase bills, sales bills, VAT reminders, operating procedures, the chart-of-accounts reference, and important documents. Records and uploaded files are stored in IndexedDB in the current browser profile so they persist across reloads on that device. They are not encrypted, backed up, or synchronized; document classifications are organizational labels, not access controls. Use an approved secure company repository for sensitive records.
