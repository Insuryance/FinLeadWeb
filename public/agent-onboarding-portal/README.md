# Mock Insurance Portal - Frontend

A standalone frontend for the Insurance Agent Onboarding workflow, designed to integrate with the FinLeadAI backend.

## Project Structure

```
mock-insurance-portal-frontend/
├── index.html                 # Login page
├── dashboard.html             # Dashboard (post-login)
├── registration/
│   ├── personal-details.html  # Step 1: Personal information
│   ├── address.html           # Step 2: Address details
│   ├── education.html         # Step 3: Education details
│   ├── previous-agency.html   # Step 4: Previous agency info
│   ├── bank-details.html      # Step 5: Bank details
│   ├── document-upload.html   # Step 6: Document upload
│   ├── review.html            # Step 7: Review & declaration
│   └── success.html           # Final success page
├── assets/
│   ├── css/
│   │   ├── style.css          # Main styles
│   │   ├── form.css           # Form-specific styles
│   │   └── responsive.css     # Mobile responsive
│   ├── js/
│   │   ├── auth.js            # Login/session management
│   │   ├── api.js             # Backend API calls
│   │   ├── form.js            # Form handling & validation
│   │   ├── workflow.js        # Multi-step workflow logic
│   │   └── utils.js           # Utility functions
│   └── images/
│       └── logo.png           # Logo
└── README.md

```

## Setup

1. Open `index.html` in a browser
2. Login with credentials:
   - **Username:** admin
   - **Password:** admin123

## Features

- Multi-step registration workflow
- Form validation
- Document upload
- API integration with backend
- Session management (localStorage)
- Responsive design
- Progress tracking

## API Endpoints

The frontend communicates with the backend at `http://localhost:5001`:

- `POST /api/insurance/login` - User login
- `POST /api/insurance/register` - Candidate registration
- `POST /api/insurance/upload-document` - Document upload
- `GET /api/insurance/case/{caseId}` - Get case details

## Testing

1. Login with credentials
2. Fill out each step of the registration
3. Upload required documents
4. Review and submit
5. See success confirmation
